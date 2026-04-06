<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { messageApi, orderApi, reviewApi, userApi } from "../../services/api";

const router = useRouter();
const auth = useAuthStore();

const userName = computed(() => auth.user?.name || "平台管理员");
const userInitial = computed(() => {
  const raw = String(auth.user?.name || "A").trim();
  return raw ? raw.slice(0, 1).toUpperCase() : "A";
});
const lastLogin = computed(() => new Date().toISOString().slice(0, 10));

const pendingReviewCount = ref(0);
const orderCount = ref(0);
const userCount = ref(0);
const messageCount = ref(0);

const rows = computed(() => [
  { label: "待审核数据", value: pendingReviewCount.value, route: "admin-review", query: { status: "待审核" } },
  { label: "交易订单", value: orderCount.value, route: "admin-orders" },
  { label: "用户管理", value: userCount.value, route: "admin-users" },
  { label: "留言查看", value: messageCount.value, route: "admin-messages" }
]);

async function loadStats() {
  const [reviewRes, orderRes, userRes, msgRes] = await Promise.all([
    reviewApi.getPendingList().catch(() => null),
    orderApi.getAll().catch(() => null),
    userApi.getAll().catch(() => null),
    messageApi.getAll().catch(() => null)
  ]);
  pendingReviewCount.value = Array.isArray(reviewRes?.data) ? reviewRes.data.length : 0;
  orderCount.value = Array.isArray(orderRes?.data) ? orderRes.data.length : 0;
  userCount.value = Array.isArray(userRes?.data) ? userRes.data.length : 0;
  messageCount.value = Array.isArray(msgRes?.data) ? msgRes.data.length : 0;
}

function goToPage(item) {
  router.push({ name: item.route, query: item.query || {} });
}

function goEditProfile() {
  router.push("/admin/profile/edit");
}

onMounted(loadStats);
</script>

<template>
  <section class="admin-profile">
    <aside class="profile-block">
      <span class="avatar-initial">{{ userInitial }}</span>
      <h1>{{ userName }}</h1>
      <p class="role">系统管理员</p>
      <p class="meta">上次登录：{{ lastLogin }}</p>
      <button class="edit-btn" @click="goEditProfile">编辑个人资料</button>
    </aside>

    <section class="overview-block">
      <article v-for="item in rows" :key="item.label" class="overview-card" @click="goToPage(item)">
        <span class="row-label">{{ item.label }}</span>
        <span class="row-value">{{ item.value }}</span>
      </article>
    </section>
  </section>
</template>

<style scoped>
.admin-profile { display: grid; grid-template-columns: 360px 1fr; gap: 24px; align-items: stretch; min-height: 360px; }
.profile-block { border: 1px solid #dbe4f3; border-radius: 14px; padding: 22px 20px; background: #fff; display: grid; justify-items: start; gap: 10px; align-content: start; box-sizing: border-box; }
.avatar-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  color: #eef4ff;
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #6f80ff, #5d63f0);
}
h1 { margin: 6px 0 0; color: #1f2a37; font-size: 30px; }
.role { margin: 0; color: #476487; font-size: 14px; }
.meta { margin: 0; color: #7a8ea9; font-size: 13px; }
.edit-btn { margin-top: 8px; border: 1px solid #c3d3ee; border-radius: 999px; padding: 8px 16px; color: #2f578d; background: #fff; cursor: pointer; }
.overview-block { display: grid; grid-template-columns: 1fr; grid-template-rows: repeat(4, minmax(86px, 1fr)); gap: 14px; min-height: 400px; }
.overview-card { border: 1px solid #dce5f2; border-radius: 14px; padding: 0 20px; background: #fff; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; min-height: 86px; }
.overview-card:hover { background: #f8fbff; border-color: #b8d0f0; }
.row-label { color: #5f728f; font-size: 26px; font-weight: 500; }
.row-value { color: #1f4a80; font-size: 34px; font-weight: 600; }
</style>
