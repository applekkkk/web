<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { marketData } from "../../mock/data";
import { ElMessage } from "element-plus";
import DatasetCard from "../../components/DatasetCard.vue";

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
  if (!item.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  item.downloads = (item.downloads ?? 0) + 1;
  ElMessage.success("下载成功");
}

function goDetail(id) {
  const url = router.resolve({ path: `/user/market/${id}` }).href;
  window.open(url, "_blank");
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
      <DatasetCard
        v-for="item in filteredData"
        :key="item.id"
        :item="item"
        @open="goDetail(item.id)"
        @like="toggleLike"
        @favorite="toggleFavorite"
        @download="handleDownload"
      />
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
  border: 1px solid #ebeef3;
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
  border: 1px solid #e3e7ee;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.sort-select {
  min-width: 190px;
  border: 1px solid #e3e7ee;
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
  border: 1px solid #e4e7ee;
  border-radius: 999px;
  padding: 7px 12px;
  color: #4f5d70;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.chip.active {
  border-color: #1f2c3f;
  color: #fff;
  background: #1f2c3f;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-title {
  margin-right: 6px;
  color: #505d70;
  font-size: 13px;
  font-weight: 600;
}

.tag-pill {
  border: 1px solid #e0e5ef;
  border-radius: 999px;
  padding: 4px 10px;
  color: #556277;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.result-count {
  margin: 0;
  color: #4f5d70;
  font-size: 16px;
  font-weight: 600;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  margin: 8px 0 0;
  color: #62748d;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
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
