<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { taskAppealApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const appeals = ref([]);

function statusText(status) {
  const code = Number(status ?? 0);
  if (code === 1) return "已受理";
  if (code === 2) return "已驳回";
  return "待处理";
}

function normalizeAppeal(item) {
  return {
    id: item.id,
    requestId: Number(item.requestId ?? item.request_id ?? 0),
    requestTitle: item.requestTitle ?? item.request_title ?? "",
    appellantRole: item.appellantRole ?? item.appellant_role ?? "",
    claimText: item.claimText ?? item.claim_text ?? "",
    evidenceText: item.evidenceText ?? item.evidence_text ?? "",
    evidenceImage: item.evidenceImage ?? item.evidence_image ?? "",
    status: Number(item.status ?? 0),
    createdAt: formatTime(item.createdAt ?? item.created_at ?? "")
  };
}

function formatTime(text) {
  return String(text || "").replace("T", " ");
}

const displayList = computed(() => appeals.value.map(normalizeAppeal));

function imageUrl(name) {
  return `/api/files/download?name=${encodeURIComponent(name)}`;
}

function openTaskDetail(item) {
  if (!item?.requestId) return;
  router.push(`/user/custom-bids/${item.requestId}`);
}

async function fetchAppeals() {
  if (!auth.user?.id) return;
  loading.value = true;
  try {
    const res = await taskAppealApi.getUserList(auth.user.id);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载申诉失败");
    }
    appeals.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    appeals.value = [];
    ElMessage.error(error?.message || "加载申诉失败");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAppeals);
</script>

<template>
  <section class="appeal-page" v-loading="loading">
    <div v-if="displayList.length === 0" class="empty">暂无申诉记录</div>

    <article v-for="item in displayList" :key="item.id" class="appeal-card">
      <header class="card-head">
        <div>
          <h3>{{ item.requestTitle || `任务 #${item.requestId}` }}</h3>
          <p class="meta">{{ item.appellantRole || "任务参与方" }} · {{ item.createdAt || "-" }}</p>
        </div>
        <span class="status">{{ statusText(item.status) }}</span>
      </header>

      <section class="block">
        <h4>诉求内容</h4>
        <p>{{ item.claimText || "暂无" }}</p>
      </section>

      <section class="block">
        <h4>证据说明</h4>
        <p>{{ item.evidenceText || "暂无" }}</p>
      </section>

      <section v-if="item.evidenceImage" class="block">
        <h4>证据图片</h4>
        <img class="evidence-image" :src="imageUrl(item.evidenceImage)" alt="证据图片" />
      </section>

      <button type="button" class="detail-btn" @click="openTaskDetail(item)">查看任务详情</button>
    </article>
  </section>
</template>

<style scoped>
.appeal-page {
  display: grid;
  gap: 12px;
}

.empty {
  border: 1px solid #e4ebf5;
  border-radius: 14px;
  padding: 18px;
  color: #798ca8;
  background: #fff;
}

.appeal-card {
  border: 1px solid #e4ebf5;
  border-radius: 14px;
  padding: 14px 16px;
  background: #fff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.card-head h3 {
  margin: 0;
  color: #1f2f45;
  font-size: 18px;
}

.meta {
  margin: 8px 0 0;
  color: #8192aa;
  font-size: 12px;
}

.status {
  border: 1px solid #d8e1f0;
  border-radius: 999px;
  padding: 2px 10px;
  color: #4d6382;
  font-size: 12px;
  background: #f6f9ff;
}

.block {
  margin-top: 12px;
}

.block h4 {
  margin: 0 0 6px;
  color: #2a3e59;
  font-size: 14px;
}

.block p {
  margin: 0;
  color: #55677f;
  line-height: 1.65;
}

.evidence-image {
  max-width: 320px;
  width: 100%;
  border: 1px solid #e2e8f3;
  border-radius: 10px;
  background: #fff;
}

.detail-btn {
  margin-top: 12px;
  border: 1px solid #c6d6ee;
  border-radius: 8px;
  padding: 6px 12px;
  color: #2f568c;
  background: #fff;
  cursor: pointer;
}
</style>

