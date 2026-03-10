<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import NeedCard from "../../components/NeedCard.vue";
import { useNeedsStore } from "../../stores/needs";

const router = useRouter();
const needsStore = useNeedsStore();

const keyword = ref("");
const activeCategory = ref("全部");

const pageSizeOptions = [6, 9, 12, 20];
const pageSize = ref(9);
const currentPage = ref(1);

const categories = computed(() => {
  const set = new Set(needsStore.marketNeeds.map((item) => item.category || "其他"));
  return ["全部", ...set];
});

const filteredList = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return needsStore.marketNeeds.filter((item) => {
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

function openNeed(item) {
  const url = router.resolve({ path: `/user/custom-bids/${item.id}` }).href;
  window.open(url, "_blank");
}
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


    <section class="cards-grid">
      <NeedCard
        v-for="item in pagedList"
        :key="item.id"
        :item="item"
        :show-action="false"
        clickable
        @open="openNeed"
      />
    </section>

    <p v-if="filteredList.length === 0" class="empty">暂无可承接任务。</p>

    <div v-else class="pager-row">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizeOptions"
        layout="prev, pager, next, sizes, total"
        :total="filteredList.length"
        background
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
