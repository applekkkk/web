<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { taskAppealApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const appeals = ref([]);
const keyword = ref("");
const statusFilter = ref("");
const typeFilter = ref("");
const pageSizeOptions = [10, 20, 30, 50];
const pageSize = ref(10);
const currentPage = ref(1);

function statusText(code) {
  return Number(code ?? 0) === 1 ? "已处理" : "待处理";
}

function formatTime(text) {
  return String(text || "").replace("T", " ");
}

function resolveAppealType(item) {
  const targetType = String(item?.targetType ?? item?.target_type ?? "").toUpperCase();
  if (targetType === "DATA") return "数据";
  if (targetType === "TASK") return "任务";
  const role = String(item?.appellantRole ?? item?.appellant_role ?? "");
  return role.includes("购买") ? "数据" : "任务";
}

function normalizeAppeal(item) {
  return {
    id: Number(item.id ?? 0),
    requestId: Number(item.requestId ?? item.request_id ?? 0),
    requestTitle: item.requestTitle ?? item.request_title ?? "",
    appellantRole: item.appellantRole ?? item.appellant_role ?? "",
    claimText: item.claimText ?? item.claim_text ?? "",
    evidenceText: item.evidenceText ?? item.evidence_text ?? "",
    evidenceImage: item.evidenceImage ?? item.evidence_image ?? "",
    status: Number(item.status ?? 0),
    appealType: resolveAppealType(item),
    createdAt: formatTime(item.createdAt ?? item.created_at ?? "")
  };
}

const displayList = computed(() => appeals.value.map(normalizeAppeal));

const filteredList = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  let rows = displayList.value;
  if (k) {
    rows = rows.filter((item) => {
      const idText = String(item.id ?? "");
      const title = String(item.requestTitle ?? "").toLowerCase();
      const claim = String(item.claimText ?? "").toLowerCase();
      const evidence = String(item.evidenceText ?? "").toLowerCase();
      return idText.includes(k) || title.includes(k) || claim.includes(k) || evidence.includes(k);
    });
  }
  if (statusFilter.value !== "") {
    rows = rows.filter((item) => String(item.status) === String(statusFilter.value));
  }
  if (typeFilter.value) {
    rows = rows.filter((item) => item.appealType === typeFilter.value);
  }
  return rows;
});

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

function imageUrl(name) {
  return `/api/files/download?name=${encodeURIComponent(name)}`;
}

function openDetail(item) {
  if (!item?.requestId) return;
  if (item.appealType === "数据") {
    router.push(`/user/market/${item.requestId}`);
    return;
  }
  router.push(`/user/custom-bids/${item.requestId}`);
}

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

async function fetchAppeals() {
  if (!auth.user?.id) return;
  loading.value = true;
  try {
    const res = await taskAppealApi.getUserList(auth.user.id);
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载申诉失败");
    }
    appeals.value = Array.isArray(res?.data) ? res.data : [];
  } catch (error) {
    appeals.value = [];
    ElMessage.error(error?.message || "加载申诉失败");
  } finally {
    loading.value = false;
  }
}

watch([keyword, statusFilter, typeFilter], () => {
  currentPage.value = 1;
});

onMounted(fetchAppeals);
</script>

<template>
  <section class="appeal-page card" v-loading="loading">
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索申诉ID/任务/诉求" />
      <el-select
        v-model="statusFilter"
        placeholder="状态筛选"
        clearable
        size="default"
        style="width: 130px; margin-left: 12px"
      >
        <el-option label="待处理" value="0" />
        <el-option label="已处理" value="1" />
      </el-select>
      <el-select
        v-model="typeFilter"
        placeholder="申诉类型"
        clearable
        size="default"
        style="width: 130px; margin-left: 12px"
      >
        <el-option label="数据" value="数据" />
        <el-option label="任务" value="任务" />
      </el-select>
    </div>

    <p v-if="filteredList.length === 0" class="empty">暂无申诉记录</p>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>类型</th>
            <th>任务/数据</th>
            <th>诉求</th>
            <th>证据说明</th>
            <th>证据图片</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.appealType }}</td>
            <td>{{ item.requestTitle || `记录#${item.requestId}` }}</td>
            <td class="text-cell">{{ item.claimText || "-" }}</td>
            <td class="text-cell">{{ item.evidenceText || "-" }}</td>
            <td>
              <img v-if="item.evidenceImage" class="evidence-img" :src="imageUrl(item.evidenceImage)" alt="证据图片" />
              <span v-else>-</span>
            </td>
            <td>
              <span class="status-pill" :class="{ done: Number(item.status) === 1 }">{{ statusText(item.status) }}</span>
            </td>
            <td>{{ item.createdAt || "-" }}</td>
            <td>
              <button type="button" class="detail-btn" @click="openDetail(item)">查看详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredList.length > 0" class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredList.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </section>
</template>

<style scoped>
.card {
  border: 1px solid #e4eaf5;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

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

.empty {
  margin: 0;
  color: #7a8ca6;
}

.table-wrap {
  width: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

th,
td {
  border-bottom: 1px solid #e5ecf7;
  padding: 10px 8px;
  text-align: left;
  font-size: 13px;
  color: #324863;
  vertical-align: top;
}

.text-cell {
  min-width: 180px;
  max-width: 260px;
  white-space: normal;
  word-break: break-word;
}

.evidence-img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dce4f1;
}

.status-pill {
  display: inline-block;
  border: 1px solid #9fc2ef;
  border-radius: 999px;
  padding: 2px 10px;
  color: #2f5a90;
  background: rgba(47, 90, 144, 0.12);
}

.status-pill.done {
  border-color: #7bd69d;
  color: #2d8a4d;
  background: rgba(58, 170, 93, 0.12);
}

.detail-btn {
  border: 1px solid #c6d6ee;
  border-radius: 8px;
  padding: 6px 12px;
  color: #2f568c;
  background: #fff;
  cursor: pointer;
}

.pager-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
