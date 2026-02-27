<script setup>
import PanelCard from "../../components/PanelCard.vue";

const stats = [
  { label: "待审核数据", value: 12 },
  { label: "今日交易数", value: 36 },
  { label: "活跃用户", value: 218 },
  { label: "异常订单", value: 2 }
];
</script>

<template>
  <div class="grid">
    <PanelCard v-for="item in stats" :key="item.label" :title="item.label">
      <div class="value">{{ item.value }}</div>
    </PanelCard>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.value {
  font-size: 28px;
  color: #1f4a80;
  font-weight: 700;
}
</style>
