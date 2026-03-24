<script setup>
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import PanelCard from "../../components/PanelCard.vue";
import { userApi } from "../../services/api";

const keyword = ref("");
const statusFilter = ref("");
const users = ref([]);
const loading = ref(false);

const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const statusOptions = [
  { label: "正常", value: 0 },
  { label: "限制接单", value: 1 },
  { label: "封禁", value: 2 }
];

function statusLabel(status) {
  const found = statusOptions.find((item) => item.value === Number(status));
  return found ? found.label : "未知";
}

function normalize(item) {
  return {
    ...item,
    roleLabel: Number(item.role) === 1 ? "管理员" : "用户",
    status: Number(item.status ?? 0)
  };
}

const filteredUsers = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  return users.value.filter((item) => {
    const hitKeyword =
      !k ||
      String(item.id).toLowerCase().includes(k) ||
      String(item.name || "").toLowerCase().includes(k) ||
      String(item.username || "").toLowerCase().includes(k);
    const hitStatus = statusFilter.value === "" || Number(item.status) === Number(statusFilter.value);
    return hitKeyword && hitStatus;
  });
});

const total = computed(() => filteredUsers.value.length);
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await userApi.getAll();
    if (res?.code !== 200) throw new Error(res?.message || "加载失败");
    users.value = (Array.isArray(res?.data) ? res.data : [])
      .map(normalize)
      .filter((item) => Number(item.role) !== 1 && String(item.role || "").toLowerCase() !== "admin");
  } catch (error) {
    users.value = [];
    ElMessage.error(error?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

async function changeStatus(item, nextStatus) {
  try {
    const res = await userApi.updateProfile(item.id, { status: Number(nextStatus) });
    if (res?.code !== 200) throw new Error(res?.message || "更新失败");
    item.status = Number(nextStatus);
    ElMessage.success("用户状态已更新");
  } catch (error) {
    ElMessage.error(error?.message || "更新失败");
    fetchUsers();
  }
}

function statusClass(status) {
  if (Number(status) === 0) return "done";
  if (Number(status) === 1) return "warning";
  if (Number(status) === 2) return "rejected";
  return "pending";
}

onMounted(fetchUsers);
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索用户ID/用户名" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="default" style="width:140px;margin-left:12px">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <table v-loading="loading">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>角色</th>
          <th>邮箱</th>
          <th>邮箱验证</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pagedUsers" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.roleLabel }}</td>
          <td>{{ item.email || "-" }}</td>
          <td>{{ Number(item.emailVerified) === 1 ? "已验证" : "未验证" }}</td>
          <td><span class="status-pill" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
          <td>
            <el-select
              :model-value="item.status"
              size="small"
              style="width:120px"
              @update:model-value="(value) => changeStatus(item, value)"
            >
              <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
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
      />
    </div>
  </PanelCard>
</template>

<style scoped>
.toolbar { margin-bottom: 12px; }
.toolbar input { width: 320px; max-width: 100%; border: 1px solid #d5deeb; border-radius: 8px; padding: 8px 10px; font-size: 13px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5ecf7; padding: 10px 8px; text-align: left; font-size: 13px; }
.status-pill { display: inline-block; border: 1px solid #d6deeb; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
.status-pill.pending { color: #6f7c90; background: #f4f7fb; }
.status-pill.done { color: #2a7a3f; background: #e8f8ee; border-color: #bde5c8; }
.status-pill.warning { color: #946124; background: #fff6e7; border-color: #ead3ae; }
.status-pill.rejected { color: #a74141; background: #fdeeee; border-color: #f1c5c5; }
.pager-row { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
