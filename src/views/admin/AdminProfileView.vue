<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import PanelCard from "../../components/PanelCard.vue";
import { pendingReviews, orderList } from "../../mock/data";

const router = useRouter();
const auth = useAuthStore();

const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const userName = computed(() => auth.user?.name || "平台管理员");

const stats = computed(() => [
  { label: "待审核数据", value: pendingReviews.length },
  { label: "交易订单", value: orderList.length },
  { label: "活跃用户", value: 218 },
  { label: "异常订单", value: 2 }
]);

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}

function goEditProfile() {
  router.push("/admin/profile/edit");
}
</script>

<template>
  <section class="admin-profile">
    <div class="card">
      <img class="avatar" :src="avatarUrl" alt="管理员头像" @error="onAvatarError" />
      <div class="content">
        <h1>{{ userName }}</h1>
        <p>管理端账号资料</p>
      </div>
      <button class="edit-btn" @click="goEditProfile">编辑个人资料</button>
    </div>

    <section class="stats-grid">
      <PanelCard v-for="item in stats" :key="item.label">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </PanelCard>
    </section>
  </section>
</template>

<style scoped>
.admin-profile {
  display: grid;
  gap: 14px;
}

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #dbe4f3;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.content {
  flex: 1;
}

.content h1 {
  margin: 0;
  color: #1f2a37;
}

.content p {
  margin: 6px 0 0;
  color: #6e7f97;
}

.edit-btn {
  border: 1px solid #c3d3ee;
  border-radius: 999px;
  padding: 8px 16px;
  color: #2f578d;
  background: #fff;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stat-label {
  color: #5f728f;
  font-size: 14px;
}

.stat-value {
  margin-top: 6px;
  font-size: 28px;
  color: #1f4a80;
  font-weight: 700;
}
</style>
