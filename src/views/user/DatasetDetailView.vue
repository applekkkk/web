<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../services/request";
import { marketData } from "../../mock/data";
import { orderApi, productApi, taskAppealApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const auth = useAuthStore();
const dataset = ref(null);
const loading = ref(false);
const buying = ref(false);
const appealing = ref(false);
const appealDialogVisible = ref(false);
const processingAppeal = ref(false);
const appealDetail = ref(null);
const appealForm = ref({
  claimText: "",
  evidenceText: ""
});
const evidenceImageFile = ref(null);
const evidenceImageInputRef = ref(null);
const reviewStatus = ref("待审核");
const reviewStatusOptions = ["待审核", "审核中", "通过", "驳回"];
const isAdminView = computed(() => route.path.startsWith("/admin"));
const appealId = computed(() => Number(route.query.appealId ?? 0));
const isAppealMode = computed(() => {
  const fromAppeal = String(route.query.mode ?? "") === "appeal";
  return isAdminView.value && (appealId.value > 0 || fromAppeal);
});
const appealBuyerId = computed(() => Number(route.query.buyerId ?? 0));
const adminPurchaseStatus = ref("purchased");
const suppressReviewSync = ref(true);
const appealStatus = ref(0);
const isAppealProcessed = computed(() => Number(appealStatus.value) === 1);

const sourceDataset = computed(() => {
  const id = Number(route.params.id);
  return marketData.find((item) => item.id === id) || null;
});

function statusLabelFromCode(code) {
  if (code === 1) return "通过";
  if (code === 2) return "驳回";
  return "待审核";
}

function appealStatusText(code) {
  return Number(code ?? 0) === 1 ? "已处理" : "待处理";
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
    authorId: item?.authorId ?? item?.author_id ?? null,
    size: item?.size ?? item?.sizeLabel ?? item?.size_label ?? "-",
    author: item?.author ?? item?.authorName ?? item?.author_name ?? "",
    uploadDate: item?.uploadDate ?? item?.upload_date ?? "",
    summary: parseSummary(item?.summary)
  };
}

function isOwnProduct(item) {
  const uid = Number(auth.user?.id ?? 0);
  if (!uid || !item) return false;
  return Number(item?.authorId ?? item?.author_id ?? 0) === uid;
}

function hasPurchased(productId, orderList) {
  return orderList.some((item) => {
    const pid = Number(item?.productId ?? 0);
    const productName = String(item?.productName ?? "");
    const byDataOrder = productName.startsWith("购买数据:");
    const byAdminGrant = productName.startsWith("管理员授权购买:");
    return pid === Number(productId) && (byDataOrder || byAdminGrant);
  });
}

async function refreshPurchasedState() {
  if (isAdminView.value || !dataset.value?.id || !auth.user?.id) return;
  try {
    const res = await orderApi.getUserList(auth.user.id);
    if (res?.code !== 200) return;
    const list = Array.isArray(res?.data) ? res.data : [];
    dataset.value.purchased = hasPurchased(dataset.value.id, list) || isOwnProduct(dataset.value);
  } catch {
    // keep current purchased state when order fetch fails
  }
}

async function syncAppealStatus() {
  if (!isAppealMode.value || !appealId.value) {
    appealStatus.value = 0;
    appealDetail.value = null;
    return;
  }
  try {
    const res = await taskAppealApi.getAll();
    const list = Array.isArray(res?.data) ? res.data : [];
    const current = list.find((item) => Number(item?.id) === appealId.value) || null;
    appealStatus.value = Number(current?.status ?? 0);
    appealDetail.value = current
      ? {
          id: Number(current.id ?? 0),
          claimText: current.claimText ?? current.claim_text ?? "",
          evidenceText: current.evidenceText ?? current.evidence_text ?? "",
          evidenceImage: current.evidenceImage ?? current.evidence_image ?? "",
          createdAt: String(current.createdAt ?? current.created_at ?? "").replace("T", " "),
          appellantName: current.appellantName ?? current.appellant_name ?? "",
          appellantRole: current.appellantRole ?? current.appellant_role ?? "",
          targetType: String(current.targetType ?? current.target_type ?? "").toUpperCase(),
          status: Number(current.status ?? 0)
        }
      : null;
  } catch {
    appealStatus.value = 0;
    appealDetail.value = null;
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
    if (isAppealMode.value && appealBuyerId.value > 0) {
      const orderRes = await orderApi.getUserList(appealBuyerId.value);
      const orderList = Array.isArray(orderRes?.data) ? orderRes.data : [];
      dataset.value.purchased =
        hasPurchased(dataset.value.id, orderList) || Number(dataset.value.authorId ?? 0) === appealBuyerId.value;
    } else {
      await refreshPurchasedState();
    }
    adminPurchaseStatus.value = dataset.value?.purchased ? "purchased" : "unpurchased";
    suppressReviewSync.value = true;
    reviewStatus.value = statusLabelFromCode(res?.data?.reviewStatus ?? res?.data?.review_status);
    suppressReviewSync.value = false;
    await syncAppealStatus();
  } catch (e) {
    const fallback = sourceDataset.value ? { ...sourceDataset.value } : null;
    dataset.value = fallback ? normalizeProduct(fallback) : null;
    suppressReviewSync.value = false;
    await syncAppealStatus();
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
    if (!isAdminView.value || !dataset.value || suppressReviewSync.value || isAppealMode.value) return;
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

const authorInitial = computed(() => {
  const name = String(dataset.value?.author || "").trim();
  if (!name) return "U";
  return name.slice(0, 1).toUpperCase();
});

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
    if (!isAdminView.value) {
      const prevDownloads = dataset.value.downloads ?? 0;
      dataset.value.downloads = (dataset.value.downloads ?? 0) + 1;
      await syncStats(() => {
        dataset.value.downloads = prevDownloads;
      });
    }
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

function chooseEvidenceImage() {
  evidenceImageInputRef.value?.click();
}

function onEvidenceImageChange(event) {
  const file = event.target.files?.[0];
  evidenceImageFile.value = file || null;
}

async function uploadEvidenceImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await request.post("/files/upload-image", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (res?.code !== 200) throw new Error(res?.message || "证据图片上传失败");
  return res?.data?.savedName || "";
}

function openAppealDialog() {
  if (!dataset.value?.purchased || isAdminView.value) return;
  appealDialogVisible.value = true;
}

async function handleAppealSubmit() {
  if (!dataset.value?.id || !auth.user?.id) return;
  if (!String(appealForm.value.claimText || "").trim()) {
    ElMessage.warning("请填写诉求内容");
    return;
  }
  appealing.value = true;
  try {
    let evidenceImage = "";
    if (evidenceImageFile.value) {
      evidenceImage = await uploadEvidenceImage(evidenceImageFile.value);
    }
    const res = await taskAppealApi.create({
      targetType: "DATA",
      requestId: dataset.value.id,
      appellantId: auth.user.id,
      claimText: String(appealForm.value.claimText || "").trim(),
      evidenceText: String(appealForm.value.evidenceText || "").trim(),
      evidenceImage
    });
    if (res?.code !== 200) throw new Error(res?.message || "申诉提交失败");
    appealDialogVisible.value = false;
    appealForm.value = { claimText: "", evidenceText: "" };
    evidenceImageFile.value = null;
    if (evidenceImageInputRef.value) evidenceImageInputRef.value.value = "";
    ElMessage.success("申诉已提交");
  } catch (error) {
    ElMessage.error(error?.message || "申诉提交失败");
  } finally {
    appealing.value = false;
  }
}

async function handleAdminPurchaseChange(next) {
  if (!isAppealMode.value || !dataset.value?.id) return;
  if (!appealBuyerId.value) {
    ElMessage.error("缺少申诉用户信息");
    return;
  }
  const purchased = next === "purchased";
  try {
    const res = await orderApi.adminSetPurchaseStatus(appealBuyerId.value, dataset.value.id, purchased);
    if (res?.code !== 200) throw new Error(res?.message || "状态修改失败");
    await fetchDataset();
    ElMessage.success("购买状态已更新");
  } catch (error) {
    adminPurchaseStatus.value = dataset.value?.purchased ? "purchased" : "unpurchased";
    ElMessage.error(error?.message || "状态修改失败");
  }
}

async function handleProcessAppeal() {
  if (!isAppealMode.value || !appealId.value || processingAppeal.value) return;
  if (isAppealProcessed.value) {
    ElMessage.success("申诉已处理");
    return;
  }
  processingAppeal.value = true;
  try {
    const res = await taskAppealApi.process(appealId.value);
    if (res?.code !== 200) throw new Error(res?.message || "处理失败");
    appealStatus.value = 1;
    ElMessage.success("申诉已处理");
  } catch (error) {
    ElMessage.error(error?.message || "处理失败");
  } finally {
    processingAppeal.value = false;
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
            <span class="avatar-initial">{{ authorInitial }}</span>
            <span class="seller">{{ dataset.author || "未知作者" }}</span>
          </span>
          <span>{{ dataset.uploadDate || "2024-01-01" }} 上传</span>
          <span>{{ dataset.size }}</span>
          <span>{{ dataset.price }} 积分</span>
        </div>

        <div v-if="!isAdminView" class="icon-actions">
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

      <div v-if="isAdminView" class="admin-actions" :class="{ 'appeal-mode': isAppealMode }">
        <template v-if="isAppealMode">
          <el-select v-model="adminPurchaseStatus" class="status-select" placeholder="购买状态" @change="handleAdminPurchaseChange">
            <el-option label="已购买" value="purchased" />
            <el-option label="未购买" value="unpurchased" />
          </el-select>
          <button
            type="button"
            class="appeal-process-btn"
            :class="{ done: isAppealProcessed }"
            :disabled="processingAppeal"
            @click="handleProcessAppeal"
          >
            {{ processingAppeal ? "处理中..." : isAppealProcessed ? "已处理" : "处理完成" }}
          </button>
        </template>
        <template v-else>
          <el-select v-model="reviewStatus" class="status-select" placeholder="审核状态">
            <el-option v-for="s in reviewStatusOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <button type="button" class="admin-download" @click="handleDownload">下载文件</button>
        </template>
      </div>
      <button v-else-if="!dataset.purchased" class="download" @click="handleBuy">购买数据集</button>
      <div v-else class="purchased-actions">
        <button class="purchased" type="button" disabled>已购买</button>
        <button type="button" class="appeal-btn" @click="openAppealDialog">申诉</button>
      </div>
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

    <section v-if="isAppealMode && appealDetail" class="block">
      <h2>申诉信息</h2>
      <div class="table">
        <div class="row two-col">
          <span>申诉人</span>
          <span>{{ appealDetail.appellantName || "-" }}（{{ appealDetail.appellantRole || "-" }}）</span>
        </div>
        <div class="row two-col">
          <span>申诉类型</span>
          <span>{{ appealDetail.targetType === "DATA" ? "数据" : "任务" }}</span>
        </div>
        <div class="row two-col">
          <span>状态</span>
          <span>{{ appealStatusText(appealDetail.status) }}</span>
        </div>
        <div class="row two-col">
          <span>申诉时间</span>
          <span>{{ appealDetail.createdAt || "-" }}</span>
        </div>
        <div class="row two-col">
          <span>申诉理由</span>
          <span>{{ appealDetail.claimText || "暂无" }}</span>
        </div>
        <div class="row two-col">
          <span>证据说明</span>
          <span>{{ appealDetail.evidenceText || "暂无" }}</span>
        </div>
        <div class="row two-col">
          <span>证据图片</span>
          <span>
            <img
              v-if="appealDetail.evidenceImage"
              class="appeal-image"
              :src="`/api/files/download?name=${encodeURIComponent(appealDetail.evidenceImage)}`"
              alt="证据图片"
            />
            <template v-else>暂无</template>
          </span>
        </div>
      </div>
    </section>

    <el-dialog v-model="appealDialogVisible" :title="`${dataset?.name || '数据'} · 数据申诉`" width="680px">
      <el-form label-position="top" class="appeal-form">
        <div class="appeal-grid">
          <el-form-item label="诉求内容" required>
            <el-input v-model.trim="appealForm.claimText" type="textarea" :rows="4" placeholder="请描述你的诉求" />
          </el-form-item>
          <el-form-item label="证据说明">
            <el-input
              v-model.trim="appealForm.evidenceText"
              type="textarea"
              :rows="4"
              placeholder="请填写证据说明（可选）"
            />
          </el-form-item>
        </div>
      </el-form>
      <div class="appeal-actions">
        <input
          ref="evidenceImageInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden-file"
          @change="onEvidenceImageChange"
        />
        <button type="button" class="small-btn" @click="chooseEvidenceImage">上传证据图片</button>
        <span class="file-name">{{ evidenceImageFile ? evidenceImageFile.name : "未选择图片" }}</span>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button type="button" class="small-btn" @click="appealDialogVisible = false">取消</button>
          <button type="button" class="small-btn primary" :disabled="appealing" @click="handleAppealSubmit">
            {{ appealing ? "提交中..." : "提交申诉" }}
          </button>
        </div>
      </template>
    </el-dialog>

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
  font-size: 24px;
  line-height: 1.25;
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

.avatar-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #d0dbef;
  color: #eef4ff;
  font-size: 13px;
  font-weight: 700;
  background: linear-gradient(135deg, #6f80ff, #5d63f0);
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

.purchased-actions {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.appeal-btn {
  border: 1px solid #9fd5f6;
  border-radius: 999px;
  padding: 8px 16px;
  color: #299be4;
  background: #f3faff;
  cursor: pointer;
}

.status-select {
  width: 140px;
}

.admin-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.admin-actions.appeal-mode {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.admin-download {
  border: 1px solid #c7d7ef;
  border-radius: 999px;
  padding: 8px 16px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.block {
  margin-top: 26px;
}

h2 {
  margin: 0 0 14px;
  font-size: 18px;
  color: #232c38;
}

h3 {
  margin: 14px 0 10px;
  color: #2f3b4c;
  font-size: 16px;
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

.appeal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.appeal-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.appeal-form :deep(.el-textarea__inner) {
  resize: none;
}

.appeal-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.hidden-file {
  display: none;
}

.small-btn {
  border: 1px solid #c7d7ef;
  border-radius: 8px;
  padding: 6px 12px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.appeal-process-btn {
  width: 100%;
  border: 1px solid #2f5a90;
  border-radius: 10px;
  padding: 8px 16px;
  color: #2f5a90;
  background: rgba(47, 90, 144, 0.14);
  cursor: pointer;
}

.appeal-process-btn.done {
  border-color: #3aaa5d;
  color: #2e8d4f;
  background: rgba(58, 170, 93, 0.14);
}

.small-btn.primary {
  border-color: #2f5a90;
  color: #fff;
  background: #2f5a90;
}

.file-name {
  color: #5b6a80;
  font-size: 13px;
}

.appeal-image {
  width: 180px;
  max-width: 100%;
  border: 1px solid #dbe4f1;
  border-radius: 8px;
}

@media (max-width: 900px) {
  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 17px;
  }

  h3 {
    font-size: 15px;
  }

  .detail-head {
    flex-direction: column;
  }

  .purchased-actions {
    justify-items: start;
  }

  .row {
    grid-template-columns: 1fr 2fr;
  }

  .appeal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
