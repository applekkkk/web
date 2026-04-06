<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { taskAppealApi } from "../../services/api";

const router = useRouter();
const loading = ref(false);
const list = ref([]);

const pageSizeOptions = [10, 20, 30, 50];
const pageSize = ref(10);
const currentPage = ref(1);

function formatTime(value) {
  return String(value || "").replace("T", " ");
}

function statusText(status) {
  return Number(status ?? 0) === 1 ? "已处理" : "待处理";
}

function normalize(item) {
  return {
    id: item.id,
    requestId: Number(item.requestId ?? item.request_id ?? 0),
    requestTitle: item.requestTitle ?? item.request_title ?? "",
    appellantId: Number(item.appellantId ?? item.appellant_id ?? 0),
    appellantName: item.appellantName ?? item.appellant_name ?? "",
    appellantRole: item.appellantRole ?? item.appellant_role ?? "",
    claimText: item.claimText ?? item.claim_text ?? "",
    evidenceText: item.evidenceText ?? item.evidence_text ?? "",
    evidenceImage: item.evidenceImage ?? item.evidence_image ?? "",
    status: Number(item.status ?? 0),
    createdAt: formatTime(item.createdAt ?? item.created_at ?? "")
  };
}

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return list.value.slice(start, start + pageSize.value);
});

function imageUrl(name) {
  return `/api/files/download?name=${encodeURIComponent(name)}`;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await taskAppealApi.getAll();
    if (res?.code !== 200) throw new Error(res?.message || "加载申诉失败");
    const rows = Array.isArray(res?.data) ? res.data : [];
    list.value = rows.map(normalize);
  } catch (error) {
    list.value = [];
    ElMessage.error(error?.message || "加载申诉失败");
  } finally {
    loading.value = false;
  }
}

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function openAppealDetail(item) {
  const targetId = Number(item?.requestId ?? 0);
  if (!targetId) return;
  const isDataAppeal = String(item?.appellantRole || "").includes("购买");
  const path = isDataAppeal ? `/admin/review/${targetId}` : `/admin/appeals/task/${targetId}`;
  router.push({
    path,
    query: {
      appealId: String(item.id || ""),
      buyerId: isDataAppeal ? String(item.appellantId ?? "") : undefined
    }
  });
}

onMounted(fetchList);
</script>

<template>
  <section class="appeals-page card" v-loading="loading">
    <h2>申诉处理</h2>

    <p v-if="list.length === 0" class="empty">暂无申诉记录</p>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>任务/数据</th>
            <th>申诉人</th>
            <th>诉求</th>
            <th>证据说明</th>
            <th>证据图片</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedList" :key="item.id" class="click-row" @click="openAppealDetail(item)">
            <td>{{ item.id }}</td>
            <td>
              <div class="task-cell">
                <button type="button" class="task-link" @click.stop="openAppealDetail(item)">
                  {{ item.requestTitle || `记录#${item.requestId}` }}
                </button>
                <small>目标ID：{{ item.requestId }}</small>
              </div>
            </td>
            <td>{{ item.appellantName || "-" }}（{{ item.appellantRole || "-" }}）</td>
            <td class="text-cell">{{ item.claimText || "-" }}</td>
            <td class="text-cell">{{ item.evidenceText || "-" }}</td>
            <td>
              <img v-if="item.evidenceImage" class="evidence-img" :src="imageUrl(item.evidenceImage)" alt="证据图片" />
              <span v-else>-</span>
            </td>
            <td>
              <span class="status" :class="{ done: Number(item.status) === 1 }">
                {{ statusText(item.status) }}
              </span>
            </td>
            <td>{{ item.createdAt || "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="list.length > 0" class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="list.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </section>
</template>

<style scoped>
.card {
  border: 1px solid #e4eaf5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

h2 {
  margin: 0 0 12px;
  color: #2c3b52;
  font-size: 18px;
}

.empty {
  margin: 0;
  color: #7a8ca6;
}

.table-wrap {
  width: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

th,
td {
  border-bottom: 1px solid #e5ecf7;
  padding: 10px 8px;
  text-align: left;
  font-size: 13px;
  color: #324863;
  vertical-align: top;
}

.click-row {
  cursor: pointer;
}

.click-row:hover td {
  background: #f8fbff;
}

.task-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-link {
  border: none;
  padding: 0;
  color: #2c4f7d;
  background: transparent;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.task-link:hover {
  text-decoration: underline;
}

.task-cell small {
  color: #7b8da7;
}

.text-cell {
  min-width: 180px;
  max-width: 240px;
  white-space: normal;
  word-break: break-word;
}

.evidence-img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dce4f1;
}

.status {
  border: 1px solid #9fc2ef;
  border-radius: 999px;
  padding: 2px 10px;
  color: #2f5a90;
  background: rgba(47, 90, 144, 0.12);
}

.status.done {
  border-color: #7bd69d;
  color: #2d8a4d;
  background: rgba(58, 170, 93, 0.12);
}

.pager-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
