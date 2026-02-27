<script setup>
import PanelCard from "../../components/PanelCard.vue";
import { customNeeds } from "../../mock/data";
</script>

<template>
  <PanelCard title="数据定制服务（需求发布）">
    <table>
      <thead>
        <tr>
          <th>需求编号</th>
          <th>需求标题</th>
          <th>预算</th>
          <th>截止时间</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in customNeeds" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.title }}</td>
          <td>{{ item.budget }}</td>
          <td>{{ item.deadline }}</td>
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
