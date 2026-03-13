<script setup>
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import PanelCard from "../../components/PanelCard.vue";
import { orderApi } from "../../services/api";

const keyword = ref("");
const statusFilter = ref("");
const orders = ref([]);
const loading = ref(false);
const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

function normalizeOrder(item) {
  const amount = Number(item.amount ?? 0);
  const type = amount >= 0 ? "承接任务" : "购买数据";
  const title = item.productName || (amount >= 0 ? "承接任务" : "购买数据");
  const statusText = item.status === 1 ? "已完成" : "处理中";
  return {
    id: item.id,
    orderNo: item.orderNo,
    buyerId: item.buyerId,
    amount,
    type,
    title,
    status: statusText,
    createdAt: item.createdAt || ""
  };
}

async function fetchOrders() {
  loading.value = true;
  try {
    const res = await orderApi.getAll();
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    const list = Array.isArray(res?.data) ? res.data : [];
    orders.value = list.map(normalizeOrder);
  } catch (e) {
    orders.value = [];
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

const filteredOrders = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  let result = orders.value;

  if (k) {
    result = result.filter(
      (item) =>
        String(item.orderNo || item.id).toLowerCase().includes(k) ||
        String(item.title).toLowerCase().includes(k) ||
        String(item.buyerId).toLowerCase().includes(k)
    );
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value);
  }

  return result;
});

const total = computed(() => filteredOrders.value.length);
const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredOrders.value.slice(start, start + pageSize.value);
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function statusClass(status) {
  if (status === "已完成") return "done";
  if (status === "处理中") return "pending";
  return "pending";
}

function amountText(amount) {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索订单号/内容/用户" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="default" style="width:140px;margin-left:12px">
        <el-option label="已完成" value="已完成" />
        <el-option label="处理中" value="处理中" />
      </el-select>
    </div>

    <table v-loading="loading">
      <thead>
        <tr>
          <th>订单号</th>
          <th>用户ID</th>
          <th>类型</th>
          <th>内容</th>
          <th>积分变动</th>
          <th>状态</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pagedOrders" :key="item.id">
          <td>{{ item.orderNo || item.id }}</td>
          <td>{{ item.buyerId }}</td>
          <td>{{ item.type }}</td>
          <td>{{ item.title }}</td>
          <td :class="item.amount >= 0 ? 'amount plus' : 'amount minus'">
            {{ amountText(item.amount) }}
          </td>
          <td>
            <span class="status-pill" :class="statusClass(item.status)">{{ item.status }}</span>
          </td>
          <td>{{ item.createdAt }}</td>
        </tr>
      </tbody>
    </table>

    <div class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </PanelCard>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}

.toolbar input {
  width: 320px;
  max-width: 100%;
  border: 1px solid #d5deeb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
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

.status-pill {
  display: inline-block;
  border: 1px solid #d6deeb;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
}

.status-pill.pending {
  color: #6f7c90;
  background: #f4f7fb;
}

.status-pill.done {
  color: #2a7a3f;
  background: #e8f8ee;
  border-color: #bde5c8;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.amount.plus {
  color: #2a7a3f;
}

.amount.minus {
  color: #a74141;
}
</style>
