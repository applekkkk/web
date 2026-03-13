<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../services/request";
import { marketData } from "../../mock/data";
import { orderApi, productApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const dataset = ref(null);
const loading = ref(false);
const buying = ref(false);
const reviewStatus = ref("待审核");
const reviewStatusOptions = ["待审核", "审核中", "通过", "驳回"];
const isAdminView = computed(() => route.path.startsWith("/admin"));
const suppressReviewSync = ref(true);

const sourceDataset = computed(() => {
  const id = Number(route.params.id);
  return marketData.find((item) => item.id === id) || null;
});

function statusLabelFromCode(code) {
  if (code === 1) return "通过";
  if (code === 2) return "驳回";
  return "待审核";
}

function statusCodeFromLabel(label) {
  if (label === "通过") return 1;
  if (label === "驳回") return 2;
  return null;
}

function parseSummary(summary) {
  if (Array.isArray(summary)) return summary;
  if (typeof summary === "string") {
    try {
      const parsed = JSON.parse(summary);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function normalizeProduct(item) {
  return {
    ...item,
    id: item.id,
    size: item?.size ?? item?.sizeLabel ?? item?.size_label ?? "-",
    author: item?.author ?? item?.authorName ?? item?.author_name ?? "",
    uploadDate: item?.uploadDate ?? item?.upload_date ?? "",
    summary: parseSummary(item?.summary)
  };
}

function hasPurchased(productId, orderList) {
  return orderList.some((item) => {
    const pid = Number(item?.productId ?? 0);
    const amount = Number(item?.amount ?? 0);
    return pid === Number(productId) && amount < 0;
  });
}

async function refreshPurchasedState() {
  if (isAdminView.value || !dataset.value?.id || !auth.user?.id) return;
  try {
    const res = await orderApi.getUserList(auth.user.id);
    if (res?.code !== 200) return;
    const list = Array.isArray(res?.data) ? res.data : [];
    dataset.value.purchased = hasPurchased(dataset.value.id, list);
  } catch {
    // keep current purchased state when order fetch fails
  }
}

async function fetchDataset() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const res = await productApi.getById(id, { userId: auth.user?.id ?? null });
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    dataset.value = normalizeProduct(res.data || {});
    await refreshPurchasedState();
    suppressReviewSync.value = true;
    reviewStatus.value = statusLabelFromCode(res?.data?.reviewStatus ?? res?.data?.review_status);
    suppressReviewSync.value = false;
  } catch (e) {
    const fallback = sourceDataset.value ? { ...sourceDataset.value } : null;
    dataset.value = fallback ? normalizeProduct(fallback) : null;
    suppressReviewSync.value = false;
    if (!dataset.value) {
      ElMessage.error(e?.message || "加载失败");
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    fetchDataset();
  },
  { immediate: true }
);

watch(
  () => route.query.reviewStatus,
  (val) => {
    const next = String(val || "").trim();
    if (reviewStatusOptions.includes(next)) reviewStatus.value = next;
  },
  { immediate: true }
);

watch(
  () => reviewStatus.value,
  async (next, prev) => {
    if (!isAdminView.value || !dataset.value || suppressReviewSync.value) return;
    const statusCode = statusCodeFromLabel(next);
    if (!statusCode) return;
    try {
      const res = await request.put(`/products/${dataset.value.id}/approve`, null, {
        params: { status: statusCode }
      });
      if (res?.code !== 200) {
        throw new Error(res?.message || "审核失败");
      }
      ElMessage.success(statusCode === 1 ? "审核通过" : "已驳回");
    } catch (e) {
      reviewStatus.value = prev;
      ElMessage.error(e?.message || "审核失败");
    }
  }
);

const summaryList = computed(() => {
  const summary = dataset.value?.summary;
  return Array.isArray(summary) ? summary : [];
});

const tags = computed(() => {
  if (!dataset.value) return [];
  return String(dataset.value.tags)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
});

const authorAvatarUrl = computed(() => dataset.value?.authorAvatar || "/img/avatar.png");

function toggleLike() {
  if (!dataset.value?.id) return;
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  productApi
    .setLike(dataset.value.id, auth.user.id, !dataset.value.liked)
    .then((res) => {
      if (res?.code !== 200 || !res?.data) {
        throw new Error(res?.message || "点赞失败");
      }
      dataset.value.likes = Number(res.data.likes ?? 0);
      dataset.value.stars = Number(res.data.stars ?? dataset.value.stars ?? 0);
      dataset.value.liked = Boolean(res.data.liked);
      dataset.value.favorited = Boolean(res.data.favorited);
    })
    .catch((e) => {
      ElMessage.error(e?.message || "点赞失败");
    });
}

function toggleFavorite() {
  if (!dataset.value?.id) return;
  if (!auth.user?.id) {
    ElMessage.warning("请先登录");
    return;
  }
  productApi
    .setFavorite(dataset.value.id, auth.user.id, !dataset.value.favorited)
    .then((res) => {
      if (res?.code !== 200 || !res?.data) {
        throw new Error(res?.message || "收藏失败");
      }
      dataset.value.likes = Number(res.data.likes ?? dataset.value.likes ?? 0);
      dataset.value.stars = Number(res.data.stars ?? 0);
      dataset.value.liked = Boolean(res.data.liked);
      dataset.value.favorited = Boolean(res.data.favorited);
    })
    .catch((e) => {
      ElMessage.error(e?.message || "收藏失败");
    });
}

function handleDownload() {
  if (!isAdminView.value && !dataset.value?.purchased) {
    ElMessage.warning("未购买");
    return;
  }
  if (!dataset.value) return;
  if (!dataset.value.fileName) {
    ElMessage.error("文件不存在");
    return;
  }
  downloadFile();
}

async function downloadFile() {
  try {
    const res = await request.get("/files/download", {
      params: { name: dataset.value.fileName },
      responseType: "blob"
    });
    const blob = res instanceof Blob ? res : new Blob([res]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = dataset.value.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    const prevDownloads = dataset.value.downloads ?? 0;
    dataset.value.downloads = (dataset.value.downloads ?? 0) + 1;
    await syncStats(() => {
      dataset.value.downloads = prevDownloads;
    });
    ElMessage.success("下载成功");
  } catch (e) {
    ElMessage.error(e?.message || "下载失败");
  }
}

async function syncStats(onFail) {
  if (!dataset.value?.id) return;
  try {
    const res = await request.put(`/products/${dataset.value.id}/stats`, {
      likes: Number(dataset.value.likes ?? 0),
      stars: Number(dataset.value.stars ?? 0),
      downloads: Number(dataset.value.downloads ?? 0)
    });
    if (res?.code !== 200) {
      throw new Error(res?.message || "更新失败");
    }
  } catch (e) {
    if (typeof onFail === "function") onFail();
    ElMessage.error(e?.message || "更新失败");
  }
}

async function handleBuy() {
  if (!dataset.value || buying.value) return;
  const price = Number(dataset.value.price ?? 0);
  const buyerId = auth.user?.id ?? null;
  if (!buyerId) {
    ElMessage.error("用户信息缺失");
    return;
  }
  try {
    buying.value = true;
    await refreshPurchasedState();
    if (dataset.value.purchased) {
      ElMessage.info("该数据已购买");
      return;
    }
    const res = await orderApi.create({
      buyerId,
      productId: dataset.value.id,
      productName: `购买数据: ${dataset.value.name}`,
      amount: -Math.abs(price)
    });
    if (res?.code !== 200) {
      throw new Error(res?.message || "购买失败");
    }
    dataset.value.purchased = true;
    auth.updateProfile({
      points: Math.max(0, (auth.user?.points ?? 0) - Math.abs(price))
    });
    ElMessage.success("购买成功");
  } catch (e) {
    if (String(e?.message || "").includes("已购买")) {
      dataset.value.purchased = true;
    }
    ElMessage.error(e?.message || "购买失败");
  } finally {
    buying.value = false;
  }
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

      <el-select v-if="isAdminView" v-model="reviewStatus" class="status-select" placeholder="审核状态">
        <el-option v-for="s in reviewStatusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <button v-else-if="!dataset.purchased" class="download" @click="handleBuy">购买数据集</button>
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
        <div v-if="summaryList.length === 0" class="row empty-row">
          <span>暂无信息</span>
          <span>-</span>
        </div>
        <div v-else v-for="item in summaryList" :key="`${item.key}-${item.value}`" class="row two-col">
          <span>{{ item.key }}</span>
          <span>{{ item.value }}</span>
        </div>
      </div>
    </section>

  </section>

  <section v-else class="empty">
    <p>未找到对应数据集。</p>
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

.status-select {
  width: 140px;
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

.empty-row span {
  color: #8a97a8;
}

.empty {
  margin-top: 24px;
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
