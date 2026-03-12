<script setup>
import { computed, ref } from "vue";
import PanelCard from "../../components/PanelCard.vue";
import { adminUsers } from "../../mock/data";

const keyword = ref("");
const statusFilter = ref("");
const users = ref(adminUsers.map((item) => ({ ...item })));
const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const filteredUsers = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  let result = users.value;

  if (k) {
    result = result.filter(
      (item) =>
        String(item.id).toLowerCase().includes(k) ||
        String(item.name).toLowerCase().includes(k) ||
        String(item.role).toLowerCase().includes(k)
    );
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value);
  }

  return result;
});

const total = computed(() => filteredUsers.value.length);
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function statusClass(status) {
  if (status === "正常") return "done";
  if (status === "限制上传") return "warning";
  if (status === "封禁") return "rejected";
  return "pending";
}

function changeStatus(item) {
  // 这里将来可以调用接口
  console.log("修改状态", item.id, item.status);
}
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索用户ID/用户名/角色" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="default" style="width:140px;margin-left:12px">
        <el-option label="正常" value="正常" />
        <el-option label="限制上传" value="限制上传" />
        <el-option label="封禁" value="封禁" />
      </el-select>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>角色</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
  <tr v-for="item in pagedUsers" :key="item.id">
    <td>{{ item.id }}</td>
    <td>{{ item.name }}</td>
    <td>{{ item.role }}</td>

    <td>
      <span class="status-pill" :class="statusClass(item.status)">
        {{ item.status }}
      </span>
    </td>

    <td>
      <el-select
        v-model="item.status"
        size="small"
        style="width:120px"
        @change="changeStatus(item)"
      >
        <el-option label="正常" value="正常" />
        <el-option label="限制上传" value="限制上传" />
        <el-option label="封禁" value="封禁" />
      </el-select>
    </td>
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

.actions button {
  margin-right: 6px;
  border: 1px solid #d5deeb;
  background: white;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}

.actions button:hover {
  background: #f5f8ff;
}

.actions .danger {
  color: #c0392b;
  border-color: #e5bcbc;
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

.status-pill.warning {
  color: #946124;
  background: #fff6e7;
  border-color: #ead3ae;
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
