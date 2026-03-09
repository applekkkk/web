<script setup>
import PanelCard from "../../components/PanelCard.vue";

const users = [
  { id: 1001, name: "普通用户A", role: "user", status: "正常" },
  { id: 1002, name: "普通用户B", role: "user", status: "限制上传" },
  { id: 1, name: "平台管理员", role: "admin", status: "正常" }
];

function statusClass(status) {
  if (status === "正常") return "done";
  if (status === "限制上传") return "warning";
  if (status === "封禁") return "rejected";
  return "pending";
}
</script>

<template>
  <PanelCard>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>角色</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in users" :key="item.id">
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
</style>
