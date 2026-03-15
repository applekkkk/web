<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import NeedCard from "../../components/NeedCard.vue";
import { customRequestApi } from "../../services/api";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const keyword = ref("");
const activeCategory = ref("全部");
const loading = ref(false);
const list = ref([]);

const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const disabled = ref(false);
const background = ref(true);
const size = ref("default");

function normalizeRequest(item) {
  return {
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    amount: item.amount || "",
    tags: item.tags || "",
    budget: Number(item.budget || 0),
    deadline: item.deadline || "",
    category: item.category || "其他",
    publisher: item.publisherName ?? item.publisher_name ?? "",
    publisherId: item.publisherId ?? item.publisher_id ?? null,
    publisherContact: item.publisherContact ?? item.publisher_contact ?? "",
    attachmentName: item.attachmentName ?? item.attachment_name ?? "",
    acceptedBy: item.acceptorName ?? item.acceptor_name ?? "",
    needStatus: item.needStatus ?? item.need_status ?? 0,
    deliveryFileName: item.deliveryFileName ?? item.delivery_file_name ?? ""
  };
}

async function fetchMarket() {
  loading.value = true;
  try {
    const res = await customRequestApi.getList({ userId: auth.user?.id ?? null });
    if (res?.code !== 200) {
      throw new Error(res?.message || "加载失败");
    }
    const raw = Array.isArray(res?.data) ? res.data : [];
    list.value = raw.map(normalizeRequest);
  } catch (e) {
    list.value = [];
    ElMessage.error(e?.message || "加载失败");
  } finally {
    loading.value = false;
  }
}

const categories = computed(() => {
  const set = new Set(list.value.map((item) => item.category || "其他"));
  return ["全部", ...set];
});

const filteredList = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return list.value.filter((item) => {
    const hitCategory = activeCategory.value === "全部" || (item.category || "其他") === activeCategory.value;
    const text = `${item.title} ${item.description || ""} ${item.tags || ""} ${item.publisher || ""}`.toLowerCase();
    const hitKeyword = !q || text.includes(q);
    return hitCategory && hitKeyword;
  });
});

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

watch([keyword, activeCategory], () => {
  currentPage.value = 1;
});

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function openNeed(item) {
  router.push({ path: `/user/custom-bids/${item.id}` });
}

onMounted(() => {
  fetchMarket();
});
</script>

<template>
  <section class="bids-page">
    <section class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="按标题、描述、标签或发布者搜索" />
      <div class="category-row">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="chip"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </section>


    <section class="cards-grid" v-loading="loading">
      <NeedCard
        v-for="item in pagedList"
        :key="item.id"
        :item="item"
        :show-action="false"
        right-mode="points"
        clickable
        @open="openNeed"
      />
    </section>

    <p v-if="!loading && filteredList.length === 0" class="empty">暂无可承接任务。</p>

    <div v-else class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :size="size"
        :disabled="disabled"
        :background="background"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredList.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </section>
</template>

<style scoped>
.bids-page {
  display: grid;
  gap: 12px;
}

.toolbar {
  border: 1px solid #e5ebf6;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
}

.search-input {
  width: 100%;
  border: 1px solid #d6dfed;
  border-radius: 10px;
  padding: 10px 12px;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.chip {
  border: 1px solid #d9e3f3;
  border-radius: 999px;
  padding: 6px 10px;
  color: #455975;
  background: #fff;
  cursor: pointer;
}

.chip.active {
  border-color: #204f84;
  color: #fff;
  background: #204f84;
}

.result-count {
  margin: 0;
  color: #5f7088;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pager-row {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.empty {
  margin: 0;
  color: #7d8ca1;
  text-align: center;
}
</style>
