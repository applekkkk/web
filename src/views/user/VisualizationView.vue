<script setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { renderNetworkVisualization } from "../../services/visualizationApi";

const auth = useAuthStore();
const userId = computed(() => Number(auth.user?.id || auth.user?.userId || 0));

const fileInputRef = ref(null);
const selectedFile = ref(null);
const loading = ref(false);
const imageUrl = ref("");
const imageObjectUrl = ref(false);

const form = reactive({
  layout: "force",
  theme: "light",
  description: ""
});

function chooseFile() {
  fileInputRef.value?.click();
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

function cleanupImageUrl() {
  if (imageObjectUrl.value && imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = "";
  imageObjectUrl.value = false;
}

async function handleRender() {
  if (!selectedFile.value) {
    ElMessage.warning("请先上传网络数据文件");
    return;
  }

  loading.value = true;
  cleanupImageUrl();
  try {
    const result = await renderNetworkVisualization({
      file: selectedFile.value,
      userId: userId.value || undefined,
      options: {
        layout: form.layout,
        theme: form.theme,
        description: form.description.trim()
      }
    });

    imageUrl.value = result.imageUrl;
    imageObjectUrl.value = Boolean(result.isObjectUrl);
    ElMessage.success("可视化结果已生成");
  } catch (error) {
    ElMessage.error(error?.message || "可视化生成失败");
  } finally {
    loading.value = false;
  }
}

function handleDownloadImage() {
  if (!imageUrl.value) return;
  const link = document.createElement("a");
  link.href = imageUrl.value;
  link.download = "network_visualization.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

onBeforeUnmount(() => {
  cleanupImageUrl();
});
</script>

<template>
  <section class="viz-page">
    <article class="panel">
      <header class="panel-header">
        <h3>数据可视化展示</h3>
        <span class="tip">前端已预留后端接口：`POST /visualization/render`</span>
      </header>

      <div class="upload-row">
        <input ref="fileInputRef" type="file" class="hidden-file" accept=".csv,.json,.gml,.graphml,.txt" @change="onFileChange" />
        <button type="button" class="btn ghost" @click="chooseFile">选择文件</button>
        <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择文件" }}</span>
      </div>

      <div class="form-grid">
        <label>
          布局方式
          <el-select v-model="form.layout" placeholder="请选择布局">
            <el-option label="力导向" value="force" />
            <el-option label="环形" value="circular" />
            <el-option label="弹簧" value="spring" />
          </el-select>
        </label>
        <label>
          主题
          <el-select v-model="form.theme" placeholder="请选择主题">
            <el-option label="浅色" value="light" />
            <el-option label="深色" value="dark" />
          </el-select>
        </label>
      </div>

      <textarea v-model="form.description" rows="2" placeholder="可选：补充可视化要求（例如突出高中心度节点）"></textarea>

      <div class="actions">
        <button type="button" class="btn primary" :disabled="loading" @click="handleRender">
          {{ loading ? "生成中..." : "生成可视化" }}
        </button>
        <button type="button" class="btn ghost" :disabled="!imageUrl" @click="handleDownloadImage">下载图片</button>
      </div>
    </article>

    <article class="panel result-panel">
      <header class="panel-header">
        <h3>可视化结果</h3>
      </header>
      <div v-if="imageUrl" class="image-wrap">
        <img :src="imageUrl" alt="可视化结果图" />
      </div>
      <p v-else class="empty">上传网络文件后，点击“生成可视化”即可展示后端返回图片</p>
    </article>
  </section>
</template>

<style scoped>
.viz-page {
  display: grid;
  gap: 12px;
}

.panel {
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e4ecf7;
}

.panel-header h3 {
  margin: 0;
  color: #1f2a37;
}

.tip {
  color: #6f84a1;
  font-size: 12px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 0;
}

.hidden-file {
  display: none;
}

.file-name {
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 14px 0;
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #51657f;
}

textarea {
  border: 1px solid #c7d7ef;
  border-radius: 10px;
  padding: 10px 12px;
  color: #334155;
  background: #f8fbff;
  font-size: 14px;
}

:deep(.el-select) {
  width: 100%;
}

textarea {
  margin: 12px 14px 0;
  resize: vertical;
}

.actions {
  display: flex;
  gap: 10px;
  padding: 12px 14px 14px;
}

.result-panel .image-wrap {
  padding: 14px;
}

.result-panel img {
  display: block;
  width: 100%;
  max-height: 560px;
  object-fit: contain;
  border: 1px solid #e6edf8;
  border-radius: 10px;
  background: #f8fbff;
}

.empty {
  margin: 0;
  padding: 20px 14px;
  color: #6f84a1;
}

.btn {
  border: 1px solid #c7d7ef;
  border-radius: 10px;
  padding: 8px 14px;
  color: #2f4e74;
  background: #fff;
  cursor: pointer;
}

.btn.primary {
  border-color: #2f5a90;
  color: #fff;
  background: #2f5a90;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
