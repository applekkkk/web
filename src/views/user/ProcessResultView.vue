<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { marked } from "marked";
import { aiProcessRecordApi } from "../../services/api";
import { downloadProcessedCsv, downloadProcessedCsvByName } from "../../services/analyticsApi";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const record = ref(null);

const orderNo = computed(() => String(route.params.orderNo || ""));
const reportHtml = computed(() => {
  const raw = String(record.value?.reportMarkdown || "").trim();
  if (!raw) return "<p>暂无报告</p>";
  try {
    return marked.parse(raw, { gfm: true, breaks: true });
  } catch {
    return raw.replace(/\r?\n/g, "<br/>");
  }
});

const previewData = computed(() => {
  const raw = record.value?.previewJson;
  if (!raw) return { columns: [], rows: [] };
  if (typeof raw === "object") return normalizePreview(raw);
  try {
    return normalizePreview(JSON.parse(raw));
  } catch {
    return { columns: [], rows: [] };
  }
});

function normalizePreview(data) {
  if (!data || typeof data !== "object") return { columns: [], rows: [] };
  const rows = Array.isArray(data.rows) ? data.rows : [];
  let columns = Array.isArray(data.columns) ? data.columns : [];
  if (!columns.length && rows.length && rows[0] && typeof rows[0] === "object") {
    columns = Object.keys(rows[0]);
  }
  return { columns, rows };
}

async function loadRecord() {
  if (!orderNo.value) return;
  if (!auth.user?.id) {
    ElMessage.warning("未获取到用户信息，请重新登录");
    return;
  }
  loading.value = true;
  try {
    const res = await aiProcessRecordApi.getByOrderNo(orderNo.value, auth.user.id);
    if (res?.code !== 200 || !res?.data) {
      throw new Error(res?.message || "未找到处理记录");
    }
    record.value = res.data;
  } catch (error) {
    ElMessage.error(error?.message || "加载处理记录失败");
  } finally {
    loading.value = false;
  }
}

async function handleDownloadCsv() {
  const uid = Number(record.value?.userId || auth.user?.id || 0);
  if (!uid) {
    ElMessage.warning("未获取到用户信息，请重新登录");
    return;
  }
  try {
    const fileName = String(record.value?.resultFileName || "").trim();
    const csvData = fileName ? await downloadProcessedCsvByName(fileName) : await downloadProcessedCsv(uid);
    const blob = csvData instanceof Blob ? csvData : new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `${uid}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    ElMessage.success("下载成功");
  } catch (error) {
    ElMessage.error(error?.message || "下载失败");
  }
}

onMounted(loadRecord);
</script>

<template>
  <section class="result-page" v-loading="loading">
    <section class="summary-card">
      <div>
        <h2>AI处理结果</h2>
        <p>订单号：{{ orderNo }}</p>
      </div>
      <button type="button" class="back-btn" @click="router.push('/user/profile?tab=我的订单')">返回我的订单</button>
    </section>

    <section class="result-grid">
      <article class="panel">
        <header class="panel-head">
          <h3>数据预览</h3>
          <button type="button" class="download-btn" @click="handleDownloadCsv">下载 CSV</button>
        </header>
        <el-scrollbar class="table-wrap subtle-scrollbar" v-if="previewData.columns.length" max-height="520">
          <table>
            <thead>
              <tr>
                <th v-for="col in previewData.columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewData.rows" :key="idx">
                <td v-for="col in previewData.columns" :key="col">{{ row?.[col] ?? "-" }}</td>
              </tr>
            </tbody>
          </table>
        </el-scrollbar>
        <p v-else class="empty">暂无预览数据</p>
      </article>

      <article class="panel">
        <header class="panel-head">
          <h3>处理报告</h3>
          <span>Markdown</span>
        </header>
        <div class="report" v-html="reportHtml"></div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.result-page {
  display: grid;
  gap: 12px;
}

.summary-card,
.panel {
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  background: #fff;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.summary-card h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2a37;
}

.summary-card p {
  margin: 4px 0 0;
  color: #64748b;
}

.back-btn {
  border: 1px solid #c7d7ef;
  border-radius: 999px;
  padding: 7px 14px;
  color: #2f5a90;
  background: #fff;
  cursor: pointer;
}

.result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.panel {
  min-width: 0;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e4ecf7;
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2a37;
}

.panel-head span {
  color: #2f5a90;
  font-size: 12px;
}

.download-btn {
  border: 1px solid #c7d7ef;
  border-radius: 999px;
  padding: 6px 12px;
  color: #2f5a90;
  background: #fff;
  cursor: pointer;
}

.table-wrap {
  max-height: 520px;
}

.subtle-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
  right: 2px;
  opacity: 0.35;
}

.subtle-scrollbar :deep(.el-scrollbar__bar.is-horizontal) {
  height: 6px;
  bottom: 2px;
  opacity: 0.35;
}

.subtle-scrollbar :deep(.el-scrollbar__thumb) {
  border-radius: 999px;
  background: rgba(123, 143, 173, 0.32);
}

.subtle-scrollbar :deep(.el-scrollbar__bar:hover .el-scrollbar__thumb) {
  background: rgba(94, 121, 158, 0.5);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e8eef8;
  padding: 8px 10px;
  font-size: 13px;
  color: #2f4058;
  white-space: nowrap;
}

.report {
  max-height: 520px;
  overflow: auto;
  padding: 12px;
  color: #2f4058;
  line-height: 1.7;
}

.empty {
  margin: 12px;
  color: #7b8797;
}

@media (max-width: 1080px) {
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
