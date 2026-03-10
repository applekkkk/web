<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { pendingReviews, orderList } from "../../mock/data";

const router = useRouter();
const auth = useAuthStore();

const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const userName = computed(() => auth.user?.name || "平台管理员");
const lastLogin = "2026-03-09";

const rows = computed(() => [
  { label: "待审核数据", value: pendingReviews.length, route: "admin-review", query: { status: "待审核" } },
  { label: "交易订单", value: orderList.length, route: "admin-orders" },
  { label: "用户管理", value: 218, route: "admin-users" },
]);

function goToPage(item) {
  router.push({ name: item.route, query: item.query || {} });
}

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}

function goEditProfile() {
  router.push("/admin/profile/edit");
}
</script>

<template>
  <section class="admin-profile">
    <aside class="profile-block">
      <img class="avatar" :src="avatarUrl" alt="管理员头像" @error="onAvatarError" />
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
.admin-profile {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  align-items: stretch;
  min-height: 360px;
}

.profile-block {
  border: 1px solid #dbe4f3;
  border-radius: 14px;
  padding: 22px 20px;
  background: #fff;
  display: grid;
  justify-items: start;
  gap: 10px;
  align-content: start;
  height: 360px;
  box-sizing: border-box;
}

.avatar {
  width: 86px;
  height: 86px;
  border-radius: 14px;
  object-fit: cover;
}

h1 {
  margin: 6px 0 0;
  color: #1f2a37;
  font-size: 30px;
}

.role {
  margin: 0;
  color: #476487;
  font-size: 14px;
}

.meta {
  margin: 0;
  color: #7a8ea9;
  font-size: 13px;
}

.edit-btn {
  margin-top: 8px;
  border: 1px solid #c3d3ee;
  border-radius: 999px;
  padding: 8px 16px;
  color: #2f578d;
  background: #fff;
  cursor: pointer;
}

.overview-block {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: 18px;
  height: 360px;
}

.overview-card {
  border: 1px solid #dce5f2;
  border-radius: 14px;
  padding: 0 20px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
}

.overview-card:hover {
  background: #f8fbff;
  border-color: #b8d0f0;
}

.row-label {
  color: #5f728f;
  font-size: 26px;
  line-height: 1;
  font-weight: 500;
}

.row-value {
  color: #1f4a80;
  font-size: 34px;
  line-height: 1;
  font-weight: 600;
}

@media (max-width: 960px) {
  .admin-profile {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .overview-block {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    height: auto;
  }

  .profile-block {
    height: auto;
    min-height: 320px;
  }
}
</style>
