<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marketData } from "../../mock/data";
import { ElMessage } from "element-plus";

const route = useRoute();
const router = useRouter();
const dataset = ref(null);

const sourceDataset = computed(() => {
  const id = Number(route.params.id);
  return marketData.find((item) => item.id === id) || null;
});

watch(
  sourceDataset,
  (val) => {
    dataset.value = val ? { ...val } : null;
  },
  { immediate: true }
);

const tags = computed(() => {
  if (!dataset.value) return [];
  return String(dataset.value.tags)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
});

const authorAvatarUrl = computed(() => dataset.value?.authorAvatar || "/img/avatar.png");

function backToMarket() {
  router.push("/user/market");
}

function toggleLike() {
  if (!dataset.value) return;
  if (dataset.value.liked) {
    dataset.value.likes = Math.max(0, (dataset.value.likes ?? 0) - 1);
  } else {
    dataset.value.likes = (dataset.value.likes ?? 0) + 1;
  }
  dataset.value.liked = !dataset.value.liked;
}

function toggleFavorite() {
  if (!dataset.value) return;
  if (dataset.value.favorited) {
    dataset.value.stars = Math.max(0, (dataset.value.stars ?? 0) - 1);
  } else {
    dataset.value.stars = (dataset.value.stars ?? 0) + 1;
  }
  dataset.value.favorited = !dataset.value.favorited;
}

function handleDownload() {
  if (!dataset.value?.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  if (!dataset.value) return;
  dataset.value.downloads = (dataset.value.downloads ?? 0) + 1;
  ElMessage.success("下载成功");
}

function handleBuy() {
  if (!dataset.value || dataset.value.purchased) return;
  dataset.value.purchased = true;
  ElMessage.success("购买成功");
}

function onAuthorAvatarError(event) {
  event.target.src = "/img/avatar.png";
}
</script>

<template>
  <section v-if="dataset" class="detail-page">
    <header class="detail-head">
      <div>
        <h1>{{ dataset.name }}</h1>
        <div class="tag-row">
          <span class="tag">{{ dataset.category }}</span>
          <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <div class="head-meta">
          <span class="author-wrap">
            <img class="avatar" :src="authorAvatarUrl" alt="作者头像" @error="onAuthorAvatarError" />
            <span class="seller">{{ dataset.author || "未知作者" }}</span>
          </span>
          <span>{{ dataset.uploadDate || "2024-01-01" }} 上传</span>
          <span>{{ dataset.size }}</span>
          <span>{{ dataset.price }} 积分</span>
        </div>

        <div class="icon-actions">
          <button type="button" class="icon-btn" @click="toggleLike">
            <img :src="dataset.liked ? '/img/liked.png' : '/img/like.png'" alt="点赞" />
            <span>{{ dataset.likes ?? 0 }}</span>
          </button>
          <button type="button" class="icon-btn" @click="toggleFavorite">
            <img :src="dataset.favorited ? '/img/favorited.png' : '/img/favorite.png'" alt="收藏" />
            <span>{{ dataset.stars ?? 0 }}</span>
          </button>
          <button type="button" class="icon-btn" @click="handleDownload">
            <img src="/img/download.png" alt="下载" />
            <span>{{ dataset.downloads ?? 0 }}</span>
          </button>
        </div>
      </div>

      <button v-if="!dataset.purchased" class="download" @click="handleBuy">购买数据集</button>
      <button v-else class="purchased" type="button" disabled>已购买</button>
    </header>

    <section class="block">
      <h2>数据信息</h2>
      <p>{{ dataset.info || "暂无详细描述。" }}</p>
    </section>

    <section class="block">
      <h2>数据统计</h2>
      <div class="table">
        <div class="row head">
          <span>属性</span>
          <span>描述</span>
        </div>
        <div v-for="item in dataset.summary || []" :key="`${item.key}-${item.value}`" class="row two-col">
          <span>{{ item.key }}</span>
          <span>{{ item.value }}</span>
        </div>
      </div>
    </section>

    <div class="actions">
      <button class="back" @click="backToMarket">返回数据广场</button>
    </div>
  </section>

  <section v-else class="empty">
    <p>未找到对应数据集。</p>
    <button class="back" @click="backToMarket">返回数据广场</button>
  </section>
</template>

<style scoped>

.detail-page {
  border: 1px solid #eceff4;
  border-radius: 18px;
  padding: 24px 28px;
  background: #fff;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eef1f5;
  padding-bottom: 16px;
}

h1 {
  margin: 0;
  color: #232c38;
  font-size: 38px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.tag {
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  padding: 5px 11px;
  color: #4a5768;
  background: #fff;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  color: #6c7788;
}

.author-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  display: block;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #dbe3ef;
}

.seller {
  color: #2f3a4a;
  font-weight: 600;
}

.icon-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  padding: 0;
  color: #5f6b7b;
  background: transparent;
  cursor: pointer;
}

.icon-btn img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.download {
  border: 1px solid #d8b989;
  border-radius: 999px;
  padding: 8px 16px;
  color: #b98335;
  background: #fff;
  cursor: pointer;
}

.purchased {
  border: 1px solid #3aaa5d;
  border-radius: 999px;
  padding: 8px 16px;
  color: #fff;
  background: #3aaa5d;
}

.block {
  margin-top: 26px;
}

h2 {
  margin: 0 0 14px;
  font-size: 30px;
  color: #232c38;
}

h3 {
  margin: 14px 0 10px;
  color: #2f3b4c;
  font-size: 22px;
}

p {
  margin: 0;
  color: #414e5f;
  font-size: 16px;
  line-height: 1.75;
}

.table {
  border-top: 1px solid #edf1f6;
}

.row {
  display: grid;
  grid-template-columns: 1fr 3fr;
}

.row span {
  border-bottom: 1px solid #edf1f6;
  padding: 14px 10px;
  color: #4a5668;
}

.row.head span {
  color: #6f7c90;
  font-weight: 600;
}

.actions,
.empty {
  margin-top: 24px;
}

.back {
  border: 1px solid #d3dae5;
  border-radius: 8px;
  padding: 8px 12px;
  color: #3b4b61;
  background: #fff;
  cursor: pointer;
}

@media (max-width: 900px) {
  h1 {
    font-size: 30px;
  }

  h2 {
    font-size: 26px;
  }

  h3 {
    font-size: 20px;
  }

  .detail-head {
    flex-direction: column;
  }

  .row {
    grid-template-columns: 1fr 2fr;
  }
}
</style>
