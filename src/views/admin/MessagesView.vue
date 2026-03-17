<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { messageApi } from "../../services/api";

const loading = ref(false);
const list = ref([]);

function formatTime(value) {
  return String(value || "").replace("T", " ");
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await messageApi.getAll();
    if (res?.code !== 200) throw new Error(res?.message || "加载失败");
    const rows = Array.isArray(res?.data) ? res.data : [];
    list.value = rows.map((item) => ({
      ...item,
      createdAt: formatTime(item.createdAt)
    }));
  } catch (error) {
    list.value = [];
    ElMessage.error(error?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <section class="messages-page card" v-loading="loading">
    <h2>用户留言</h2>
    <p v-if="list.length === 0" class="empty">暂无留言</p>
    <table v-else>
      <thead>
        <tr>
          <th>用户ID</th>
          <th>用户名</th>
          <th>留言内容</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.userId }}</td>
          <td>{{ item.userName }}</td>
          <td>{{ item.content }}</td>
          <td>{{ item.createdAt }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.card { border: 1px solid #e4eaf5; border-radius: 14px; padding: 14px; background: #fff; }
h2 { margin: 0 0 12px; color: #2c3b52; font-size: 18px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5ecf7; padding: 10px 8px; text-align: left; font-size: 13px; }
.empty { margin: 0; color: #7a8ca6; }
</style>
