<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import DatasetCard from "../../components/DatasetCard.vue";
import request from "../../services/request";
import { orderApi, productApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const keyword = ref("");
const activeCategory = ref("all");
const activeSort = ref("recommend");
const router = useRouter();
const auth = useAuthStore();
const marketList = ref([]);
const total = ref(0);
const loading = ref(false);

const categoryOptions = [
  { key: "all", label: "全部数据", category: "" },
  { key: "normal", label: "普通数据", category: "普通数据" },
  { key: "network", label: "网络数据（图数据）", category: "网络数据（图数据）" }
];
const categoryMap = Object.fromEntries(categoryOptions.map((item) => [item.key, item.category]));
const categoryTotals = ref({
  all: 0,
  normal: 0,
  network: 0
});
const searchPlaceholder = "\u6309\u6807\u9898\u3001\u5206\u7c7b\u3001\u6807\u7b7e\u6216\u63d0\u4f9b\u65b9\u641c\u7d22";
const sortOptions = [
  { value: "recommend", label: "\u63a8\u8350\u6392\u5e8f" },
  { value: "price-asc", label: "\u4ef7\u683c\u4ece\u4f4e\u5230\u9ad8" },
  { value: "price-desc", label: "\u4ef7\u683c\u4ece\u9ad8\u5230\u4f4e" },
  { value: "size-desc", label: "\u89c4\u6a21\u4ece\u5927\u5230\u5c0f" }
];
const emptyText = "\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u4e0b\u6682\u65e0\u5339\u914d\u6570\u636e\u96c6\u3002";

const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const disabled = ref(false);
const background = ref(true);
const size = ref("default");
const purchasedIdSet = ref(new Set());
let keywordTimer = null;

const categoryChips = computed(() =>
  categoryOptions.map((item) => ({
    ...item,
    count: Number(categoryTotals.value[item.key] ?? 0)
  }))
);

function getAuthorId(item) {
  return Number(item?.authorId ?? item?.author_id ?? 0);
}

function isOwnProduct(item) {
  const uid = Number(auth.user?.id ?? 0);
  if (!uid) return false;
  return getAuthorId(item) === uid;
}

async function fetchMarket() {
  loading.value = true;
  try {
    await fetchPurchasedIds();
    const body = {
      keyword: keyword.value?.trim() || "",
      category: categoryMap[activeCategory.value] ?? "",
      sortBy: activeSort.value || "recommend",
      userId: auth.user?.id ?? null,
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
      uploadDate: item?.uploadDate ?? item?.upload_date ?? "",
      purchased: purchasedIdSet.value.has(Number(item.id)) || isOwnProduct(item)
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

async function fetchCategoryTotals() {
  const keywordValue = keyword.value?.trim() || "";
  const userId = auth.user?.id ?? null;
  try {
    const responses = await Promise.all(
      categoryOptions.map((item) =>
        request.post("/products/query", {
          keyword: keywordValue,
          category: item.category,
          sortBy: "recommend",
          userId,
          pageNum: 1,
          pageSize: 1
        })
      )
    );
    const next = { ...categoryTotals.value };
    categoryOptions.forEach((item, idx) => {
      const res = responses[idx];
      next[item.key] = res?.code === 200 ? Number(res?.data?.total ?? 0) : 0;
    });
    categoryTotals.value = next;
  } catch {
    categoryTotals.value = { all: 0, normal: 0, network: 0 };
  }
}

async function fetchPurchasedIds() {
  if (!auth.user?.id) {
    purchasedIdSet.value = new Set();
    return;
  }
  try {
    const res = await orderApi.getUserList(auth.user.id);
    if (res?.code !== 200) return;
    const set = new Set(
      (Array.isArray(res?.data) ? res.data : [])
        .filter((item) => {
          const name = String(item?.productName ?? "");
          return name.startsWith("购买数据:") || name.startsWith("管理员授权购买:");
        })
        .map((item) => Number(item?.productId ?? 0))
        .filter((id) => Number.isFinite(id) && id > 0)
    );
    purchasedIdSet.value = set;
  } catch {
    // keep current purchased status when order fetch fails
  }
}

watch([activeCategory, activeSort], () => {
  currentPage.value = 1;
  fetchMarket();
});

watch(keyword, () => {
  currentPage.value = 1;
  if (keywordTimer) clearTimeout(keywordTimer);
  keywordTimer = setTimeout(async () => {
    await fetchCategoryTotals();
    await fetchMarket();
  }, 250);
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
  fetchMarket();
}

function handleCurrentChange(val) {
  currentPage.value = val;
  fetchMarket();
}

async function syncStats(item, onFail) {
  try {
    const res = await request.put(`/products/${item.id}/stats`, {
      likes: Number(item.likes ?? 0),
      stars: Number(item.stars ?? 0),
      downloads: Number(item.downloads ?? 0)
    });
    if (res?.code !== 200) {
      throw new Error(res?.message || "更新失败");
    }
  } catch (e) {
    if (typeof onFail === "function") onFail();
    ElMessage.error(e?.message || "更新失败");
  }
}

async function toggleLike(item) {
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  try {
    const res = await productApi.setLike(item.id, auth.user.id, !item.liked);
    if (res?.code !== 200 || !res?.data) {
      throw new Error(res?.message || "点赞失败");
    }
    item.likes = Number(res.data.likes ?? 0);
    item.stars = Number(res.data.stars ?? item.stars ?? 0);
    item.liked = Boolean(res.data.liked);
    item.favorited = Boolean(res.data.favorited);
  } catch (e) {
    ElMessage.error(e?.message || "点赞失败");
  }
}

async function toggleFavorite(item) {
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  try {
    const res = await productApi.setFavorite(item.id, auth.user.id, !item.favorited);
    if (res?.code !== 200 || !res?.data) {
      throw new Error(res?.message || "收藏失败");
    }
    item.likes = Number(res.data.likes ?? item.likes ?? 0);
    item.stars = Number(res.data.stars ?? 0);
    item.liked = Boolean(res.data.liked);
    item.favorited = Boolean(res.data.favorited);
  } catch (e) {
    ElMessage.error(e?.message || "收藏失败");
  }
}

function handleDownload(item) {
  if (!item.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  const prevDownloads = item.downloads ?? 0;
  item.downloads = (item.downloads ?? 0) + 1;
  ElMessage.success("下载成功");
  syncStats(item, () => {
    item.downloads = prevDownloads;
  });
}

function goDetail(id) {
  router.push({ path: `/user/market/${id}` });
}

onMounted(async () => {
  await fetchCategoryTotals();
  await fetchMarket();
});
</script>

<template>
  <section class="market-page">
    <section class="toolbar">
      <div class="toolbar-main">
        <input v-model="keyword" class="search-input" :placeholder="searchPlaceholder" />
        <el-select v-model="activeSort" class="sort-select" placeholder="推荐排序">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="category-row">
        <button
          v-for="item in categoryChips"
          :key="item.key"
          type="button"
          class="chip"
          :class="{ active: activeCategory === item.key }"
          @click="activeCategory = item.key"
        >
          {{ item.label }} - {{ item.count }}条
        </button>
      </div>
    </section>

    <section class="cards-grid" v-loading="loading">
      <DatasetCard
        v-for="item in marketList"
        :key="item.id"
        :item="item"
        @open="goDetail(item.id)"
        @like="toggleLike"
        @favorite="toggleFavorite"
        @download="handleDownload"
      />
    </section>

    <p v-if="!loading && marketList.length === 0" class="empty">{{ emptyText }}</p>

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
  width: 190px;
  flex: 0 0 190px;
}

.sort-select :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e3e7ee inset;
}

.sort-select :deep(.el-input__inner) {
  font-size: 14px;
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

@media (max-width: 700px) {
  .toolbar-main {
    flex-direction: column;
  }

  .sort-select {
    width: 100%;
    flex: 0 0 auto;
  }
}
</style>
