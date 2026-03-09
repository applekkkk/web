<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { useNeedsStore } from "../../stores/needs";

const auth = useAuthStore();
const needsStore = useNeedsStore();

const categoryOptions = ["图数据", "文本", "时空", "其他"];

const form = reactive({
  title: "",
  description: "",
  category: "图数据",
  amount: "",
  contact: "",
  budget: 300,
  deadline: ""
});

const selectedFile = ref(null);
const fileInputRef = ref(null);

function chooseFile() {
  fileInputRef.value?.click();
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  selectedFile.value = file || null;
}

function submit() {
  if (!form.title.trim() || !form.description.trim() || !form.amount || !form.contact.trim() || !form.deadline || !form.budget) {
    ElMessage.warning("请填写完整任务信息");
    return;
  }

  needsStore.publishNeed({
    ...form,
    publisher: auth.user?.name || "当前用户",
    publisherId: auth.user?.id ?? null,
    publisherContact: form.contact,
    attachmentName: selectedFile.value?.name || ""
  });

  form.title = "";
  form.description = "";
  form.category = "图数据";
  form.amount = "";
  form.contact = "";
  form.budget = 300;
  form.deadline = "";
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";

  ElMessage.success("任务发布成功");
}
</script>

<template>
  <section class="request-page">
    <section class="form-card">

      <div class="form-grid">
        <label>
          数据标题
          <input v-model.trim="form.title" placeholder="例如：社交媒体传播关系图构建" />
        </label>

        <label>
          数据类别
          <select v-model="form.category">
            <option v-for="item in categoryOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="full">
          任务描述
          <textarea v-model.trim="form.description" rows="4" placeholder="描述需要的数据的字段格式，数据内容等"></textarea>
        </label>

        <label>
          数据量
          <input v-model.trim="form.amount" placeholder="输入需要的数据条数" type="number"/>
        </label>

        <label>
          联系方式
          <input v-model.trim="form.contact" placeholder="例如：手机号/邮箱/微信号" />
        </label>

        <label>
          预算（积分）
          <input v-model.number="form.budget" type="number" min="1" />
        </label>

        <label class="full">
          截止日期
            <el-date-picker
            v-model="form.deadline"
            type="date"
            placeholder="Pick a day"
            :size="size"
          />
        </label>

        <div class="full upload-box">
          <label class="sample-tip">示例数据文件（csv文件，可选）</label>
          <input ref="fileInputRef" type="file" class="hidden-file" @change="onFileChange" />
          <button type="button" class="btn ghost" @click="chooseFile">选择附件</button>
          <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择附件" }}</span>
        </div>

        <div class="full">
          <button type="button" class="btn" @click="submit">发布任务</button>
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

h2 {
  margin: 0 0 10px;
  color: #1f2a37;
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
select,
textarea {
  width: 100%;
  margin-top: 4px;
  border: 1px solid #d2ddef;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
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
