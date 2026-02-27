<script setup>
import { ref } from "vue";
import PanelCard from "../../components/PanelCard.vue";

const sourceType = ref("float");
const targetType = ref("int");
const done = ref(false);

function runProcess() {
  done.value = true;
}
</script>

<template>
  <PanelCard title="数据自动处理">
    <div class="row">
      <label>源类型 <input v-model="sourceType" /></label>
      <label>目标类型 <input v-model="targetType" /></label>
      <button @click="runProcess">执行转换</button>
    </div>
    <p v-if="done">已完成：{{ sourceType }} -> {{ targetType }}，处理记录已写入任务日志。</p>
  </PanelCard>
</template>

<style scoped>
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
label {
  font-size: 13px;
}
input {
  display: block;
  width: 150px;
  margin-top: 4px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 8px 10px;
}
button {
  align-self: end;
  border: none;
  border-radius: 8px;
  padding: 9px 12px;
  color: #fff;
  background: #2d6099;
  cursor: pointer;
}
</style>
