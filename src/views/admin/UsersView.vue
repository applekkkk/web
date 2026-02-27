<script setup>
import PanelCard from "../../components/PanelCard.vue";

const users = [
  { id: 1001, name: "普通用户A", role: "user", status: "正常" },
  { id: 1002, name: "普通用户B", role: "user", status: "限制上传" },
  { id: 1, name: "平台管理员", role: "admin", status: "正常" }
];
</script>

<template>
  <PanelCard title="用户管理">
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
          <td>{{ item.status }}</td>
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
</style>
