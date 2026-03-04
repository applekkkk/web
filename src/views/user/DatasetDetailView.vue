<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marketData } from "../../mock/data";
import { ElMessage } from "element-plus"

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
  if (!dataset.value) return;
  dataset.value.downloads = (dataset.value.downloads ?? 0) + 1;
  ElMessage.success("下载成功")
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
          <span class="seller">{{ dataset.seller }}</span>
          <span>{{ dataset.uploadDate || "2024-01-01" }} 上传</span>
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

      <button class="download" @click="handleDownload">下载数据集</button>
    </header>

    <section class="block">
      <h2>数据信息</h2>
      <p>{{ dataset.info || "暂无详细描述。" }}</p>
    </section>

    <section class="block">
      <h2>数据统计</h2>
      <div class="table">
        <div class="row head">
          <span>指标</span>
          <span>数值</span>
          <span>指标</span>
          <span>数值</span>
        </div>
        <div class="row">
          <span>密度</span>
          <span>{{ dataset.density ?? "-" }}</span>
          <span>节点数</span>
          <span>{{ dataset.nodeCount ?? "-" }}</span>
        </div>
        <div class="row">
          <span>连边数</span>
          <span>{{ dataset.edgeCount ?? "-" }}</span>
          <span>文件规模</span>
          <span>{{ dataset.size }}</span>
        </div>
      </div>
    </section>

    <section class="block">
      <h2>数据源头</h2>
      <h3>数据引文</h3>
      <ul>
        <li v-for="ref in dataset.references || []" :key="ref">{{ ref }}</li>
      </ul>
      <h3>数据来源</h3>
      <p class="link">{{ dataset.sourceUrl || "-" }}</p>
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
  border: 1px solid #dce5f3;
  border-radius: 18px;
  padding: 24px 28px;
  background: #fff;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e7edf7;
  padding-bottom: 16px;
}

h1 {
  margin: 0;
  color: #1d2f47;
  font-size: 46px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.tag {
  border: 1px solid #d4deee;
  border-radius: 8px;
  padding: 5px 11px;
  color: #415a79;
  background: #fafcff;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 14px;
  color: #7b8da4;
}

.seller {
  color: #2a4668;
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
  border-radius: 10px;
  padding: 6px 10px;
  color: #5f748f;
  background: transparent;
  cursor: pointer;
}

.icon-btn:hover {
  background: #f2f7ff;
}

.icon-btn img {
  width: 22px;
  height: 22px;
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

.block {
  margin-top: 24px;
}

h2 {
  margin: 0 0 14px;
  font-size: 40px;
  color: #1c2f47;
}

h3 {
  margin: 14px 0 8px;
  color: #2f4667;
  font-size: 20px;
}

p {
  margin: 0;
  color: #4f627e;
  line-height: 1.75;
}

.table {
  border: 1px solid #e3eaf6;
  border-radius: 10px;
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.row span {
  border-bottom: 1px solid #e8eef8;
  padding: 12px 14px;
  color: #526580;
}

.row.head span {
  color: #7388a2;
  font-weight: 600;
  background: #f6f9fe;
}

ul {
  margin: 0;
  padding-left: 20px;
  color: #40566f;
  line-height: 1.8;
}

.link {
  word-break: break-all;
  color: #375a86;
}

.actions,
.empty {
  margin-top: 24px;
}

.back {
  border: 1px solid #c8d7ee;
  border-radius: 8px;
  padding: 8px 12px;
  color: #335276;
  background: #fff;
  cursor: pointer;
}

@media (max-width: 900px) {
  h1 {
    font-size: 32px;
  }

  h2 {
    font-size: 28px;
  }

  .detail-head {
    flex-direction: column;
  }

  .row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
