<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { customRequestApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const auth = useAuthStore();

const task = ref(null);
const loading = ref(false);

function normalizeRequest(item) {
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    amount: item.amount || "",
    tags: item.tags || "",
    budget: Number(item.budget || 0),
    deadline: item.deadline || "",
    category: item.category || "其他",
    publisher: item.publisherName ?? item.publisher_name ?? "",
    publisherId: item.publisherId ?? item.publisher_id ?? null,
    publisherContact: item.publisherContact ?? item.publisher_contact ?? "",
    attachmentName: item.attachmentName ?? item.attachment_name ?? "",
    acceptorId: item.acceptorId ?? item.acceptor_id ?? null,
    acceptorName: item.acceptorName ?? item.acceptor_name ?? "",
    deliveryFileName: item.deliveryFileName ?? item.delivery_file_name ?? "",
    needStatus: item.needStatus ?? item.need_status ?? 0
  };
}

async function fetchTask() {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  try {
    const res = await customRequestApi.getById(id);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    task.value = normalizeRequest(res.data || {});
  } catch (e) {
    task.value = null;
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTask();
});

watch(
  () => route.params.id,
  () => {
    fetchTask();
  }
);

const statusText = computed(() => {
  if (!task.value) return "未承接";
  const status = Number(task.value.needStatus ?? 0);
  if (status === 1) return "进行中";
  if (status === 2) return "已完成";
  return "未承接";
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

async function handleAccept() {
  if (!task.value) return;
  if (statusText.value !== "未承接") {
    ElMessage.warning("该任务当前不可承接");
    return;
  }
  if (task.value.publisherId && auth.user?.id && task.value.publisherId === auth.user.id) {
    ElMessage.warning("不能承接自己发布的任务");
    return;
  }
  try {
    const res = await customRequestApi.accept(task.value.id, {
      acceptorId: auth.user?.id ?? null,
      acceptorName: auth.user?.name || ""
    });
    if (res?.code !== 200) {
      throw new Error(res?.message || "承接失败");
    }
    task.value.needStatus = 1;
    task.value.acceptorId = auth.user?.id ?? null;
    task.value.acceptorName = auth.user?.name || "";
    ElMessage.success("承接成功");
  } catch (e) {
    ElMessage.error(e?.message || "承接失败");
  }
}
</script>

<template>
  <section v-if="task" class="detail-page" v-loading="loading">
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
