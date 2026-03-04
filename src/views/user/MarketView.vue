<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { marketData } from "../../mock/data";

const keyword = ref("");
const activeCategory = ref("All");
const activeSort = ref("recommend");
const router = useRouter();
const marketList = ref(marketData.map((item) => ({ ...item })));

const categories = computed(() => {
  const uniq = new Set(marketList.value.map((item) => item.category));
  return ["All", ...uniq];
});

const tags = computed(() => {
  const all = marketList.value
    .flatMap((item) => String(item.tags).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(all)];
});

const filteredData = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  let list = marketList.value.filter((item) => {
    const hitCategory = activeCategory.value === "All" || item.category === activeCategory.value;
    const haystack = `${item.name} ${item.category} ${item.tags} ${item.seller}`.toLowerCase();
    const hitKeyword = !q || haystack.includes(q);
    return hitCategory && hitKeyword;
  });

  if (activeSort.value === "price-asc") {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (activeSort.value === "price-desc") {
    list = [...list].sort((a, b) => b.price - a.price);
  } else if (activeSort.value === "size-desc") {
    list = [...list].sort((a, b) => parseSize(b.size) - parseSize(a.size));
  }

  return list;
});

function parseSize(raw) {
  const str = String(raw).toUpperCase();
  if (str.endsWith("GB")) return parseFloat(str) * 1024;
  if (str.endsWith("MB")) return parseFloat(str);
  if (str.endsWith("KB")) return parseFloat(str) / 1024;
  return parseFloat(str) || 0;
}

function applyTag(tag) {
  keyword.value = tag;
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
  item.downloads = (item.downloads ?? 0) + 1;
}

function goDetail(id) {
  router.push(`/user/market/${id}`);
}
</script>

<template>
  <section class="market-page">
    <section class="toolbar">
      <div class="toolbar-main">
        <input v-model="keyword" class="search-input" placeholder="按标题、分类、标签或提供方搜索" />
        <select v-model="activeSort" class="sort-select">
          <option value="recommend">推荐排序</option>
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="size-desc">规模从大到小</option>
        </select>
      </div>

      <div class="category-row">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="chip"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <section class="hot-tags">
      <span class="tag-title">热门标签</span>
      <button v-for="tag in tags" :key="tag" type="button" class="tag-pill" @click="applyTag(tag)">
        #{{ tag }}
      </button>
    </section>

    <p class="result-count">当前 {{ filteredData.length }} 个数据集</p>

    <section class="cards-grid">
      <article v-for="item in filteredData" :key="item.id" class="card">
        <div class="card-main">
          <div class="title-row">
            <span class="hot">热</span>
            <h3>{{ item.name }}</h3>
          </div>

          <div class="pill-row">
            <span class="pill">{{ item.category }}</span>
            <span v-for="tag in String(item.tags).split(',')" :key="`${item.id}-${tag}`" class="pill">
              {{ tag.trim() }}
            </span>
          </div>

          <p v-if="item.info" class="info">{{ item.info }}</p>
          <p v-else class="info">高质量结构化数据集，适用于建模、分析与可视化任务。</p>

          <p class="meta-strip">
            <span>规模：{{ item.size }}</span>
            <span>价格：{{ item.price }} 积分</span>
          </p>

          <div class="publisher">
            <span class="avatar">{{ item.seller.charAt(0) }}</span>
            <span class="name">{{ item.seller }}</span>
          </div>
        </div>

        <div class="card-side">
          <div class="stats">
            <button type="button" class="stat-item" @click="toggleLike(item)">
              <img
                class="stat-icon"
                :src="item.liked ? '/img/liked.png' : '/img/like.png'"
                alt="点赞"
              />
              <span>{{ item.likes ?? 0 }}</span>
            </button>
            <button type="button" class="stat-item" @click="toggleFavorite(item)">
              <img
                class="stat-icon"
                :src="item.favorited ? '/img/favorited.png' : '/img/favorite.png'"
                alt="收藏"
              />
              <span>{{ item.stars ?? 0 }}</span>
            </button>
            <button type="button" class="stat-item" @click="handleDownload(item)">
              <img class="stat-icon" src="/img/download.png" alt="下载" />
              <span>{{ item.downloads ?? 0 }}</span>
            </button>
          </div>

          <div class="card-actions">
            <button type="button" class="btn ghost">数据预览</button>
            <button type="button" class="btn primary" @click="goDetail(item.id)">查看详情</button>
          </div>
        </div>
      </article>
    </section>

    <p v-if="filteredData.length === 0" class="empty">当前筛选条件下暂无匹配数据集。</p>
  </section>
</template>

<style scoped>
.market-page {
  display: grid;
  gap: 14px;
}

.toolbar {
  border: 1px solid #dde6f5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.toolbar-main {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  min-width: 180px;
  border: 1px solid #c8d7ee;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.sort-select {
  min-width: 190px;
  border: 1px solid #c8d7ee;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  border: 1px solid #d4e0f2;
  border-radius: 999px;
  padding: 7px 12px;
  color: #3a5474;
  font-size: 13px;
  background: #f7faff;
  cursor: pointer;
}

.chip.active {
  border-color: #204f84;
  color: #fff;
  background: #204f84;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-title {
  margin-right: 6px;
  color: #4a5f7c;
  font-size: 13px;
  font-weight: 600;
}

.tag-pill {
  border: 1px dashed #c8d7ee;
  border-radius: 999px;
  padding: 4px 10px;
  color: #406082;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.result-count {
  margin: 0;
  color: #566b86;
  font-size: 15px;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #d7e3f6;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 8px 16px rgba(20, 49, 86, 0.05);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  left: -14px;
  top: -14px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(64, 128, 196, 0.12) 0%, rgba(64, 128, 196, 0) 70%);
}

.card-main {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 20px;
  border-radius: 10px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(125deg, #ff7f2f, #ff4f2f);
}

.card h3 {
  margin: 0;
  color: #1a2f49;
  font-size: 28px;
  line-height: 1.2;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.pill {
  border: 1px solid #d5dfef;
  border-radius: 8px;
  padding: 3px 8px;
  color: #344e6e;
  font-size: 12px;
  background: #fafcff;
}

.info {
  margin: 10px 0 0;
  color: #6c8098;
  font-size: 14px;
  line-height: 1.55;
}

.meta-strip {
  display: inline-flex;
  gap: 10px;
  margin: 10px 0 0;
  border-radius: 8px;
  padding: 6px 10px;
  color: #6f8199;
  font-size: 12px;
  background: #f0f4fa;
}

.publisher {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #2f5078;
  font-size: 11px;
  font-weight: 700;
  background: #e5edfb;
}

.name {
  color: #364f70;
  font-size: 13px;
}

.card-side {
  min-width: 185px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  z-index: 1;
}

.stats {
  display: flex;
  gap: 12px;
  color: #7c90a8;
  font-size: 13px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 8px;
  padding: 4px 6px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.stat-item:hover {
  background: #f1f6ff;
}

.stat-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.btn {
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 11px;
  cursor: pointer;
}

.btn.ghost {
  border: 1px solid #c7d7ef;
  color: #2f4e74;
  background: #fff;
}

.btn.primary {
  border: 1px solid #244f83;
  color: #fff;
  background: #244f83;
}

.empty {
  margin: 8px 0 0;
  color: #62748d;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .card {
    flex-direction: column;
  }

  .card-side {
    min-width: 0;
    align-items: flex-start;
  }

  .card h3 {
    font-size: 22px;
  }

  .stats {
    font-size: 12px;
  }
}

@media (max-width: 700px) {
  .toolbar-main {
    flex-direction: column;
  }

  .sort-select {
    width: 100%;
  }
}
</style>
