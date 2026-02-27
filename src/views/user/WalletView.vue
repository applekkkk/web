<script setup>
import PanelCard from "../../components/PanelCard.vue";

const records = [
  { id: 1, type: "签到奖励", amount: +20, time: "2026-02-27 08:20" },
  { id: 2, type: "购买 社交网络关系图谱", amount: -320, time: "2026-02-26 18:20" },
  { id: 3, type: "出售 评论语义数据", amount: +260, time: "2026-02-26 12:03" }
];
</script>

<template>
  <PanelCard title="支付与结算（积分）">
    <h2>当前积分：1800</h2>
    <table>
      <thead>
        <tr>
          <th>类型</th>
          <th>变动</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in records" :key="item.id">
          <td>{{ item.type }}</td>
          <td :class="{ plus: item.amount > 0, minus: item.amount < 0 }">{{ item.amount }}</td>
          <td>{{ item.time }}</td>
        </tr>
      </tbody>
    </table>
  </PanelCard>
</template>

<style scoped>
h2 {
  margin: 0 0 12px;
  font-size: 22px;
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
.plus {
  color: #0a7d44;
}
.minus {
  color: #b62d2d;
}
</style>
