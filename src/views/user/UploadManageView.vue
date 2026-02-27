<script setup>
import { reactive, ref } from "vue";
import PanelCard from "../../components/PanelCard.vue";

const form = reactive({
  name: "",
  category: "",
  tags: "",
  price: 100
});
const message = ref("");

function submit() {
  if (!form.name || !form.category) {
    message.value = "请填写数据名称与分类";
    return;
  }
  message.value = `数据集「${form.name}」已提交，等待管理员审核。`;
}
</script>

<template>
  <PanelCard title="数据上传与管理">
    <div class="form">
      <label>数据名称 <input v-model.trim="form.name" /></label>
      <label>分类 <input v-model.trim="form.category" /></label>
      <label>标签 <input v-model.trim="form.tags" placeholder="逗号分隔" /></label>
      <label>价格(积分) <input v-model.number="form.price" type="number" min="1" /></label>
      <button @click="submit">提交审核</button>
    </div>
    <p class="message">{{ message }}</p>
  </PanelCard>
</template>

<style scoped>
.form {
  display: grid;
  gap: 10px;
  max-width: 520px;
}

label {
  font-size: 13px;
}

input {
  display: block;
  width: 100%;
  margin-top: 4px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 8px 10px;
}

button {
  width: 120px;
  border: none;
  border-radius: 8px;
  padding: 9px 10px;
  color: #fff;
  background: #2b5b91;
  cursor: pointer;
}

.message {
  margin-top: 10px;
  color: #205a96;
}
</style>
