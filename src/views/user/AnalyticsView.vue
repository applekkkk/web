<script setup>
import PanelCard from "../../components/PanelCard.vue";
</script>

<template>
  <PanelCard title="数据分析与展示">
    <p>该页面预留算法接口结果展示区域。当前阶段展示前端占位与接入规范。</p>
    <ul>
      <li>输入：数据集 ID、分析任务类型、参数配置</li>
      <li>输出：统计指标、图结构摘要、可视化图表数据</li>
      <li>状态：排队中 / 运行中 / 完成 / 失败</li>
    </ul>
  </PanelCard>
</template>

<style scoped>
ul {
  margin: 8px 0 0;
  padding-left: 18px;
}
li {
  margin-bottom: 8px;
}
</style>
