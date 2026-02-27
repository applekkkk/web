<script setup>
import { computed, ref } from "vue";
import PanelCard from "../../components/PanelCard.vue";
import { marketData } from "../../mock/data";

const keyword = ref("");
const rows = computed(() =>
  marketData.filter((item) => item.name.includes(keyword.value) || item.category.includes(keyword.value))
);
</script>

<template>
  <PanelCard title="数据分类展示与搜索">
    <input v-model="keyword" class="search" placeholder="按名称或分类搜索" />
    <table>
      <thead>
        <tr>
          <th>数据名称</th>
          <th>分类</th>
          <th>标签</th>
          <th>价格(积分)</th>
          <th>规模</th>
          <th>提供方</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in rows" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.category }}</td>
          <td>{{ item.tags }}</td>
          <td>{{ item.price }}</td>
          <td>{{ item.size }}</td>
          <td>{{ item.seller }}</td>
        </tr>
      </tbody>
    </table>
  </PanelCard>
</template>

<style scoped>
.search {
  width: 280px;
  margin-bottom: 12px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 8px 10px;
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
</style>
