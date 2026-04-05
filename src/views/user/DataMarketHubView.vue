<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import MarketView from "./MarketView.vue";
import UploadManageView from "./UploadManageView.vue";

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => (route.query.tab === "upload" ? "upload" : "trade"));

function switchTab(tab) {
  if (tab === activeTab.value) return;
  router.replace({
    path: "/user/data-market",
    query: tab === "upload" ? { tab: "upload" } : { tab: "trade" }
  });
}
</script>

<template>
  <section class="hub-wrap">
    <div class="hub-tabs">
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'trade' }"
        @click="switchTab('trade')"
      >
        数据交易
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'upload' }"
        @click="switchTab('upload')"
      >
        数据上架
      </button>
    </div>

    <MarketView v-show="activeTab === 'trade'" />
    <UploadManageView v-show="activeTab === 'upload'" />
  </section>
</template>

<style scoped>
.hub-wrap {
  display: grid;
  gap: 14px;
}

.hub-tabs {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.hub-tab {
  border: 1px solid #d0dcee;
  border-radius: 999px;
  padding: 6px 14px;
  color: #4b6484;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.hub-tab.active {
  border-color: #2b4d78;
  color: #fff;
  background: #2b4d78;
}
</style>

