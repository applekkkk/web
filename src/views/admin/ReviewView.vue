<script setup>
import PanelCard from "../../components/PanelCard.vue";
import { pendingReviews } from "../../mock/data";
</script>

<template>
  <PanelCard title="数据审核模块">
    <table>
      <thead>
        <tr>
          <th>审核单号</th>
          <th>数据集</th>
          <th>上传用户</th>
          <th>提交时间</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pendingReviews" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dataset }}</td>
          <td>{{ item.owner }}</td>
          <td>{{ item.submittedAt }}</td>
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
