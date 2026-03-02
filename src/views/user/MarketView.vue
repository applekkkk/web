<script setup>
import { computed, ref } from "vue";
import { marketData } from "../../mock/data";

const keyword = ref("");
const activeCategory = ref("All");
const activeSort = ref("recommend");

const categories = computed(() => {
  const uniq = new Set(marketData.map((item) => item.category));
  return ["All", ...uniq];
});

const tags = computed(() => {
  const all = marketData
    .flatMap((item) => String(item.tags).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(all)];
});

const filteredData = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  let list = marketData.filter((item) => {
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

const marketStats = computed(() => {
  const total = marketData.length;
  const sellers = new Set(marketData.map((item) => item.seller)).size;
  const avgPrice = Math.round(marketData.reduce((acc, item) => acc + item.price, 0) / total);
  return { total, sellers, avgPrice };
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
</script>

<template>
  <section class="market-page">
    

    <section class="toolbar">
      <div class="toolbar-main">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="按标题、分类、标签或提供方搜索"
        />
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
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="tag-pill"
        @click="applyTag(tag)"
      >
        #{{ tag }}
      </button>
    </section>

    <section class="cards-grid">
      <article v-for="item in filteredData" :key="item.id" class="card">
        <div class="card-top">
          <span class="badge">{{ item.category }}</span>
          <span class="price">{{ item.price }} pts</span>
        </div>
        <h3>{{ item.name }}</h3>
        <p class="meta">
          <span>提供方：{{ item.seller }}</span>
          <span>规模：{{ item.size }}</span>
        </p>
        <p class="tags">{{ item.tags }}</p>
        <div class="card-actions">
          <button type="button" class="btn ghost">数据预览</button>
          <button type="button" class="btn primary">查看详情</button>
        </div>
      </article>
    </section>

    <p v-if="filteredData.length === 0" class="empty">当前筛选条件下暂无匹配数据集。</p>
  </section>
</template>

<style scoped>
.market-page {
  display: grid;
  gap: 16px;
}

.hero {
  display: grid;
  gap: 16px;
  grid-template-columns: 1.45fr 1fr;
  padding: 24px;
  border: 1px solid #d7e2f3;
  border-radius: 16px;
  background:
    radial-gradient(circle at 5% 0%, rgba(34, 95, 168, 0.24) 0%, rgba(34, 95, 168, 0) 58%),
    radial-gradient(circle at 95% 90%, rgba(0, 173, 181, 0.2) 0%, rgba(0, 173, 181, 0) 48%),
    #ffffff;
}

.hero-kicker {
  margin: 0 0 6px;
  color: #2e5d93;
  font-size: 12px;
  letter-spacing: 1.4px;
}

.hero h1 {
  margin: 0;
  color: #15283f;
  font-size: 34px;
}

.hero-desc {
  margin: 10px 0 0;
  max-width: 540px;
  color: #5f728f;
  font-size: 14px;
}

.hero-metrics {
  display: grid;
  gap: 10px;
}

.hero-metrics article {
  border: 1px solid #dce7f8;
  border-radius: 12px;
  padding: 13px 14px;
  background: rgba(248, 251, 255, 0.9);
}

.hero-metrics span {
  display: block;
  color: #607692;
  font-size: 12px;
}

.hero-metrics strong {
  color: #17314d;
  font-size: 24px;
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

.cards-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.card {
  border: 1px solid #dbe6f7;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 8px 16px rgba(20, 49, 86, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(20, 49, 86, 0.12);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  border-radius: 6px;
  padding: 3px 8px;
  color: #284a73;
  font-size: 12px;
  background: #e9f1ff;
}

.price {
  color: #173b64;
  font-size: 18px;
  font-weight: 700;
}

.card h3 {
  margin: 10px 0 8px;
  min-height: 44px;
  color: #122a45;
  font-size: 16px;
  line-height: 1.35;
}

.meta {
  display: grid;
  gap: 4px;
  margin: 0;
  color: #5d7390;
  font-size: 12px;
}

.tags {
  margin: 10px 0 12px;
  color: #346093;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 12px;
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

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .toolbar-main {
    flex-direction: column;
  }

  .sort-select {
    width: 100%;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
