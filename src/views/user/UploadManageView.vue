<script setup>
import { computed, reactive, ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import PanelCard from "../../components/PanelCard.vue";

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
const today = new Date().toISOString().slice(0, 10);
const currentUserName = computed(() => auth.user?.name || "当前用户");

const generatedPayload = computed(() => {
  const summary = form.summaryText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const splitIndex = line.indexOf(":");
      if (splitIndex === -1) {
        return { key: line, value: "" };
      }
      return {
        key: line.slice(0, splitIndex).trim(),
        value: line.slice(splitIndex + 1).trim()
      };
    });

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

function submit() {
  if (!form.name || !form.info || !selectedFile.value) {
    message.value = "请至少填写名称、简介，并选择 .csv 文件后提交。";
    return;
  }

  message.value = `数据集《${form.name}》提交并上传成功，等待管理员审核。`;
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
        <button type="button" class="btn submit" @click="submit">提交</button>
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
