<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useNeedsStore } from "../../stores/needs";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const needsStore = useNeedsStore();
const auth = useAuthStore();
const fileInputRef = ref(null);

const task = computed(() => {
  const id = String(route.params.id || "");
  return needsStore.allNeeds.find((item) => String(item.id) === id) || null;
});

const statusText = computed(() => {
  if (!task.value) return "未承接";
  return task.value.needStatus || (task.value.acceptedBy ? "进行中" : "未承接");
});

const canUploadDelivery = computed(() => {
  if (!task.value) return false;
  const mine = task.value.acceptedBy === (auth.user?.name || "");
  return mine && ["进行中", "已交付"].includes(statusText.value);
});

const detailRows = computed(() => {
  if (!task.value) return [];
  return [
    { key: "任务标题", value: task.value.title || "未填写" },
    { key: "任务类别", value: task.value.category || "未填写" },
    { key: "状态", value: statusText.value },
    { key: "数据量", value: task.value.amount || "未填写" },
    { key: "预算", value: `${task.value.budget || 0} 积分` },
    { key: "截止日期", value: task.value.deadline || "未填写" },
    { key: "发布者", value: task.value.publisher || "未填写" },
    { key: "联系方式", value: task.value.publisherContact || "未填写" },
    { key: "示例数据文件", value: task.value.attachmentName || "未上传" },
    { key: "交付文件", value: task.value.deliveryFileName || "未交付" }
  ];
});

function handleAccept() {
  if (!task.value) return;
  if (statusText.value !== "未承接") {
    ElMessage.warning("该任务当前不可承接");
    return;
  }
  const result = needsStore.acceptNeed(task.value.id, auth.user?.name || "");
  if (result.ok) {
    ElMessage.success("承接成功");
    return;
  }
  if (result.reason === "self") {
    ElMessage.warning("不能承接自己发布的任务");
    return;
  }
  ElMessage.error("承接失败");
}

function triggerDelivery() {
  if (!canUploadDelivery.value) return;
  fileInputRef.value?.click();
}

function onFileChange(event) {
  const file = event.target.files?.[0] || null;
  if (!file || !task.value) return;
  const result = needsStore.deliverTask(task.value.id, auth.user?.name || "", file.name);
  event.target.value = "";
  if (!result.ok) {
    ElMessage.warning("当前状态不可交付");
    return;
  }
  ElMessage.success("交付成功");
}
</script>

<template>
  <section v-if="task" class="detail-page">
    <header class="detail-head">
      <div class="head-main">
        <h1>{{ task.title || "未命名任务" }}</h1>
        <div class="meta-row">
          <span class="meta-item"><span class="meta-label">类别：</span><span class="meta-value">{{ task.category || "未填写" }}</span></span>
          <span class="meta-item"><span class="meta-label">预算：</span><span class="meta-value">{{ task.budget || 0 }} 积分</span></span>
          <span class="meta-item"><span class="meta-label">截止：</span><span class="meta-value">{{ task.deadline || "未填写" }}</span></span>
        </div>
      </div>
      <span class="status">{{ statusText }}</span>
      <button v-if="statusText === '未承接'" class="accept" type="button" @click="handleAccept">承接任务</button>
    </header>

    <section class="block">
      <h2>任务描述</h2>
      <p>{{ task.description || "发布者未填写任务描述。" }}</p>
    </section>

    <section v-if="canUploadDelivery" class="block">
      <h2>交付上传</h2>
      <div class="upload-row">
        <input ref="fileInputRef" type="file" class="hidden-file" @change="onFileChange" />
        <span class="file-name">{{ task.deliveryFileName || "未交付文件" }}</span>
        <button type="button" class="accept" @click="triggerDelivery">交付上传</button>
      </div>
    </section>

    <section class="block">
      <h2>任务明细</h2>
      <div class="table">
        <div v-for="row in detailRows" :key="row.key" class="row">
          <span>{{ row.key }}</span>
          <span>{{ row.value }}</span>
        </div>
      </div>
    </section>
  </section>

  <section v-else class="empty">
    <p>未找到对应任务。</p>
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
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eef1f5;
  padding-bottom: 16px;
}

h1 {
  margin: 0;
  color: #232c38;
  font-size: 32px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 10px;
}

.meta-item {
  color: #6c7788;
  font-size: 14px;
}

.meta-label {
  font-weight: 400;
}

.meta-value {
  font-weight: 300;
}

.status {
  border: 1px solid #d5deea;
  border-radius: 999px;
  padding: 5px 12px;
  color: #4d5f78;
  background: #f4f7fb;
  font-size: 12px;
}

.accept {
  border: 1px solid #d8b989;
  border-radius: 999px;
  padding: 8px 16px;
  color: #b98335;
  background: #fff;
  cursor: pointer;
}

.block {
  margin-top: 22px;
}

h2 {
  margin: 0 0 12px;
  font-size: 22px;
  color: #232c38;
}

p {
  margin: 0;
  color: #414e5f;
  font-size: 15px;
  line-height: 1.8;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.hidden-file {
  display: none;
}

.file-name {
  color: #637894;
  font-size: 13px;
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
  padding: 13px 10px;
  color: #4a5668;
}

.empty {
  display: grid;
  gap: 14px;
}

@media (max-width: 900px) {
  .detail-head {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 28px;
  }

  .row {
    grid-template-columns: 1fr 2fr;
  }
}
</style>
