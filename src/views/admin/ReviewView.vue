<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PanelCard from "../../components/PanelCard.vue";
import { marketData, pendingReviews } from "../../mock/data";

const router = useRouter();
const keyword = ref("");
const reviews = ref(
  pendingReviews.map((item) => {
    const datasetId = marketData.find((d) => d.name === item.dataset)?.id || marketData[0]?.id || 1;
    return { ...item, datasetId };
  })
);

const filteredReviews = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return reviews.value;
  return reviews.value.filter(
    (item) =>
      String(item.id).toLowerCase().includes(k) ||
      String(item.dataset).toLowerCase().includes(k) ||
      String(item.owner).toLowerCase().includes(k)
  );
});

function statusClass(status) {
  if (status === "待审核") return "pending";
  if (status === "审核中") return "processing";
  if (status === "通过") return "done";
  if (status === "驳回") return "rejected";
  return "pending";
}

function openDatasetDetail(item) {
  const url = router.resolve({
    name: "admin-review-detail",
    params: { id: item.datasetId },
    query: { reviewStatus: item.status }
  }).href;
  window.open(url, "_blank");
}
</script>

<template>
  <PanelCard>
    <div class="toolbar">
      <input v-model="keyword" type="text" placeholder="搜索审核单号/数据集/上传用户" />
    </div>

    <table>
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
        <tr v-for="item in filteredReviews" :key="item.id" class="click-row" @click="openDatasetDetail(item)">
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
</style>
