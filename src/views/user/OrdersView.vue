<script setup>
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import PanelCard from "../../components/PanelCard.vue";
import { orderApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const loading = ref(false);
const orders = ref([]);

function normalizeOrder(item) {
  const amount = Number(item.amount ?? 0);
  const type = amount >= 0 ? "承接任务" : "购买数据";
  const title = item.productName || (amount >= 0 ? "承接任务" : "购买数据");
  return {
    id: item.id,
    orderNo: item.orderNo,
    amount,
    type,
    title,
    createdAt: item.createdAt || ""
  };
}

const displayOrders = computed(() => orders.value.map(normalizeOrder));

function amountText(amount) {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

async function fetchOrders() {
  if (!auth.user?.id) return;
  loading.value = true;
  try {
    const res = await orderApi.getUserList(auth.user.id);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    orders.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    orders.value = [];
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <PanelCard title="我的订单">
    <section class="table-card" v-loading="loading">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>类型</th>
            <th>内容</th>
            <th>积分变动</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in displayOrders" :key="item.id">
            <td>{{ item.orderNo || item.id }}</td>
            <td>{{ item.type }}</td>
            <td>{{ item.title }}</td>
            <td :class="item.amount >= 0 ? 'amount plus' : 'amount minus'">
              {{ amountText(item.amount) }}
            </td>
            <td>{{ item.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </PanelCard>
</template>

<style scoped>
.table-card {
  border: 1px solid #e4ebf6;
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(16, 24, 40, 0.05);
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

.amount.plus {
  color: #2a7a3f;
}

.amount.minus {
  color: #a74141;
}
</style>
