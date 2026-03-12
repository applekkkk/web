<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import DatasetCard from "../../components/DatasetCard.vue";
import request from "../../services/request";

const keyword = ref("");
const activeCategory = ref("All");
const activeSort = ref("recommend");
const router = useRouter();
const marketList = ref([]);
const total = ref(0);
const loading = ref(false);

const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const disabled = ref(false);
const background = ref(true);
const size = ref("default");

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

async function fetchMarket() {
  loading.value = true;
  try {
    const body = {
      keyword: keyword.value?.trim() || "",
      category: activeCategory.value === "All" ? "" : activeCategory.value,
      sortBy: activeSort.value || "recommend",
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };

    const res = await request.post("/products/query", body);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }

    const rawList = Array.isArray(res?.data?.list) ? res.data.list : [];
    marketList.value = rawList.map((item) => ({
      ...item,
      size: item?.size ?? item?.sizeLabel ?? item?.size_label ?? "-",
      author: item?.author ?? item?.authorName ?? item?.author_name ?? "",
      uploadDate: item?.uploadDate ?? item?.upload_date ?? ""
    }));
    total.value = Number(res?.data?.total ?? 0);
  } catch (e) {
    marketList.value = [];
    total.value = 0;
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

let keywordTimer = null;
watch([keyword, activeCategory, activeSort], () => {
  currentPage.value = 1;
  if (keywordTimer) clearTimeout(keywordTimer);
  keywordTimer = setTimeout(() => {
    fetchMarket();
  }, 250);
});

watch([currentPage, pageSize], () => {
  fetchMarket();
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
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

onMounted(() => {
  fetchMarket();
});
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

    <section class="cards-grid">
      <DatasetCard
        v-loading="loading"
        v-for="item in marketList"
        :key="item.id"
        :item="item"
        @open="goDetail(item.id)"
        @like="toggleLike"
        @favorite="toggleFavorite"
        @download="handleDownload"
      />
    </section>

    <p v-if="!loading && marketList.length === 0" class="empty">当前筛选条件下暂无匹配数据集。</p>

    <div v-else class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :size="size"
        :disabled="disabled"
        :background="background"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
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

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pager-row {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
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
