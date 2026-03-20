<script setup>
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { downloadProcessedCsv, runProcessTask } from "../../services/analyticsApi";

const auth = useAuthStore();
const running = ref(false);
const selectedFile = ref(null);
const fileInputRef = ref(null);

const pointsCost = ref(10);
const reportMarkdown = ref("");
const processPreview = ref({ columns: [], rows: [] });

const form = reactive({
  instruction: ""
});

const userId = computed(() => Number(auth.user?.id || auth.user?.userId || 0));
const remainPoints = computed(() => Number(auth.user?.points ?? 0));
const reportHtml = computed(() => renderMarkdown(reportMarkdown.value));

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function chooseFile() {
  fileInputRef.value?.click();
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

function normalizePreview(preview) {
  if (Array.isArray(preview)) {
    const rows = preview;
    const columns = rows.length ? Object.keys(rows[0] || {}) : [];
    return { columns, rows };
  }

  if (preview && typeof preview === "object") {
    const columns = Array.isArray(preview.columns) ? preview.columns : [];
    const rows = Array.isArray(preview.rows) ? preview.rows : [];
    if (columns.length || rows.length) return { columns, rows };
  }

  return { columns: [], rows: [] };
}

async function handleRun() {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择 CSV 文件");
    return;
  }
  if (!form.instruction.trim()) {
    ElMessage.warning("请输入处理指令");
    return;
  }
  if (!userId.value) {
    ElMessage.warning("未获取到用户信息，请重新登录");
    return;
  }
  if (remainPoints.value < pointsCost.value) {
    ElMessage.warning("积分不足，无法执行本次处理");
    return;
  }

  running.value = true;
  try {
    const result = await runProcessTask({
      file: selectedFile.value,
      userId: userId.value,
      userPrompt: form.instruction.trim()
    });

    const payload = result?.data ?? result ?? {};
    const report = payload.report ?? payload.markdown ?? "";
    const preview = payload.preview ?? payload.table ?? payload.rows ?? [];

    reportMarkdown.value = String(report || "");
    processPreview.value = normalizePreview(preview);

    if (typeof auth.updateProfile === "function") {
      auth.updateProfile({ points: Math.max(0, remainPoints.value - pointsCost.value) });
    }

    ElMessage.success("处理完成");
  } catch (error) {
    ElMessage.error(error?.message || "处理失败");
  } finally {
    running.value = false;
  }
}

async function handleDownload() {
  if (!userId.value) {
    ElMessage.warning("未获取到用户信息，请重新登录");
    return;
  }

  try {
    const csvData = await downloadProcessedCsv(userId.value);
    const blob = csvData instanceof Blob ? csvData : new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_processed.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error(error?.message || "下载失败");
  }
}

function renderMarkdown(markdownText) {
  const escaped = escapeHtml(String(markdownText || ""));
  const lines = escaped.split(/\r?\n/);
  const blocks = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      blocks.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      blocks.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      blocks.push(`<h1>${line.slice(2)}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        blocks.push("<ul>");
        inList = true;
      }
      blocks.push(`<li>${line.slice(2)}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!inList) {
        blocks.push("<ul>");
        inList = true;
      }
      blocks.push(`<li>${line.replace(/^\d+\.\s+/, "")}</li>`);
      continue;
    }

    if (inList) {
      blocks.push("</ul>");
      inList = false;
    }
    blocks.push(`<p>${line}</p>`);
  }

  if (inList) blocks.push("</ul>");
  return blocks.join("");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
</script>

<template>
  <section class="analytics-page">
    <section class="command-panel">
      <div class="upload-row">
        <input ref="fileInputRef" type="file" class="hidden-file" accept=".csv" @change="onFileChange" />
        <button type="button" class="btn ghost" @click="chooseFile">选择文件</button>
        <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择文件" }}</span>
      </div>
      <div class="command-row">
        <textarea v-model="form.instruction" rows="2" placeholder="请输入处理指令"></textarea>
        <button class="run-btn" type="button" :disabled="running" @click="handleRun">
          <span>{{ running ? "执行中..." : "执行" }}</span>
          <small>消耗 {{ pointsCost }} 积分</small>
        </button>
      </div>
    </section>

    <section class="result-grid">
      <article class="panel">
        <header class="panel-header">
          <h3>数据预览</h3>
          <button type="button" class="btn ghost small" @click="handleDownload">下载 CSV</button>
        </header>
        <div class="table-scroll" v-if="processPreview.columns.length">
          <table>
            <thead>
              <tr>
                <th v-for="col in processPreview.columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in processPreview.rows" :key="idx">
                <td v-for="col in processPreview.columns" :key="col">{{ row?.[col] ?? "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty">暂无预览数据</p>
      </article>

      <article class="panel">
        <header class="panel-header">
          <h3>处理报告</h3>
          <span class="head-tag">Markdown</span>
        </header>
        <div class="report-body" v-html="reportHtml || '<p>暂无报告</p>'"></div>
      </article>
    </section>

    <p class="points-info">本次消耗 <b>{{ pointsCost }}</b> 积分 · 剩余 <b>{{ formatNumber(remainPoints) }}</b></p>
  </section>
</template>

<style scoped>
.analytics-page {
  display: grid;
  gap: 12px;
}

.command-panel,
.panel {
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  background: #fff;
  min-width: 0;
  overflow: hidden;
}

.command-panel {
  padding: 14px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.hidden-file {
  display: none;
}

.file-name {
  flex: 1;
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 170px;
}

textarea {
  border: 1px solid #c7d7ef;
  border-radius: 12px;
  padding: 10px 12px;
  line-height: 1.5;
  font-size: 15px;
  color: #334155;
  background: #f8fbff;
  resize: vertical;
  min-height: 72px;
}

.run-btn {
  border: 1px solid #2f5a90;
  border-radius: 12px;
  color: #fff;
  background: #2f5a90;
  cursor: pointer;
  display: grid;
  place-items: center;
  gap: 4px;
}

.run-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.run-btn small {
  color: #dbe8fb;
}

.result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e4ecf7;
}

.panel h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2a37;
}

.head-tag {
  color: #2f5a90;
  font-size: 12px;
}

.table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e8eef8;
  text-align: left;
  padding: 8px 10px;
  color: #4b5d76;
  font-size: 13px;
  line-height: 1.35;
  min-width: 120px;
  white-space: nowrap;
}

.report-body {
  padding: 12px;
  color: #41556f;
  font-size: 14px;
  line-height: 1.7;
  min-height: 340px;
  max-height: 560px;
  overflow: auto;
}

.report-body :deep(h1) {
  margin: 0 0 10px;
  color: #1f2a37;
  font-size: 20px;
}

.report-body :deep(h2) {
  margin: 0 0 10px;
  color: #1f2a37;
  font-size: 18px;
}

.report-body :deep(h3) {
  margin: 12px 0 8px;
  color: #2f5a90;
  font-size: 16px;
}

.report-body :deep(p) {
  margin: 6px 0;
}

.report-body :deep(ul) {
  margin: 8px 0;
  padding-left: 18px;
}

.empty {
  margin: 0;
  padding: 12px;
  color: #64748b;
  min-height: 340px;
}

.btn {
  border: 1px solid #c7d7ef;
  border-radius: 12px;
  padding: 8px 16px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.points-info {
  margin: 0;
  color: #334155;
}

@media (max-width: 900px) {
  .command-row {
    grid-template-columns: 1fr;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>