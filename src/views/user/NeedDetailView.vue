<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../services/request";
import { customRequestApi, taskAppealApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const auth = useAuthStore();
const GRAPH_CATEGORY = "网络数据（图数据）";

const task = ref(null);
const loading = ref(false);
const submittingDelivery = ref(false);
const completing = ref(false);
const rejecting = ref(false);
const deliveryFile = ref(null);
const deliveryInputRef = ref(null);
const appealing = ref(false);
const appealDialogVisible = ref(false);
const appealForm = reactive({
  claimText: "",
  evidenceText: ""
});
const evidenceImageFile = ref(null);
const evidenceImageInputRef = ref(null);
const adminUpdatingStatus = ref(false);
const adminStatus = ref(0);
const processingAppeal = ref(false);
const appealStatus = ref(0);
const appealDetail = ref(null);

function normalizeRequest(item) {
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    amount: item.amount || "",
    tags: item.tags || "",
    budget: Number(item.budget || 0),
    category: item.category || "其他",
    publisher: item.publisherName ?? item.publisher_name ?? "",
    publisherId: item.publisherId ?? item.publisher_id ?? null,
    publisherEmail: item.publisherEmail ?? item.publisher_email ?? "",
    publisherContact: item.publisherContact ?? item.publisher_contact ?? "",
    attachmentName: item.attachmentName ?? item.attachment_name ?? "",
    acceptorId: item.acceptorId ?? item.acceptor_id ?? null,
    acceptorName: item.acceptorName ?? item.acceptor_name ?? "",
    acceptorEmail: item.acceptorEmail ?? item.acceptor_email ?? "",
    deliveryFileName: item.deliveryFileName ?? item.delivery_file_name ?? "",
    needStatus: Number(item.needStatus ?? item.need_status ?? 0)
  };
}

const statusCode = computed(() => Number(task.value?.needStatus ?? 0));
const isAdminView = computed(() => route.path.startsWith("/admin"));
const appealId = computed(() => Number(route.query.appealId ?? 0));
const isAppealMode = computed(() => {
  const fromAppeal = String(route.query.mode ?? "") === "appeal";
  return isAdminView.value && (appealId.value > 0 || fromAppeal);
});
const isAppealProcessed = computed(() => Number(appealStatus.value) === 1);
const isPublisher = computed(() => Number(task.value?.publisherId ?? 0) === Number(auth.user?.id ?? 0));
const isAcceptor = computed(() => Number(task.value?.acceptorId ?? 0) === Number(auth.user?.id ?? 0));
const hasAcceptor = computed(() => Number(task.value?.acceptorId ?? 0) > 0);

const canAccept = computed(() => statusCode.value === 0 && !isPublisher.value && !isAdminView.value);
const canSubmitDelivery = computed(() => statusCode.value === 1 && isAcceptor.value && !isAdminView.value);
const canConfirmComplete = computed(() => statusCode.value === 2 && isPublisher.value && !isAdminView.value);
const isGraphTask = computed(() => String(task.value?.category || "").trim() === GRAPH_CATEGORY);
const deliveryFileAccept = computed(() =>
  isGraphTask.value ? ".net,application/octet-stream,text/plain" : ".csv,text/csv"
);
const expectedDeliverySuffix = computed(() => (isGraphTask.value ? ".net" : ".csv"));
const canAppeal = computed(
  () => !isAdminView.value && (statusCode.value === 1 || statusCode.value === 2) && (isPublisher.value || isAcceptor.value)
);

const canSeeAcceptorEmail = computed(() => (isPublisher.value || isAdminView.value) && statusCode.value >= 1);
const appealDialogTitle = computed(() => `${task.value?.title || "任务"} · 任务申诉`);
const adminStatusOptions = [
  { value: 0, label: "未承接" },
  { value: 1, label: "进行中" },
  { value: 2, label: "待发布者确认" },
  { value: 3, label: "已完成" }
];

const statusText = computed(() => {
  if (statusCode.value === 1) return "进行中";
  if (statusCode.value === 2) return "待发布者确认";
  if (statusCode.value === 3) return "已完成";
  return "未承接";
});

function appealStatusText(code) {
  return Number(code ?? 0) === 1 ? "已处理" : "待处理";
}

const basicRows = computed(() => {
  if (!task.value) return [];
  return [
    { key: "任务类别", value: task.value.category || "未填写" },
    { key: "数据量", value: task.value.amount || "未填写" },
    { key: "预算", value: `${task.value.budget || 0} 积分` },
    { key: "任务状态", value: statusText.value }
  ];
});

const publisherRows = computed(() => {
  if (!task.value) return [];
  return [
    { key: "发布者", value: task.value.publisher || "暂未提供" },
    { key: "邮箱", value: task.value.publisherEmail || "暂未提供" },
    { key: "联系方式", value: task.value.publisherContact || "暂未提供" }
  ];
});

const acceptorRows = computed(() => {
  if (!task.value) return [];
  if (!hasAcceptor.value) {
    return [{ key: "承接状态", value: "暂未承接" }];
  }
  const rows = [
    { key: "承接方", value: task.value.acceptorName || "暂未提供" },
    { key: "当前阶段", value: statusText.value }
  ];
  if (canSeeAcceptorEmail.value) {
    rows.push({ key: "邮箱", value: task.value.acceptorEmail || "暂未提供" });
  }
  return rows;
});

async function fetchTask() {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  try {
    const res = await customRequestApi.getById(id);
    if (res?.code !== 200) throw new Error(res?.message || "加载失败");
    task.value = normalizeRequest(res.data || {});
    await syncAppealStatus();
  } catch (error) {
    task.value = null;
    await syncAppealStatus();
    ElMessage.error(error?.message || "加载失败");
  } finally {
    loading.value = false;
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
    const current = list.find((item) => Number(item?.id) === appealId.value);
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

async function handleAdminStatusChange(nextStatus) {
  if (!isAdminView.value || !task.value) return;
  const targetStatus = Number(nextStatus);
  if (!Number.isInteger(targetStatus)) return;
  if (targetStatus === Number(task.value.needStatus ?? 0)) return;
  adminUpdatingStatus.value = true;
  try {
    const res = await customRequestApi.adminUpdateStatus(task.value.id, targetStatus);
    if (res?.code !== 200) {
      throw new Error(res?.message || "状态更新失败");
    }
    await fetchTask();
    ElMessage.success("任务状态已更新");
  } catch (error) {
    adminStatus.value = Number(task.value?.needStatus ?? 0);
    ElMessage.error(error?.message || "状态更新失败");
  } finally {
    adminUpdatingStatus.value = false;
  }
}

async function handleProcessAppeal() {
  if (!isAppealMode.value || processingAppeal.value) return;
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

async function handleAccept() {
  if (!task.value) return;
  if (Number(auth.user?.emailVerified ?? 0) !== 1 || !auth.user?.email) {
    ElMessage.warning("请先在个人资料完成邮箱验证后再承接任务");
    return;
  }
  if (!canAccept.value) {
    ElMessage.warning("该任务当前不可承接");
    return;
  }
  try {
    const res = await customRequestApi.accept(task.value.id, {
      acceptorId: auth.user?.id ?? null,
      acceptorName: auth.user?.name || ""
    });
    if (res?.code !== 200) throw new Error(res?.message || "承接失败");
    await fetchTask();
    ElMessage.success("承接成功");
  } catch (error) {
    ElMessage.error(error?.message || "承接失败");
  }
}

function chooseDeliveryFile() {
  deliveryInputRef.value?.click();
}

function onDeliveryFileChange(event) {
  const file = event.target.files?.[0];
  if (file && !isValidDeliveryFile(file.name)) {
    ElMessage.warning(`当前任务仅支持上传 ${expectedDeliverySuffix.value} 文件`);
    if (deliveryInputRef.value) deliveryInputRef.value.value = "";
    deliveryFile.value = null;
    return;
  }
  deliveryFile.value = file || null;
}

function isValidDeliveryFile(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (isGraphTask.value) return lower.endsWith(".net");
  return lower.endsWith(".csv");
}

function chooseEvidenceImage() {
  evidenceImageInputRef.value?.click();
}

function onEvidenceImageChange(event) {
  const file = event.target.files?.[0];
  evidenceImageFile.value = file || null;
}

async function uploadCsv(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await request.post("/files/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (res?.code !== 200) throw new Error(res?.message || "文件上传失败");
  return res?.data?.savedName || "";
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

async function handleSubmitDelivery() {
  if (!task.value || !canSubmitDelivery.value) return;
  if (!deliveryFile.value) {
    ElMessage.warning("请先选择交付文件");
    return;
  }
  if (!isValidDeliveryFile(deliveryFile.value.name)) {
    ElMessage.warning(`文件格式不正确，请上传 ${expectedDeliverySuffix.value} 文件`);
    return;
  }
  submittingDelivery.value = true;
  try {
    const savedName = await uploadCsv(deliveryFile.value);
    const res = await customRequestApi.submitDelivery(task.value.id, {
      acceptorId: auth.user?.id ?? null,
      deliveryFileName: savedName
    });
    if (res?.code !== 200) throw new Error(res?.message || "提交失败");
    await fetchTask();
    deliveryFile.value = null;
    if (deliveryInputRef.value) deliveryInputRef.value.value = "";
    ElMessage.success("交付成功，等待发布方确认");
  } catch (error) {
    ElMessage.error(error?.message || "提交失败");
  } finally {
    submittingDelivery.value = false;
  }
}

async function handleComplete() {
  if (!task.value || !canConfirmComplete.value) return;
  completing.value = true;
  try {
    const res = await customRequestApi.complete(task.value.id, {
      publisherId: auth.user?.id ?? null
    });
    if (res?.code !== 200) throw new Error(res?.message || "确认失败");
    await fetchTask();
    auth.updateProfile({
      points: Number(auth.user?.points ?? 0) - Number(task.value.budget ?? 0)
    });
    ElMessage.success("任务已完成并结算");
  } catch (error) {
    ElMessage.error(error?.message || "确认失败");
  } finally {
    completing.value = false;
  }
}

async function handleReject() {
  if (!task.value || !canConfirmComplete.value) return;
  rejecting.value = true;
  try {
    const res = await customRequestApi.reject(task.value.id, {
      publisherId: auth.user?.id ?? null
    });
    if (res?.code !== 200) throw new Error(res?.message || "打回失败");
    await fetchTask();
    ElMessage.success("已打回，任务恢复为进行中");
  } catch (error) {
    ElMessage.error(error?.message || "打回失败");
  } finally {
    rejecting.value = false;
  }
}

async function handleAppeal() {
  if (!task.value || !canAppeal.value) return;
  if (!appealForm.claimText.trim()) {
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
      requestId: task.value.id,
      appellantId: auth.user?.id ?? null,
      claimText: appealForm.claimText.trim(),
      evidenceText: appealForm.evidenceText.trim(),
      evidenceImage
    });
    if (res?.code !== 200) throw new Error(res?.message || "申诉提交失败");

    appealForm.claimText = "";
    appealForm.evidenceText = "";
    evidenceImageFile.value = null;
    if (evidenceImageInputRef.value) evidenceImageInputRef.value.value = "";
    appealDialogVisible.value = false;
    ElMessage.success("申诉已提交");
  } catch (error) {
    ElMessage.error(error?.message || "申诉提交失败");
  } finally {
    appealing.value = false;
  }
}

function openAppealDialog() {
  if (!canAppeal.value) return;
  appealDialogVisible.value = true;
}

async function downloadFile(name) {
  if (!name) return;
  try {
    const res = await request.get("/files/download", {
      params: { name },
      responseType: "blob"
    });
    const blob = res instanceof Blob ? res : new Blob([res]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error(error?.message || "下载失败");
  }
}

onMounted(fetchTask);
watch(() => route.params.id, fetchTask);
watch(
  () => task.value?.needStatus,
  (val) => {
    adminStatus.value = Number(val ?? 0);
  },
  { immediate: true }
);
</script>

<template>
  <section v-if="task" class="detail-page" v-loading="loading">
    <header class="detail-head">
      <div class="head-main">
        <h1>{{ task.title || "未命名任务" }}</h1>
        <div class="meta-row">
          <span>预算：{{ task.budget || 0 }} 积分</span>
          <span>数据量：{{ task.amount || "-" }}</span>
          <span>状态：{{ statusText }}</span>
        </div>
      </div>
      <div class="head-actions">
        <template v-if="isAdminView">
          <div class="admin-status-box">
            <el-select
              v-model="adminStatus"
              class="admin-status-select"
              :disabled="adminUpdatingStatus"
              @change="handleAdminStatusChange"
            >
              <el-option
                v-for="item in adminStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <button
              v-if="isAppealMode"
              type="button"
              class="admin-process-btn"
              :class="{ done: isAppealProcessed }"
              :disabled="processingAppeal"
              @click="handleProcessAppeal"
            >
              {{ processingAppeal ? "处理中..." : isAppealProcessed ? "已处理" : "处理完成" }}
            </button>
          </div>
        </template>
        <button v-else-if="canAccept" class="action-btn" type="button" @click="handleAccept">承接任务</button>
        <div v-else-if="canConfirmComplete" class="confirm-actions">
          <button class="action-btn done" type="button" :disabled="completing" @click="handleComplete">
            {{ completing ? "确认中..." : "确认完成并结算" }}
          </button>
          <div class="minor-actions" :class="{ single: !canAppeal }">
            <button class="action-btn reject" type="button" :disabled="rejecting" @click="handleReject">
              {{ rejecting ? "打回中..." : "打回任务" }}
            </button>
            <button v-if="canAppeal" class="action-btn appeal" type="button" @click="openAppealDialog">申诉</button>
          </div>
        </div>
        <button v-else-if="canAppeal" class="action-btn appeal" type="button" @click="openAppealDialog">申诉</button>
      </div>
    </header>

    <section class="card task-desc">
      <h2>任务描述</h2>
      <p class="description-text">{{ task.description || "暂无描述" }}</p>
    </section>

    <section v-if="canSubmitDelivery" class="delivery-panel">
      <input ref="deliveryInputRef" type="file" class="hidden-file" :accept="deliveryFileAccept" @change="onDeliveryFileChange" />
      <button type="button" class="small-btn" @click="chooseDeliveryFile">选择交付文件</button>
      <span class="file-name">{{ deliveryFile ? deliveryFile.name : "未选择文件" }}</span>
      <span class="file-name">（仅支持 {{ expectedDeliverySuffix }}）</span>
      <button type="button" class="small-btn primary" :disabled="submittingDelivery" @click="handleSubmitDelivery">
        {{ submittingDelivery ? "提交中..." : "提交交付" }}
      </button>
    </section>

    <section class="info-grid">
      <article class="card">
        <h2>基本信息</h2>
        <div class="table">
          <div v-for="row in basicRows" :key="row.key" class="row">
            <span>{{ row.key }}</span>
            <span>{{ row.value }}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>发布者信息</h2>
        <div class="table">
          <div v-for="row in publisherRows" :key="row.key" class="row">
            <span>{{ row.key }}</span>
            <span>{{ row.value }}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>承接信息</h2>
        <div class="table">
          <div v-for="row in acceptorRows" :key="row.key" class="row">
            <span>{{ row.key }}</span>
            <span>{{ row.value }}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>任务文件</h2>
        <div class="file-actions">
          <button
            type="button"
            class="small-btn"
            :disabled="!task.attachmentName"
            @click="downloadFile(task.attachmentName)"
          >
            下载示例文件
          </button>
          <button
            type="button"
            class="small-btn"
            :disabled="!task.deliveryFileName"
            @click="downloadFile(task.deliveryFileName)"
          >
            下载交付文件
          </button>
        </div>
      </article>
    </section>

    <section v-if="isAppealMode && appealDetail" class="card">
      <h2>申诉信息</h2>
      <div class="table">
        <div class="row">
          <span>申诉人</span>
          <span>{{ appealDetail.appellantName || "-" }}（{{ appealDetail.appellantRole || "-" }}）</span>
        </div>
        <div class="row">
          <span>申诉类型</span>
          <span>{{ appealDetail.targetType === "DATA" ? "数据" : "任务" }}</span>
        </div>
        <div class="row">
          <span>状态</span>
          <span>{{ appealStatusText(appealDetail.status) }}</span>
        </div>
        <div class="row">
          <span>申诉时间</span>
          <span>{{ appealDetail.createdAt || "-" }}</span>
        </div>
        <div class="row">
          <span>申诉理由</span>
          <span>{{ appealDetail.claimText || "暂无" }}</span>
        </div>
        <div class="row">
          <span>证据说明</span>
          <span>{{ appealDetail.evidenceText || "暂无" }}</span>
        </div>
        <div class="row">
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

    <el-dialog v-model="appealDialogVisible" :title="appealDialogTitle" width="680px">
      <el-form :model="appealForm" label-position="top" class="appeal-form">
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
          <button type="button" class="small-btn primary" :disabled="appealing" @click="handleAppeal">
            {{ appealing ? "提交中..." : "提交申诉" }}
          </button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.detail-page {
  border: 1px solid #eceff4;
  border-radius: 18px;
  padding: 22px 24px;
  background: #fff;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef1f5;
}

.head-main h1 {
  margin: 0;
  color: #1f2c3d;
  font-size: 28px;
  line-height: 1.1;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  color: #5f6f84;
  font-size: 14px;
}

.head-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

.admin-status-box {
  display: grid;
  gap: 6px;
  min-width: 210px;
  justify-items: stretch;
}

.admin-status-label {
  color: #5f6f84;
  font-size: 13px;
  text-align: right;
}

.admin-status-select {
  min-width: 210px;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 220px;
}

.minor-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.minor-actions.single {
  grid-template-columns: 1fr;
}

.action-btn {
  border: 1px solid #d0dced;
  border-radius: 10px;
  padding: 8px 14px;
  min-height: 38px;
  color: #3c5a7d;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.action-btn.reject {
  border-color: #f0d0d0;
  background: #fff7f7;
  color: #a74a4a;
}

.action-btn.done {
  border-color: #2f5a90;
  background: #2f5a90;
  color: #fff;
  font-weight: 600;
  width: 100%;
  box-shadow: 0 6px 16px rgba(47, 90, 144, 0.18);
}

.action-btn.appeal {
  border-color: #9fd5f6;
  background: #f3faff;
  color: #299be4;
}

.minor-actions .action-btn {
  width: 100%;
}

.card {
  margin-top: 18px;
  border: 1px solid #e7edf6;
  border-radius: 14px;
  padding: 14px 16px;
  background: #fff;
}

.card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #1f2c3d;
}

.card p {
  margin: 0;
  color: #47566c;
  line-height: 1.75;
}

.task-desc {
  padding-bottom: 18px;
}

.description-text {
  margin-top: 0;
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

.delivery-panel {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  border: 1px dashed #d8e2f1;
  border-radius: 12px;
  padding: 10px 12px;
}

.hidden-file {
  display: none;
}

.file-name {
  color: #5b6a80;
  font-size: 13px;
}

.small-btn {
  border: 1px solid #c7d7ef;
  border-radius: 8px;
  padding: 6px 12px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.small-btn.primary {
  border-color: #2f5a90;
  color: #fff;
  background: #2f5a90;
}

.admin-process-btn {
  width: 100%;
  border: 1px solid #2f5a90;
  border-radius: 10px;
  padding: 8px 12px;
  color: #2f5a90;
  background: rgba(47, 90, 144, 0.14);
  cursor: pointer;
}

.admin-process-btn.done {
  border-color: #3aaa5d;
  color: #2e8d4f;
  background: rgba(58, 170, 93, 0.14);
}

.info-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.table {
  border-top: 1px solid #edf1f6;
}

.row {
  display: grid;
  grid-template-columns: 140px 1fr;
}

.row span {
  border-bottom: 1px solid #edf1f6;
  padding: 11px 8px;
  color: #48576d;
}

.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.appeal-image {
  width: 180px;
  max-width: 100%;
  border: 1px solid #dbe4f1;
  border-radius: 8px;
}

@media (max-width: 980px) {
  .confirm-actions {
    width: min(320px, 100%);
  }
  .appeal-grid {
    grid-template-columns: 1fr;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .detail-head {
    flex-direction: column;
  }
  .head-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .admin-status-label {
    text-align: left;
  }
}
</style>
