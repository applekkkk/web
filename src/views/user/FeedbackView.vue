<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { messageApi } from "../../services/api";

const auth = useAuthStore();
const content = ref("");
const loading = ref(false);
const list = ref([]);

function formatTime(value) {
  return String(value || "").replace("T", " ");
}

async function fetchMessages() {
  if (!auth.user?.id) return;
  loading.value = true;
  try {
    const res = await messageApi.getUserList(auth.user.id);
    if (res?.code !== 200) throw new Error(res?.message || "加载失败");
    const rows = Array.isArray(res?.data) ? res.data : [];
    list.value = rows.map((item) => ({
      ...item,
      createdAt: formatTime(item.createdAt)
    }));
  } catch (error) {
    ElMessage.error(error?.message || "加载失败");
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function submitMessage() {
  if (!auth.user?.id) return;
  if (!content.value.trim()) {
    ElMessage.warning("请先输入留言内容");
    return;
  }
  try {
    const res = await messageApi.create(auth.user.id, content.value.trim());
    if (res?.code !== 200) throw new Error(res?.message || "留言失败");
    content.value = "";
    ElMessage.success("留言成功");
    fetchMessages();
  } catch (error) {
    ElMessage.error(error?.message || "留言失败");
  }
}

onMounted(fetchMessages);
</script>

<template>
  <section class="feedback-page">
    <section class="card">
      <h2>给管理员留言</h2>
      <textarea v-model="content" rows="4" placeholder="请输入你要反馈的问题"></textarea>
      <button type="button" class="btn" @click="submitMessage">提交留言</button>
    </section>

    <section class="card" v-loading="loading">
      <h2>我的留言记录</h2>
      <p v-if="list.length === 0" class="empty">暂无留言记录</p>
      <div v-for="item in list" :key="item.id" class="msg-item">
        <p>{{ item.content }}</p>
        <small>{{ item.createdAt }}</small>
      </div>
    </section>
  </section>
</template>

<style scoped>
.feedback-page { display: grid; gap: 12px; }
.card { border: 1px solid #e4eaf5; border-radius: 14px; padding: 14px; background: #fff; }
h2 { margin: 0 0 10px; color: #2c3b52; font-size: 18px; }
textarea { width: 100%; border: 1px solid #d2ddef; border-radius: 8px; padding: 10px; }
.btn { margin-top: 10px; border: none; border-radius: 8px; padding: 8px 12px; color: #fff; background: #2f5a90; cursor: pointer; }
.msg-item { border-top: 1px solid #edf1f6; padding: 10px 0; }
.msg-item p { margin: 0; color: #3c4f69; }
.msg-item small { color: #7a8ca6; }
.empty { color: #7a8ca6; margin: 0; }
</style>
