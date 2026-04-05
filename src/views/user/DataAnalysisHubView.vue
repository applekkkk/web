<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProcessingView from "./ProcessingView.vue";
import VisualizationView from "./VisualizationView.vue";

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => (route.query.tab === "viz" ? "viz" : "ai"));

function switchTab(tab) {
  if (tab === activeTab.value) return;
  router.replace({
    path: "/user/data-analysis",
    query: tab === "viz" ? { tab: "viz" } : { tab: "ai" }
  });
}
</script>

<template>
  <section class="hub-wrap">
    <div class="hub-tabs">
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'ai' }"
        @click="switchTab('ai')"
      >
        AI处理
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'viz' }"
        @click="switchTab('viz')"
      >
        数据可视化
      </button>
    </div>

    <ProcessingView v-show="activeTab === 'ai'" />
    <VisualizationView v-show="activeTab === 'viz'" />
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

