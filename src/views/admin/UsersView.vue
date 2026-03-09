<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PanelCard from "../../components/PanelCard.vue";
import { adminUsers } from "../../mock/data";

const router = useRouter();
const keyword = ref("");
const users = ref(adminUsers.map((item) => ({ ...item })));

const filteredUsers = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return users.value;
  return users.value.filter(
    (item) =>
      String(item.id).toLowerCase().includes(k) ||
      String(item.name).toLowerCase().includes(k) ||
      String(item.role).toLowerCase().includes(k)
  );
});

function statusClass(status) {
  if (status === "正常") return "done";
  if (status === "限制上传") return "warning";
  if (status === "封禁") return "rejected";
  return "pending";
}

function openUserDetail(item) {
  const url = router.resolve({ name: "admin-user-detail", params: { id: item.id } }).href;
  window.open(url, "_blank");
}
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索用户ID/用户名/角色" />
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>角色</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredUsers" :key="item.id" class="click-row" @click="openUserDetail(item)">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.role }}</td>
          
          <td>
            <span class="status-pill" :class="statusClass(item.status)">{{ item.status }}</span>
          </td>
        </tr>
        
      </tbody>
    </table>
  </PanelCard>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}

.toolbar input {
  width: 320px;
  max-width: 100%;
  border: 1px solid #d5deeb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e5ecf7;
  padding: 10px 8px;
  text-align: left;
  font-size: 13px;
}

.status-pill {
  display: inline-block;
  border: 1px solid #d6deeb;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
}

.status-pill.pending {
  color: #6f7c90;
  background: #f4f7fb;
}

.status-pill.done {
  color: #2a7a3f;
  background: #e8f8ee;
  border-color: #bde5c8;
}

.status-pill.warning {
  color: #946124;
  background: #fff6e7;
  border-color: #ead3ae;
}

.status-pill.rejected {
  color: #a74141;
  background: #fdeeee;
  border-color: #f1c5c5;
}

.click-row {
  cursor: pointer;
}

.click-row:hover {
  background: #f8fbff;
}
</style>
