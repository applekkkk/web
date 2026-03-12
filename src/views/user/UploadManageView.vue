<script setup>
import { computed, reactive, ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import PanelCard from "../../components/PanelCard.vue";
import { ElMessage } from "element-plus";
import request from "../../services/request";
import router from "@/router";

const categoryOptions = ["复杂网络", "文本", "时空"];
const sizeUnitOptions = ["MB", "GB"];
const auth = useAuthStore();

const form = reactive({
  name: "",
  info: "",
  category: categoryOptions[0],
  tags: "",
  price:null, 
  summaryText: ""
});

const selectedFile = ref(null);
const fileInputRef = ref(null);
const message = ref("");
const uploading = ref(false);
const today = new Date().toISOString().slice(0, 10);
const currentUserName = computed(() => auth.user?.name || "当前用户");
const currentUserId = computed(() => auth.user?.id || null);

function bytesToSizeLabel(bytes) {
  const b = Number(bytes ?? 0);
  if (!Number.isFinite(b) || b <= 0) return "0MB";
  const mb = b / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)}GB`;
  return `${mb.toFixed(2)}MB`;
}

function parseSummaryText(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const asciiIndex = line.indexOf(":");
      const cnIndex = line.indexOf("：");
      const splitIndex = asciiIndex >= 0 ? asciiIndex : cnIndex;
      if (splitIndex === -1) {
        return { key: line, value: "" };
      }
      return {
        key: line.slice(0, splitIndex).trim(),
        value: line.slice(splitIndex + 1).trim()
      };
    });
}

function validateSummaryText(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { ok: true, summary: [] };
  }
  for (const line of lines) {
    const asciiIndex = line.indexOf(":");
    const cnIndex = line.indexOf("：");
    const splitIndex = asciiIndex >= 0 ? asciiIndex : cnIndex;
    if (splitIndex <= 0) {
      return { ok: false, reason: "数据摘要格式错误，请使用“属性:描述”格式（可为空）" };
    }
    const key = line.slice(0, splitIndex).trim();
    const value = line.slice(splitIndex + 1).trim();
    if (!key || !value) {
      return { ok: false, reason: "数据摘要格式错误，请使用“属性:描述”格式（可为空）" };
    }
  }
  return { ok: true, summary: parseSummaryText(text) };
}

const generatedPayload = computed(() => {
  const summary = parseSummaryText(form.summaryText);

  return {
    name: form.name,
    info: form.info,
    category: form.category,
    tags: form.tags,
    price: Number(form.price),
    size: `${form.sizeValue}${form.sizeUnit}`,
    seller: "平台数据市场",
    author: currentUserName.value,
    uploadDate: today,
    purchased: false,
    likes: 0,
    liked: false,
    stars: 0,
    favorited: false,
    downloads: 0,
    shares: 0,
    summary,
    fileName: selectedFile.value?.name || ""
  };
});

function chooseFile() {
  fileInputRef.value?.click();
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    selectedFile.value = null;
    return;
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    selectedFile.value = null;
    if (event.target) event.target.value = "";
    message.value = "仅支持上传 .csv 格式文件。";
    return;
  }

  selectedFile.value = file;
  message.value = `已选择文件：${file.name}`;
}

async function submit() {
  if (!form.name || !form.info || !selectedFile.value) {
    message.value = "请至少填写名称、简介，并选择 .csv 文件后提交。";
    return;
  }

  const summaryCheck = validateSummaryText(form.summaryText);
  if (!summaryCheck.ok) {
    message.value = summaryCheck.reason;
    ElMessage.warning(summaryCheck.reason);
    return;
  }

  uploading.value = true;
  try {
    // 1) 先上传文件，后端随机生成文件名并返回
    const fd = new FormData();
    fd.append("file", selectedFile.value);

    const res = await request.post("/files/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (res?.code !== 200) {
      throw new Error(res?.message || "上传失败");
    }

    const savedName = res?.data?.savedName;
    if (!savedName) {
      throw new Error("上传成功但未返回保存文件名");
    }

    // 2) 再创建商品，把信息写入数据库（把 fileName 设置成后端随机名）
    const productPayload = {
      name: form.name,
      info: form.info,
      category: form.category,
      tags: form.tags,
      price: Number(form.price),
      sizeLabel: bytesToSizeLabel(selectedFile.value?.size),
      seller: "平台数据市场",
      authorId: currentUserId.value,
      authorName: currentUserName.value,
      fileName: savedName,
      // summary 列是 JSON 类型；后端字段是 String，传递 JSON 文本，空时传 "[]"
      summary: JSON.stringify(summaryCheck.summary ?? []),
      uploadDate: today
    };

    const createRes = await request.post("/products", productPayload);
    if (createRes?.code !== 200) {
      throw new Error(createRes?.message || "创建商品失败");
    }

    message.value = `数据集《${form.name}》提交成功，等待管理员审核。`;
    ElMessage.success("提交成功");
  } catch (e) {
    ElMessage.error(e?.message || "上传失败");
  } finally {
    uploading.value = false;
    
  }
}
</script>

<template>
  <PanelCard title="数据上传">
    <div class="form-grid">
      <label>
        数据名称
        <input v-model.trim="form.name" placeholder="例如：幼儿园接触时序网络" />
      </label>

      <label>
        数据分类
        <select v-model="form.category">
          <option v-for="option in categoryOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>

      <label class="full">
        数据简介
        <textarea
          v-model.trim="form.info"
          rows="3"
          placeholder="简要描述数据内容、研究背景和应用场景"
        />
      </label>

      <label>
        标签（逗号分隔）
        <input v-model.trim="form.tags" placeholder="时序网络,接触网络" />
      </label>

      <label>
        价格（积分）
        <input v-model.number="form.price" type="number" min="1" />
      </label>

      <label class="full">
        数据摘要（每行一条，格式：属性:描述）
        <textarea
          v-model.trim="form.summaryText"
          rows="5"
          placeholder="sex:成员性别，F表示女性，M表示男性&#10;time:接触事件发生时间（秒）"
        />
      </label>

      <div class="full upload-box">
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden-file"
          @change="onFileChange"
        />
        <button type="button" class="btn ghost" @click="chooseFile">选择文件</button>
        <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择 .csv 文件" }}</span>
      </div>

      <div class="full">
        <button type="button" class="btn submit" :disabled="uploading" @click="submit">
          {{ uploading ? "上传中..." : "提交" }}
        </button>
      </div>
    </div>

    <p v-if="message" class="message">{{ message }}</p>

  </PanelCard>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.full {
  grid-column: 1 / -1;
}

label {
  display: block;
  color: #2f4868;
  font-size: 13px;
}

input,
select,
textarea {
  display: block;
  width: 100%;
  margin-top: 4px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
}

.inline-row {
  display: grid;
  gap: 8px;
  grid-template-columns: 2fr 1fr;
  margin-top: 4px;
}

.upload-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.hidden-file {
  display: none;
}

.file-name {
  color: #5f728f;
  font-size: 12px;
}

.readonly-text {
  margin: 0;
  color: #5b6f8c;
  font-size: 13px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  background: #2b5b91;
  cursor: pointer;
}

.btn.ghost {
  border: 1px solid #c7d7ef;
  color: #2f4e74;
  background: #fff;
}

.btn.submit {
  min-width: 120px;
}

.message {
  margin-top: 10px;
  color: #205a96;
}

.payload-preview {
  margin-top: 12px;
}

.payload-preview pre {
  border: 1px solid #e3eaf7;
  border-radius: 8px;
  padding: 10px;
  background: #f8fbff;
  white-space: pre-wrap;
  font-size: 12px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

