<script setup>
import PanelCard from "../../components/PanelCard.vue";

const files = [
  { id: 1, name: "社交网络关系图谱", format: "CSV", updatedAt: "2026-02-26 18:30" },
  { id: 2, name: "城市交通轨迹样本", format: "JSON", updatedAt: "2026-02-25 10:33" }
];
</script>

<template>
  <PanelCard title="个人仓库管理">
    <ul>
      <li v-for="item in files" :key="item.id">
        <strong>{{ item.name }}</strong> | {{ item.format }} | 更新于 {{ item.updatedAt }}
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
ul {
  margin: 0;
  padding-left: 16px;
}
li {
  margin-bottom: 10px;
  font-size: 14px;
}
</style>
