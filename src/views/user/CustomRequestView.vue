<script setup>
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { customRequestApi } from "../../services/api";
import request from "../../services/request";

const auth = useAuthStore();
const GRAPH_CATEGORY = "网络数据（图数据）";
const NORMAL_CATEGORY = "普通数据";
const categoryOptions = [GRAPH_CATEGORY, NORMAL_CATEGORY];
const maxBudget = computed(() => Number(auth.user?.points ?? 0));
const fileAccept = computed(() =>
  form.category === GRAPH_CATEGORY ? ".net,application/octet-stream,text/plain" : ".csv,text/csv"
);
const expectedFileSuffix = computed(() => (form.category === GRAPH_CATEGORY ? ".net" : ".csv"));
const INPUT_LIMITS = {
  title: 60,
  description: 400,
  contact: 80
};

const form = reactive({
  title: "",
  description: "",
  category: GRAPH_CATEGORY,
  amount: "",
  contact: "",
  budget: null
});

const selectedFile = ref(null);
const fileInputRef = ref(null);
const submitting = ref(false);

function chooseFile() {
  fileInputRef.value?.click();
}

function isFileMatchCategory(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (form.category === GRAPH_CATEGORY) return lower.endsWith(".net");
  return lower.endsWith(".csv");
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    selectedFile.value = null;
    return;
  }
  if (!isFileMatchCategory(file.name)) {
    selectedFile.value = null;
    if (event.target) event.target.value = "";
    ElMessage.warning(`当前分类仅支持上传 ${expectedFileSuffix.value} 文件`);
    return;
  }
  selectedFile.value = file;
}

watch(
  () => form.category,
  () => {
    if (selectedFile.value && !isFileMatchCategory(selectedFile.value.name)) {
      selectedFile.value = null;
      if (fileInputRef.value) fileInputRef.value.value = "";
      ElMessage.info(`分类已切换，请重新选择 ${expectedFileSuffix.value} 文件`);
    }
  }
);

async function uploadAttachment(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await request.post("/files/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  if (res?.code !== 200) {
    throw new Error(res?.message || "附件上传失败");
  }
  return res?.data?.savedName || "";
}

async function submit() {
  if (Number(auth.user?.emailVerified ?? 0) !== 1 || !auth.user?.email) {
    ElMessage.warning("请先在个人资料完成邮箱验证后再发布任务");
    return;
  }
  if (!form.title.trim() || !form.description.trim() || !form.amount || !form.contact.trim()) {
    ElMessage.warning("请填写完整任务信息");
    return;
  }
  const budget = Number(form.budget);
  if (!Number.isFinite(budget) || budget <= 0) {
    ElMessage.warning("请填写有效的积分预算");
    return;
  }
  if (budget > maxBudget.value) {
    ElMessage.warning(`积分预算不能超过当前积分（${maxBudget.value}）`);
    return;
  }
  submitting.value = true;
  try {
    let attachmentName = "";
    if (selectedFile.value) {
      attachmentName = await uploadAttachment(selectedFile.value);
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: "",
      amount: String(form.amount),
      budget,
      publisherId: auth.user?.id ?? null,
      publisherName: auth.user?.name || "当前用户",
      publisherContact: form.contact.trim(),
      attachmentName
    };

    const res = await customRequestApi.create(payload);
    if (res?.code !== 200) {
      throw new Error(res?.message || "发布失败");
    }

    form.title = "";
    form.description = "";
    form.category = GRAPH_CATEGORY;
    form.amount = "";
    form.contact = "";
    form.budget = null;
    selectedFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = "";

    ElMessage.success("任务发布成功");
  } catch (e) {
    ElMessage.error(e?.message || "发布失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="request-page">
    <section class="form-card">
      <div class="form-grid">
        <label>
          数据标题
          <input
            v-model.trim="form.title"
            :maxlength="INPUT_LIMITS.title"
            placeholder="例如：社交媒体传播关系图构建"
          />
        </label>

        <label>
          数据类别
          <el-select v-model="form.category">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </label>

        <label class="full">
          任务描述
          <textarea
            v-model.trim="form.description"
            :maxlength="INPUT_LIMITS.description"
            rows="4"
            placeholder="描述需要的数据字段和内容要求"
          ></textarea>
        </label>

        <label>
          数据量
          <input v-model.trim="form.amount" placeholder="输入需要的数据条数" type="number" />
        </label>

        <label>
          联系方式
          <input
            v-model.trim="form.contact"
            :maxlength="INPUT_LIMITS.contact"
            placeholder="例如：手机号/邮箱/微信号"
          />
        </label>

        <label>
          预算（积分）
          <input v-model.number="form.budget" type="number" min="1" :max="maxBudget" placeholder="请输入积分预算" />
          <small class="budget-tip">当前可用积分：{{ maxBudget }}</small>
        </label>

        <div class="full upload-box">
          <label class="sample-tip">示例数据文件（{{ expectedFileSuffix }}，可选）</label>
          <input ref="fileInputRef" type="file" :accept="fileAccept" class="hidden-file" @change="onFileChange" />
          <button type="button" class="btn ghost" @click="chooseFile">选择附件</button>
          <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择附件" }}</span>
        </div>

        <div class="full">
          <button type="button" class="btn" :disabled="submitting" @click="submit">
            {{ submitting ? "发布中..." : "发布任务" }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.request-page {
  display: grid;
  gap: 14px;
}

.form-card {
  border: 1px solid #e4eaf5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

:deep(.el-select) {
  width: 100%;
  margin-top: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.full {
  grid-column: 1 / -1;
}

label {
  display: block;
  color: #415572;
  font-size: 13px;
}

input,
textarea {
  width: 100%;
  margin-top: 4px;
  border: 1px solid #d2ddef;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
}

.budget-tip {
  display: block;
  margin-top: 4px;
  color: #7a8ca6;
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
  color: #637894;
  font-size: 12px;
}

.sample-tip {
  width: 100%;
  color: #7a8ca6;
  font-size: 12px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  background: #2f5a90;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn.ghost {
  border: 1px solid #c7d7ef;
  color: #2f4e74;
  background: #fff;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
