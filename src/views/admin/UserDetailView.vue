<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { adminUsers, marketData, orderList } from "../../mock/data";
import { useNeedsStore } from "../../stores/needs";

const route = useRoute();
const needsStore = useNeedsStore();

const statusOptions = ["正常", "限制上传", "封禁"];
const users = ref(adminUsers.map((item) => ({ ...item })));
const activeTab = ref("个人仓库（已购买的数据）");
const tabs = ["个人仓库（已购买的数据）", "我的数据（本人上传的）", "我的订单", "发布任务", "承接任务"];

const marketList = ref(marketData.map((item) => ({ ...item })));

const user = computed(() => users.value.find((item) => String(item.id) === String(route.params.id)) || null);
const avatarUrl = computed(() => user.value?.avatar || "/img/avatar.png");

const purchasedMap = {
  1001: [1],
  1002: [2, 3],
  1: [1, 2]
};

const orderUserMap = {
  O20260226001: 1001,
  O20260225017: 1002
};

const purchasedDatasets = computed(() => {
  if (!user.value) return [];
  const allowIds = purchasedMap[user.value.id] || [];
  return marketList.value.filter((item) => allowIds.includes(item.id));
});

const uploadedDatasets = computed(() => {
  if (!user.value) return [];
  return marketList.value.filter((item) => item.author === user.value.name || item.seller === user.value.name);
});

const userOrders = computed(() => {
  if (!user.value) return [];
  return orderList.filter((item) => orderUserMap[item.id] === user.value.id);
});

const publishedNeeds = computed(() => {
  if (!user.value) return [];
  return needsStore.allNeeds.filter((item) => item.publisherId === user.value.id || item.publisher === user.value.name);
});

const acceptedNeeds = computed(() => {
  if (!user.value) return [];
  return needsStore.acceptedNeeds.filter((item) => item.acceptedBy === user.value.name);
});

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}
</script>

<template>
  <section v-if="user" class="profile-page">
    <header class="profile-head">
      <img class="avatar" :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
      <div class="head-main">
        <h1>{{ user.name }}</h1>
        <p class="intro">角色：{{ user.role }}</p>
        <p class="points">积分：{{ user.points ?? 0 }}</p>
      </div>
      <div class="head-right">
        <span class="joined">注册时间：{{ user.joinedAt }}</span>
        <el-select v-model="user.status" class="status-select" placeholder="选择状态">
          <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
        </el-select>
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

    <section v-if="activeTab === '个人仓库（已购买的数据）'" class="list-wrap">
      <article v-for="item in purchasedDatasets" :key="item.id" class="list-card">
        <h3>{{ item.name }}</h3>
        <p>{{ item.info }}</p>
      </article>
      <p v-if="!purchasedDatasets.length" class="empty-text">暂无数据。</p>
    </section>

    <section v-else-if="activeTab === '我的数据（本人上传的）'" class="list-wrap">
      <article v-for="item in uploadedDatasets" :key="item.id" class="list-card">
        <h3>{{ item.name }}</h3>
        <p>{{ item.info }}</p>
      </article>
      <p v-if="!uploadedDatasets.length" class="empty-text">暂无数据。</p>
    </section>

    <section v-else-if="activeTab === '我的订单'" class="list-wrap">
      <article v-for="item in userOrders" :key="item.id" class="list-card">
        <h3>{{ item.dataset }}</h3>
        <p>订单号：{{ item.id }} ｜ 金额：{{ item.amount }} ｜ 状态：{{ item.status }} ｜ 创建时间：{{ item.createdAt }}</p>
      </article>
      <p v-if="!userOrders.length" class="empty-text">暂无数据。</p>
    </section>

    <section v-else-if="activeTab === '发布任务'" class="list-wrap">
      <article v-for="item in publishedNeeds" :key="item.id" class="list-card">
        <h3>{{ item.title }}</h3>
        <p>预算：{{ item.budget }} ｜ 截止：{{ item.deadline }} ｜ 状态：{{ item.needStatus }}</p>
      </article>
      <p v-if="!publishedNeeds.length" class="empty-text">暂无数据。</p>
    </section>

    <section v-else class="list-wrap">
      <article v-for="item in acceptedNeeds" :key="item.id" class="list-card">
        <h3>{{ item.title }}</h3>
        <p>发布者：{{ item.publisher }} ｜ 预算：{{ item.budget }} ｜ 状态：{{ item.needStatus }}</p>
      </article>
      <p v-if="!acceptedNeeds.length" class="empty-text">暂无数据。</p>
    </section>
  </section>

  <section v-else class="empty-wrap">
    <p>未找到该用户。</p>
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
  font-size: 34px;
}

.intro {
  margin: 10px 0 0;
  color: #60758f;
}

.points {
  margin: 8px 0 0;
  color: #2f578d;
  font-size: 14px;
  font-weight: 600;
}

.head-right {
  display: grid;
  justify-items: end;
  gap: 12px;
}

.joined {
  color: #8091a8;
  font-size: 14px;
}

.status-select {
  width: 140px;
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

.list-wrap {
  display: grid;
  gap: 10px;
}

.list-card {
  border: 1px solid #e4eaf5;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
}

.list-card h3 {
  margin: 0;
  color: #1f2d40;
  font-size: 20px;
}

.list-card p {
  margin: 8px 0 0;
  color: #5f6d82;
  font-size: 14px;
  line-height: 1.7;
}

.empty-text,
.empty-wrap {
  color: #6f7c90;
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
