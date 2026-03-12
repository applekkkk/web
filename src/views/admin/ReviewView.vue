<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import PanelCard from "../../components/PanelCard.vue";
import { reviewApi } from "../../services/api";

const router = useRouter();
const route = useRoute();
const keyword = ref("");
const statusFilter = ref("");
const reviews = ref([]);
const loading = ref(false);
const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const filteredReviews = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  let result = reviews.value;

  if (k) {
    result = result.filter(
      (item) =>
        String(item.id).toLowerCase().includes(k) ||
        String(item.dataset).toLowerCase().includes(k) ||
        String(item.owner).toLowerCase().includes(k)
    );
  }

  if (statusFilter.value) {
    result = result.filter((item) => item.status === statusFilter.value);
  }

  return result;
});

const total = computed(() => filteredReviews.value.length);
const pagedReviews = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredReviews.value.slice(start, start + pageSize.value);
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function statusClass(status) {
  if (status === "待审核") return "pending";
  if (status === "审核中") return "processing";
  if (status === "通过") return "done";
  if (status === "驳回") return "rejected";
  return "pending";
}

function statusLabelFromCode(code) {
  if (code === 1) return "通过";
  if (code === 2) return "驳回";
  return "待审核";
}

function openDatasetDetail(item) {
  const url = router.resolve({
    name: "admin-review-detail",
    params: { id: item.datasetId },
    query: { reviewStatus: item.status }
  }).href;
  window.open(url, "_blank");
}

async function fetchPendingReviews() {
  loading.value = true;
  try {
    const res = await reviewApi.getPendingList();
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    const list = Array.isArray(res?.data) ? res.data : [];
    reviews.value = list.map((item) => ({
      id: item.id,
      datasetId: item.id,
      dataset: item.name,
      owner: item.authorName ?? item.author_name ?? "",
      submittedAt: item.uploadDate ?? item.upload_date ?? "",
      status: statusLabelFromCode(item.reviewStatus ?? item.review_status)
    }));
  } catch (e) {
    reviews.value = [];
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (route.query.status) {
    statusFilter.value = route.query.status;
  }
  fetchPendingReviews();
});
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索审核单号/数据集/上传用户" />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable size="default" style="width:140px;margin-left:12px">
        <el-option label="待审核" value="待审核" />
        <el-option label="审核中" value="审核中" />
        <el-option label="通过" value="通过" />
        <el-option label="驳回" value="驳回" />
      </el-select>
    </div>

    <table v-loading="loading">
      <thead>
        <tr>
          <th>审核单号</th>
          <th>数据集</th>
          <th>上传用户</th>
          <th>提交时间</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pagedReviews" :key="item.id" class="click-row" @click="openDatasetDetail(item)">
          <td>{{ item.id }}</td>
          <td>{{ item.dataset }}</td>
          <td>{{ item.owner }}</td>
          <td>{{ item.submittedAt }}</td>
          <td>
            <span class="status-pill" :class="statusClass(item.status)">
              <i class="dot" />
              {{ item.status }}
            </span>
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

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d6deeb;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.pending {
  color: #6f7c90;
  background: #f4f7fb;
}

.status-pill.processing {
  color: #245a95;
  background: #eaf2ff;
  border-color: #bfd3f2;
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

.click-row {
  cursor: pointer;
}

.click-row:hover {
  background: #f8fbff;
}

.pager-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
