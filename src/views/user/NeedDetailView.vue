<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "../../services/request";
import { customRequestApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const auth = useAuthStore();

const task = ref(null);
const loading = ref(false);
const submittingDelivery = ref(false);
const completing = ref(false);
const rejecting = ref(false);
const deliveryFile = ref(null);
const deliveryInputRef = ref(null);

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
const isPublisher = computed(() => Number(task.value?.publisherId ?? 0) === Number(auth.user?.id ?? 0));
const isAcceptor = computed(() => Number(task.value?.acceptorId ?? 0) === Number(auth.user?.id ?? 0));
const canAccept = computed(() => statusCode.value === 0 && !isPublisher.value);
const canSubmitDelivery = computed(() => statusCode.value === 1 && isAcceptor.value);
const canConfirmComplete = computed(() => statusCode.value === 2 && isPublisher.value);
const canShowCounterpartyEmail = computed(() => statusCode.value === 1 || statusCode.value === 2);

const counterpartyEmail = computed(() => {
  if (!task.value || !canShowCounterpartyEmail.value) return "";
  if (isPublisher.value) return task.value.acceptorEmail || "";
  if (isAcceptor.value) return task.value.publisherEmail || "";
  return "";
});

const statusText = computed(() => {
  if (statusCode.value === 1) return "进行中";
  if (statusCode.value === 2) return "待发布者确认";
  if (statusCode.value === 3) return "已完成";
  return "未承接";
});

const detailRows = computed(() => {
  if (!task.value) return [];
  return [
    { key: "任务类别", value: task.value.category || "未填写" },
    { key: "数据量", value: task.value.amount || "未填写" },
    { key: "预算", value: `${task.value.budget || 0} 积分` },
    { key: "发布者", value: task.value.publisher || "未填写" },
    { key: "发布者邮箱", value: task.value.publisherEmail || "未绑定" },
    { key: "联系方式", value: task.value.publisherContact || "未填写" },
    { key: "承接方", value: task.value.acceptorName || "未承接" },
    { key: "承接方邮箱", value: task.value.acceptorEmail || "未绑定" },
    { key: "示例文件", value: task.value.attachmentName || "未上传" },
    { key: "交付文件", value: task.value.deliveryFileName || "未交付" }
  ];
});

async function fetchTask() {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  try {
    const res = await customRequestApi.getById(id);
    if (res?.code !== 200) throw new Error(res?.message || "加载失败");
    task.value = normalizeRequest(res.data || {});
  } catch (error) {
    task.value = null;
    ElMessage.error(error?.message || "加载失败");
  } finally {
    loading.value = false;
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
  deliveryFile.value = file || null;
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

async function handleSubmitDelivery() {
  if (!task.value || !canSubmitDelivery.value) return;
  if (!deliveryFile.value) {
    ElMessage.warning("请先选择交付文件");
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
</script>

<template>
  <section v-if="task" class="detail-page" v-loading="loading">
    <header class="detail-head">
      <div>
        <h1>{{ task.title || "未命名任务" }}</h1>
        <div class="meta-row">
          <span>预算：{{ task.budget || 0 }} 积分</span>
          <span>数据量：{{ task.amount || "-" }}</span>
        </div>
      </div>
      <span class="status">{{ statusText }}</span>
      <button v-if="canAccept" class="action-btn" type="button" @click="handleAccept">承接任务</button>
      <div v-else-if="canConfirmComplete" class="confirm-actions">
        <button class="action-btn reject" type="button" :disabled="rejecting" @click="handleReject">
          {{ rejecting ? "打回中..." : "打回任务" }}
        </button>
        <button class="action-btn done" type="button" :disabled="completing" @click="handleComplete">
          {{ completing ? "确认中..." : "确认完成并结算" }}
        </button>
      </div>
    </header>

    <section class="block">
      <h2>对方邮箱</h2>
      <p v-if="canShowCounterpartyEmail">{{ counterpartyEmail || "对方未绑定邮箱" }}</p>
      <p v-else>任务未承接，暂无可查看邮箱</p>
    </section>

    <section v-if="canSubmitDelivery" class="delivery-panel">
      <input ref="deliveryInputRef" type="file" class="hidden-file" accept=".csv,text/csv" @change="onDeliveryFileChange" />
      <button type="button" class="small-btn" @click="chooseDeliveryFile">选择交付文件</button>
      <span class="file-name">{{ deliveryFile ? deliveryFile.name : "未选择文件" }}</span>
      <button type="button" class="small-btn primary" :disabled="submittingDelivery" @click="handleSubmitDelivery">
        {{ submittingDelivery ? "提交中..." : "提交交付" }}
      </button>
    </section>

    <section class="block">
      <h2>任务描述</h2>
      <p>{{ task.description || "暂无描述" }}</p>
    </section>

    <section class="block">
      <h2>任务文件</h2>
      <div class="file-actions">
        <button type="button" class="small-btn" :disabled="!task.attachmentName" @click="downloadFile(task.attachmentName)">下载示例文件</button>
        <button type="button" class="small-btn" :disabled="!task.deliveryFileName" @click="downloadFile(task.deliveryFileName)">下载交付文件</button>
      </div>
    </section>

    <section class="block">
      <h2>任务详情</h2>
      <div class="table">
        <div v-for="row in detailRows" :key="row.key" class="row">
          <span>{{ row.key }}</span>
          <span>{{ row.value }}</span>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.detail-page { border: 1px solid #eceff4; border-radius: 18px; padding: 24px 28px; background: #fff; }
.detail-head { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; border-bottom: 1px solid #eef1f5; padding-bottom: 16px; }
h1 { margin: 0; color: #232c38; font-size: 32px; }
.meta-row { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 10px; color: #6c7788; font-size: 14px; }
.status { border: 1px solid #d5deea; border-radius: 999px; padding: 5px 12px; color: #4d5f78; background: #f4f7fb; font-size: 12px; }
.action-btn { border: 1px solid #d8b989; border-radius: 999px; padding: 8px 16px; color: #b98335; background: #fff; cursor: pointer; }
.confirm-actions { display: flex; gap: 8px; }
.action-btn.reject { border-color: #d9a5a5; color: #a74a4a; }
.action-btn.done { border-color: #2f5a90; color: #2f5a90; }
.delivery-panel { margin-top: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; border: 1px dashed #d8e2f1; border-radius: 12px; padding: 10px 12px; }
.hidden-file { display: none; }
.file-name { color: #5b6a80; font-size: 13px; }
.small-btn { border: 1px solid #c7d7ef; border-radius: 8px; padding: 6px 12px; color: #2f4e74; background: #fff; cursor: pointer; }
.small-btn.primary { border-color: #2f5a90; color: #fff; background: #2f5a90; }
.block { margin-top: 22px; }
h2 { margin: 0 0 12px; font-size: 22px; color: #232c38; }
p { margin: 0; color: #414e5f; font-size: 15px; line-height: 1.8; }
.file-actions { display: flex; gap: 10px; }
.table { border-top: 1px solid #edf1f6; }
.row { display: grid; grid-template-columns: 1fr 3fr; }
.row span { border-bottom: 1px solid #edf1f6; padding: 13px 10px; color: #4a5668; }
</style>
