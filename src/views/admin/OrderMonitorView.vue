<script setup>
import { computed, ref } from "vue";
import PanelCard from "../../components/PanelCard.vue";
import { orderList } from "../../mock/data";

const keyword = ref("");
const statusFilter = ref("");
const orders = ref(orderList.map((item) => ({ ...item })));
const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const filteredOrders = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  let result = orders.value;

  if (k) {
    result = result.filter(
      (item) =>
        String(item.id).toLowerCase().includes(k) ||
        String(item.dataset).toLowerCase().includes(k)
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
  if (status === "已支付") return "done";
  if (status === "处理中") return "pending";
  if (status === "已取消") return "rejected";
  return "pending";
}
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索订单号/数据集" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="default" style="width:140px;margin-left:12px">
        <el-option label="已支付" value="已支付" />
        <el-option label="处理中" value="处理中" />
        <el-option label="已取消" value="已取消" />
      </el-select>
    </div>

    <table>
      <thead>
        <tr>
          <th>订单号</th>
          <th>数据集</th>
          <th>金额</th>
          <th>状态</th>
          <th>创建时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pagedOrders" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.dataset }}</td>
          <td>{{ item.amount }}</td>
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

.status-pill.rejected {
  color: #a74141;
  background: #fdeeee;
  border-color: #f1c5c5;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
