<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import CustomBidsView from "./CustomBidsView.vue";
import CustomRequestView from "./CustomRequestView.vue";

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => (route.query.tab === "publish" ? "publish" : "accept"));

function switchTab(tab) {
  if (tab === activeTab.value) return;
  router.replace({
    path: "/user/data-customization",
    query: tab === "publish" ? { tab: "publish" } : { tab: "accept" }
  });
}
</script>

<template>
  <section class="hub-wrap">
    <div class="hub-tabs">
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'accept' }"
        @click="switchTab('accept')"
      >
        任务承接
      </button>
      <button
        type="button"
        class="hub-tab"
        :class="{ active: activeTab === 'publish' }"
        @click="switchTab('publish')"
      >
        任务发布
      </button>
    </div>

    <CustomBidsView v-show="activeTab === 'accept'" />
    <CustomRequestView v-show="activeTab === 'publish'" />
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

