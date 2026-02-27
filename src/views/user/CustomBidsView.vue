<script setup>
import PanelCard from "../../components/PanelCard.vue";

const bids = [
  { id: 1, title: "短视频平台用户互动图", reward: 800, progress: "已承接-处理中" },
  { id: 2, title: "学术合作关系网络", reward: 1200, progress: "待交付" }
];
</script>

<template>
  <PanelCard title="数据定制承接">
    <ul>
      <li v-for="item in bids" :key="item.id">
        <strong>{{ item.title }}</strong> | 报酬 {{ item.reward }} 积分 | {{ item.progress }}
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
