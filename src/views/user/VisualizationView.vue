<script setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import {
  renderNetworkVisualization,
  getNetworkStats,
  getNetworkCentrality,
  getNetworkCommunities,
} from "../../services/visualizationApi";

const auth = useAuthStore();
const userId = computed(() => Number(auth.user?.id || auth.user?.userId || 0));

const fileInputRef = ref(null);
const selectedFile = ref(null);
const loading = ref(false);
const activeTab = ref("image");

const form = reactive({
  layout: "force",
  theme: "light",
  description: "",
});

const imageUrl = ref("");
const imageObjectUrl = ref(false);
const stats = ref(null);
const centrality = ref(null);
const communities = ref(null);

const layoutOptions = [
  { value: "force", label: "力导向" },
  { value: "circular", label: "环形" },
  { value: "spring", label: "弹簧" },
  { value: "kamada_kawai", label: "KK" },
  { value: "spectral", label: "谱布局" },
  { value: "shell", label: "壳层" },
];

const centLabels = {
  degree: "度中心性",
  betweenness: "介数中心性",
  closeness: "接近中心性",
  pagerank: "PageRank",
};

const tabs = [
  { key: "image", label: "可视化" },
  { key: "stats", label: "统计" },
  { key: "centrality", label: "中心性" },
  { key: "communities", label: "社团" },
];

const statCards = computed(() => [
  { key: "num_nodes", label: "节点数", format: (s) => s.num_nodes },
  { key: "num_edges", label: "边数", format: (s) => s.num_edges },
  { key: "density", label: "密度", format: (s) => fmt(s.density, 6) },
  { key: "avg_degree", label: "平均度", format: (s) => fmt(s.avg_degree, 3) },
  { key: "clustering", label: "平均聚类系数", format: (s) => fmt(s.avg_clustering, 4) },
  { key: "connected", label: "弱连通", format: (s) => (s.is_weakly_connected ? "是" : "否") },
  { key: "components", label: "连通分量数", format: (s) => s.num_weakly_connected_components },
]);

function chooseFile() {
  fileInputRef.value?.click();
}

function cleanupImageUrl() {
  if (imageObjectUrl.value && imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = "";
  imageObjectUrl.value = false;
}

function resetResults() {
  cleanupImageUrl();
  stats.value = null;
  centrality.value = null;
  communities.value = null;
}

function onFileChange(e) {
  selectedFile.value = e.target.files?.[0] || null;
  resetResults();
}

async function handleRender() {
  if (!selectedFile.value) {
    ElMessage.warning("请先上传网络数据文件");
    return;
  }

  loading.value = true;
  resetResults();

  try {
    const [imgResult, statsResult, centralityResult, commResult] = await Promise.allSettled([
      renderNetworkVisualization({
        file: selectedFile.value,
        userId: userId.value || undefined,
        options: {
          layout: form.layout,
          theme: form.theme,
          description: form.description.trim(),
        },
      }),
      getNetworkStats({ file: selectedFile.value }),
      getNetworkCentrality({ file: selectedFile.value, top: 15 }),
      getNetworkCommunities({ file: selectedFile.value }),
    ]);

    if (imgResult.status === "fulfilled") {
      imageUrl.value = imgResult.value.imageUrl;
      imageObjectUrl.value = Boolean(imgResult.value.isObjectUrl);
    } else {
      throw new Error(imgResult.reason?.message || "图片生成失败");
    }

    if (statsResult.status === "fulfilled") stats.value = statsResult.value;
    if (centralityResult.status === "fulfilled") centrality.value = centralityResult.value;
    if (commResult.status === "fulfilled") communities.value = commResult.value;

    activeTab.value = "image";
    ElMessage.success("分析完成");
  } catch (err) {
    ElMessage.error(err?.message || "请求失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

function handleDownload() {
  if (!imageUrl.value) return;
  const link = document.createElement("a");
  link.href = imageUrl.value;
  link.download = "network_visualization.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function fmt(val, digits = 4) {
  return typeof val === "number" ? val.toFixed(digits) : val ?? "--";
}

function pct(val) {
  return typeof val === "number" ? `${(val * 100).toFixed(2)}%` : "0%";
}

function communityColor(id) {
  const hues = [210, 150, 30, 280, 0, 180, 60, 320, 90, 240];
  return `hsl(${hues[id % hues.length]}, 65%, 55%)`;
}

onBeforeUnmount(cleanupImageUrl);
</script>

<template>
  <section class="viz-root">
    <article class="config-card">
      <div class="card-body">
        <div class="upload-row">
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-file"
            accept=".net,.pajek,.gml,.graphml,.txt,.edgelist,.json"
            @change="onFileChange"
          />
          <div class="upload-left">
            <button type="button" class="btn ghost" @click="chooseFile">选择文件</button>
            <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择文件" }}</span>
          </div>
          <label class="upload-layout">
            布局方式
            <el-select v-model="form.layout" placeholder="请选择布局">
              <el-option v-for="opt in layoutOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </label>
        </div>

        <p class="file-tip">支持 .net / .gml / .graphml / .txt</p>

        <div class="actions">
          <button type="button" class="btn primary" :disabled="loading" @click="handleRender">
            {{ loading ? "生成中..." : "生成分析" }}
          </button>
          <button type="button" class="btn ghost" :disabled="!imageUrl" @click="handleDownload">下载图片</button>
        </div>
      </div>
    </article>

    <article class="result-card">
      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'communities' && communities?.num_communities" class="tab-badge">
            {{ communities.num_communities }}
          </span>
        </button>
      </nav>

      <div v-show="activeTab === 'image'" class="panel img-panel">
        <div v-if="imageUrl" class="img-wrap">
          <img :src="imageUrl" alt="网络可视化结果" />
        </div>
        <div v-else class="empty-state">
          <p>上传网络文件后，点击“生成分析”</p>
        </div>
      </div>

      <div v-show="activeTab === 'stats'" class="panel">
        <div v-if="stats" class="stats-grid">
          <div v-for="item in statCards" :key="item.key" class="stat-card">
            <p class="stat-label">{{ item.label }}</p>
            <p class="stat-value">{{ item.format(stats) }}</p>
          </div>
        </div>
        <div v-else class="empty-state"><p>暂无统计数据，请先生成分析</p></div>
      </div>

      <div v-show="activeTab === 'centrality'" class="panel">
        <div v-if="centrality" class="cent-wrap">
          <div v-for="(items, metric) in centrality" :key="metric" class="cent-section">
            <h4>{{ centLabels[metric] || metric }}</h4>
            <div class="cent-list">
              <div v-for="(item, idx) in items" :key="`${metric}-${item.node}`" class="cent-row">
                <span class="rank">#{{ idx + 1 }}</span>
                <span class="name" :title="item.label">{{ item.label }}</span>
                <div class="bar-wrap">
                  <div class="bar" :style="{ width: pct(item.value / (items[0]?.value || 1)) }" />
                </div>
                <span class="value">{{ fmt(item.value, 4) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><p>暂无中心性数据，请先生成分析</p></div>
      </div>

      <div v-show="activeTab === 'communities'" class="panel">
        <div v-if="communities" class="community-wrap">
          <p class="community-summary">
            发现 <strong>{{ communities.num_communities }}</strong> 个社团，模块度
            <strong>{{ fmt(communities.modularity, 4) }}</strong>
          </p>
          <div class="community-grid">
            <div
              v-for="community in communities.communities"
              :key="community.id"
              class="community-card"
              :style="{ '--accent': communityColor(community.id) }"
            >
              <div class="community-head">
                <span>社团 {{ community.id + 1 }}</span>
                <span>{{ community.size }} 节点</span>
              </div>
              <div class="community-nodes">
                <span
                  v-for="node in community.nodes.slice(0, 8)"
                  :key="node.id"
                  :title="node.label"
                  class="node-tag"
                >
                  {{ node.label.split(".").pop() }}
                </span>
                <span v-if="community.nodes.length > 8" class="node-tag more">
                  +{{ community.nodes.length - 8 }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><p>暂无社团数据，请先生成分析</p></div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.viz-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-card,
.result-card {
  border: 1px solid #dfe7f3;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.card-body {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.hidden-file {
  display: none;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.upload-layout {
  width: 240px;
  flex-shrink: 0;
}

.file-name {
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-tip {
  margin: 0;
  color: #6f84a1;
  font-size: 12px;
}

label,
.text-label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #51657f;
}

:deep(.el-select) {
  width: 100%;
}

.actions {
  display: flex;
  gap: 10px;
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

.tabs {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid #e4ecf7;
}

.tab {
  border: 1px solid #c7d7ef;
  background: #fff;
  border-radius: 999px;
  color: #5f7697;
  font-size: 13px;
  padding: 6px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab.active {
  background: #2f5a90;
  border-color: #2f5a90;
  color: #fff;
}

.tab-badge {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  padding: 0 6px;
  font-size: 11px;
}

.panel {
  min-height: 380px;
}

.img-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-wrap {
  width: 100%;
  padding: 14px;
}

.img-wrap img {
  width: 100%;
  max-height: 640px;
  object-fit: contain;
  border: 1px solid #e6edf8;
  border-radius: 10px;
  background: #f8fbff;
  display: block;
}

.empty-state {
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6f84a1;
}

.stats-grid {
  padding: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.stat-card {
  border: 1px solid #e0eaf8;
  border-radius: 12px;
  background: #f6f9ff;
  padding: 12px 14px;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  color: #7a90b0;
}

.stat-value {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a2540;
}

.cent-wrap {
  padding: 14px;
  display: grid;
  gap: 16px;
}

.cent-section h4 {
  margin: 0 0 10px;
  color: #3f587b;
  font-size: 13px;
}

.cent-list {
  display: grid;
  gap: 6px;
}

.cent-row {
  display: grid;
  grid-template-columns: 28px 1fr 120px 64px;
  align-items: center;
  gap: 8px;
}

.rank {
  color: #9aafcc;
  text-align: right;
  font-size: 12px;
}

.name {
  color: #2a3a5a;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
}

.bar-wrap {
  background: #e8f0fc;
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #3070d0;
}

.value {
  color: #5a70a0;
  text-align: right;
  font-size: 12px;
}

.community-wrap {
  padding: 14px;
}

.community-summary {
  margin: 0 0 12px;
  color: #5a7090;
}

.community-summary strong {
  color: #1a2540;
}

.community-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.community-card {
  border: 1px solid #e0eaf8;
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 12px;
  background: #f8fbff;
}

.community-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4d6485;
  margin-bottom: 8px;
}

.community-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.node-tag {
  background: #e8f0fc;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  color: #3a5080;
  max-width: 110px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.node-tag.more {
  color: #7a90b0;
}

@media (max-width: 900px) {
  .upload-row {
    align-items: stretch;
    flex-direction: column;
  }

  .upload-layout {
    width: 100%;
  }

  .cent-row {
    grid-template-columns: 28px 1fr 84px 60px;
  }
}
</style>
