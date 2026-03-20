<script setup>
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import * as analyticsApi from "../../services/analyticsApi";

const auth = useAuthStore();
const analytics = analyticsApi;

const running = ref(false);
const selectedFile = ref(null);
const fileInputRef = ref(null);
const pointsCost = ref(10);
const reportMarkdown = ref("");

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
  const file = event.target.files?.[0];
  selectedFile.value = file || null;
}

async function handleRun() {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择 CSV 文件");
    return;
  }
  if (!form.instruction.trim()) {
    ElMessage.warning("请先输入处理指令");
    return;
  }
  if (!userId.value) {
    ElMessage.warning("未识别到用户，请重新登录");
    return;
  }
  if (remainPoints.value < pointsCost.value) {
    ElMessage.warning("积分不足，无法执行");
    return;
  }

  running.value = true;
  try {
    const result = await analytics.runProcessTask({
      file: selectedFile.value,
      userId: userId.value,
      userPrompt: form.instruction.trim()
    });

    reportMarkdown.value = extractReport(result);
    auth.updateProfile({ points: remainPoints.value - pointsCost.value });
    ElMessage.success("处理完成，正在下载结果文件");
    await handleDownload();
  } catch (error) {
    ElMessage.error(error?.message || "处理执行失败");
  } finally {
    running.value = false;
  }
}

function extractReport(result) {
  if (typeof result === "string") return result;
  if (result?.report) return String(result.report);
  if (result?.data?.report) return String(result.data.report);
  if (result?.messages?.length) {
    const last = result.messages[result.messages.length - 1];
    if (last?.content) return String(last.content);
  }
  return "处理已完成，但未返回报告内容。";
}

async function handleDownload() {
  const csvData = await analytics.downloadProcessedCsv(userId.value);
  const blob = csvData instanceof Blob ? csvData : new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "analytics_processed.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
      blocks.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      blocks.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s+/.test(line)) {
      if (!inList) {
        blocks.push("<ul>");
        inList = true;
      }
      blocks.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, "").slice(2).trim() || line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      blocks.push("</ul>");
      inList = false;
    }
    blocks.push(`<p>${formatInline(line)}</p>`);
  }
  if (inList) blocks.push("</ul>");
  return blocks.join("");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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

    <section class="report-panel">
      <header>
        <h3>分析报告</h3>
      </header>
      <div class="report-body" v-html="reportHtml || '<p>暂无报告</p>'"></div>
    </section>

    <p class="points-info">本次消耗 <b>{{ pointsCost }}</b> 积分 ・ 剩余 <b>{{ formatNumber(remainPoints) }}</b></p>
  </section>
</template>

<style scoped>
.analytics-page {
  display: grid;
  gap: 12px;
}

.command-panel,
.report-panel {
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
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
  color: #334155;
  background: #f8fbff;
  resize: vertical;
  line-height: 1.5;
  font-size: 15px;
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

.run-btn small {
  color: #dbe8fb;
}

.btn {
  border: 1px solid #c7d7ef;
  border-radius: 12px;
  padding: 8px 16px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.report-panel h3 {
  margin: 0 0 10px;
  color: #1f2a37;
}

.report-body {
  color: #41556f;
  font-size: 14px;
  line-height: 1.7;
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

.points-info {
  margin: 0;
  color: #334155;
}

@media (max-width: 900px) {
  .command-row {
    grid-template-columns: 1fr;
  }
}
</style>
