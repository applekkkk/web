<script setup>
import PanelCard from "../../components/PanelCard.vue";
import { pendingReviews } from "../../mock/data";

function statusClass(status) {
  if (status === "待审核") return "pending";
  if (status === "通过") return "done";
  if (status === "驳回") return "rejected";
  return "pending";
}
</script>

<template>
  <PanelCard>
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

.status-pill.rejected {
  color: #a74141;
  background: #fdeeee;
  border-color: #f1c5c5;
}
</style>
