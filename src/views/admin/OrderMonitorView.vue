<script setup>
import PanelCard from "../../components/PanelCard.vue";
import { orderList } from "../../mock/data";

function statusClass(status) {
  if (status === "已支付") return "done";
  if (status === "处理中") return "pending";
  if (status === "已取消") return "rejected";
  return "pending";
}
</script>

<template>
  <PanelCard>
    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>数据集</th>
          <th>金额</th>
          <th>状态</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in orderList" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dataset }}</td>
          <td>{{ item.amount }}</td>
          <td>
            <span class="status-pill" :class="statusClass(item.status)">{{ item.status }}</span>
          </td>
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

.status-pill.rejected {
  color: #a74141;
  background: #fdeeee;
  border-color: #f1c5c5;
}
</style>
