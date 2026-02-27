<script setup>
import PanelCard from "../../components/PanelCard.vue";
import { orderList } from "../../mock/data";
</script>

<template>
  <PanelCard title="数据交易与订单">
    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>数据集</th>
          <th>金额</th>
          <th>状态</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in orderList" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dataset }}</td>
          <td>{{ item.amount }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.createdAt }}</td>
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
