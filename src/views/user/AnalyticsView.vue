<script setup>
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { runProcessTask } from "../../services/analyticsApi";

const auth = useAuthStore();
const running = ref(false);
const selectedFile = ref(null);
const reportText = ref("");
const requestResult = ref(null);

const form = reactive({
  instruction: ""
});

const userId = computed(() => auth.user?.id || auth.user?.userId || 0);

function onChooseFile(file) {
  selectedFile.value = file.raw;
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
    ElMessage.warning("未识别到用户信息，请重新登录");
    return;
  }

  running.value = true;
  reportText.value = "";
  try {
    const result = await runProcessTask({
      file: selectedFile.value,
      userId: userId.value,
      userPrompt: form.instruction.trim()
    });
    requestResult.value = result;

    if (typeof result === "string") {
      reportText.value = result;
    } else if (result?.report) {
      reportText.value = String(result.report);
    } else if (result?.messages) {
      reportText.value = JSON.stringify(result.messages, null, 2);
    } else {
      reportText.value = JSON.stringify(result, null, 2);
    }

    ElMessage.success("处理请求已提交");
  } catch (error) {
    ElMessage.error(error?.message || "处理失败");
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <section class="analytics-page">
    <article class="card">
      <h2>AI 数据处理</h2>
      <p class="sub">上传 CSV 后输入指令，调用本地 Agent 服务处理数据</p>

      <div class="form-row">
        <label>选择文件</label>
        <el-upload
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".csv,text/csv"
          :on-change="onChooseFile"
        >
          <el-button type="primary" plain>选择 CSV</el-button>
        </el-upload>
      </div>

      <div class="form-row">
        <label>处理指令</label>
        <el-input
          v-model="form.instruction"
          type="textarea"
          :rows="4"
          placeholder="例如：把 price 列按 7.24 换算成人民币，删除 user_id 为空的行，并生成 tier 字段"
        />
      </div>

      <div class="actions">
        <el-button type="primary" :loading="running" @click="handleRun">执行处理</el-button>
      </div>
    </article>

    <article class="card">
      <h3>处理结果</h3>
      <pre class="report">{{ reportText || "暂无结果" }}</pre>
    </article>

    <article v-if="requestResult" class="card">
      <h3>原始返回</h3>
      <pre class="report">{{ JSON.stringify(requestResult, null, 2) }}</pre>
    </article>
  </section>
</template>

<style scoped>
.analytics-page {
  display: grid;
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #d7e0ef;
  border-radius: 14px;
  padding: 20px;
}

h2,
h3 {
  margin: 0 0 10px;
  color: #163158;
}

.sub {
  margin: 0 0 16px;
  color: #5d7091;
}

.form-row {
  margin-bottom: 14px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #425a7d;
  font-weight: 600;
}

.actions {
  margin-top: 4px;
}

.report {
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f6f8fc;
  border: 1px solid #dbe5f3;
  border-radius: 10px;
  color: #1f3557;
  font-size: 13px;
  line-height: 1.6;
  max-height: 420px;
  overflow: auto;
}
</style>
