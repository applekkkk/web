<script setup>
import PanelCard from "../../components/PanelCard.vue";

const stats = [
  { label: "在售数据集", value: 32 },
  { label: "本月成交订单", value: 18 },
  { label: "可用积分", value: 1800 },
  { label: "待处理任务", value: 6 }
];
</script>

<template>
  <div class="grid">
    <PanelCard v-for="item in stats" :key="item.label" :title="item.label">
      <div class="value">{{ item.value }}</div>
    </PanelCard>
    <PanelCard title="项目进度">
      <p>当前已完成：登录鉴权、角色路由、市场浏览、上传管理、订单与积分模块骨架。</p>
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
