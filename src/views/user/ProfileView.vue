<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { marketData } from "../../mock/data";
import { useNeedsStore } from "../../stores/needs";
import { ElMessage } from "element-plus";
import DatasetCard from "../../components/DatasetCard.vue";
import NeedCard from "../../components/NeedCard.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const needsStore = useNeedsStore();

const tabs = [
  "收藏",
  "个人仓库（已购买的数据）",
  "我的数据（本人上传的）",
  "我的订单",
  "发布任务",
  "承接任务"
];

const activeTab = ref(tabs[0]);
const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const userName = computed(() => auth.user?.name || "未命名用户");
const userId = computed(() => auth.user?.id ?? null);
const userBio = computed(() => auth.user?.bio || "快来介绍一下自己");
const today = new Date().toISOString().slice(0, 10);
const marketList = ref(marketData.map((item) => ({ ...item })));

function goEditProfile() {
  router.push(route.path.startsWith("/admin") ? "/admin/profile/edit" : "/user/profile/edit");
}

watch(
  () => route.query.tab,
  (tab) => {
    const value = String(tab || "");
    if (tabs.includes(value)) activeTab.value = value;
  },
  { immediate: true }
);

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}

const datasetTabs = ["收藏", "个人仓库（已购买的数据）", "我的数据（本人上传的）"];
const needTabs = ["发布任务", "承接任务"];

const tabDatasets = computed(() => {
  if (activeTab.value === "收藏") {
    return marketList.value.filter((item) => item.favorited);
  }
  if (activeTab.value === "个人仓库（已购买的数据）") {
    return marketList.value.filter((item) => item.purchased);
  }
  if (activeTab.value === "我的数据（本人上传的）") {
    return marketList.value.filter((item) => item.author === userName.value);
  }
  return [];
});

const tabNeeds = computed(() => {
  if (activeTab.value === "发布任务") {
    return needsStore.allNeeds.filter((item) => {
      if (item.publisherId != null && userId.value != null) return item.publisherId === userId.value;
      if (item.publisher === userName.value) return true;
      return userId.value === 1001 && item.publisher === "普通用户";
    });
  }
  if (activeTab.value === "承接任务") {
    return needsStore.acceptedNeeds.filter((item) => item.acceptedBy === userName.value);
  }
  return [];
});

function goDatasetDetail(id) {
  if (route.path.startsWith("/admin")) return;
  const url = router.resolve({ path: `/user/market/${id}` }).href;
  window.open(url, "_blank");
}

function goNeedDetail(item) {
  if (route.path.startsWith("/admin")) return;
  const url = router.resolve({ path: `/user/custom-bids/${item.id}` }).href;
  window.open(url, "_blank");
}

function toggleLike(item) {
  if (item.liked) {
    item.likes = Math.max(0, (item.likes ?? 0) - 1);
  } else {
    item.likes = (item.likes ?? 0) + 1;
  }
  item.liked = !item.liked;
}

function toggleFavorite(item) {
  if (item.favorited) {
    item.stars = Math.max(0, (item.stars ?? 0) - 1);
  } else {
    item.stars = (item.stars ?? 0) + 1;
  }
  item.favorited = !item.favorited;
}

function handleDownload(item) {
  if (!item.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  item.downloads = (item.downloads ?? 0) + 1;
  ElMessage.success("下载成功");
}
</script>

<template>
  <section class="profile-page">
    <header class="profile-head">
      <img class="avatar" :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
      <div class="head-main">
        <h1>{{ userName }}</h1>
        <p class="intro">{{ userBio }}</p>
      </div>
      <div class="head-right">
        <span class="last-login">上次登录时间：{{ today }}</span>
        <button class="edit-btn" @click="goEditProfile">编辑个人资料</button>
      </div>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <template v-if="datasetTabs.includes(activeTab)">
      <section v-if="tabDatasets.length" class="cards-grid">
        <DatasetCard
          v-for="item in tabDatasets"
          :key="item.id"
          :item="item"
          @open="goDatasetDetail(item.id)"
          @like="toggleLike"
          @favorite="toggleFavorite"
          @download="handleDownload"
        />
      </section>
      <p v-else class="empty-text">当前栏目暂无数据。</p>
    </template>

    <template v-else-if="needTabs.includes(activeTab)">
      <section v-if="tabNeeds.length" class="cards-grid">
        <NeedCard
          v-for="item in tabNeeds"
          :key="item.id"
          :item="item"
          :show-action="false"
          clickable
          @open="goNeedDetail"
        />
      </section>
      <p v-else class="empty-text">当前栏目暂无任务。</p>
    </template>

    <p v-else class="content-tip">该栏目内容正在建设中。</p>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 16px;
}

.profile-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  border-radius: 18px;
  padding: 20px 24px;
  background: linear-gradient(145deg, #e8f0fb, #f3f7ff);
  border: 1px solid #d9e4f5;
}

.avatar {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}

.head-main h1 {
  margin: 0;
  color: #1f2a37;
  font-size: 40px;
}

.intro {
  margin: 10px 0 0;
  color: #8a96a6;
}

.head-right {
  display: grid;
  justify-items: end;
  gap: 12px;
}

.last-login {
  color: #8091a8;
  font-size: 14px;
}

.edit-btn {
  border: 1px solid #c3d3ee;
  border-radius: 999px;
  padding: 8px 18px;
  color: #2f578d;
  background: #fff;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e6e9ef;
  padding-bottom: 10px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #3f4b5c;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #2c7cf6;
  border-bottom-color: #2c7cf6;
}

.content-tip {
  margin: 10px 0 0;
  color: #718096;
}

.cards-grid {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-text {
  color: #7b8797;
}

@media (max-width: 900px) {
  .profile-head {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .head-right {
    justify-items: start;
  }
}
</style>
