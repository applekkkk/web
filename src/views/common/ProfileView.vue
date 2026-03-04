<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const roleText = computed(() => (auth.user?.role === "admin" ? "管理员" : "普通用户"));

function handleLogout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <section class="profile-card">
    <h1>个人中心</h1>
    <p class="sub">账号信息与登录状态管理</p>

    <div class="info-list">
      <div class="info-item">
        <span>用户名</span>
        <strong>{{ auth.user?.name || "-" }}</strong>
      </div>
      <div class="info-item">
        <span>角色</span>
        <strong>{{ roleText }}</strong>
      </div>
      <div class="info-item">
        <span>用户ID</span>
        <strong>{{ auth.user?.id || "-" }}</strong>
      </div>
      <div class="info-item" v-if="auth.user?.role !== 'admin'">
        <span>当前积分</span>
        <strong>{{ auth.user?.points ?? 0 }}</strong>
      </div>
    </div>

    <button class="logout-btn" @click="handleLogout">退出登录</button>
  </section>
</template>

<style scoped>
.profile-card {
  max-width: 680px;
  border: 1px solid #dce6f5;
  border-radius: 14px;
  padding: 22px;
  background: #fff;
}

h1 {
  margin: 0;
  color: #1f2f47;
  font-size: 26px;
}

.sub {
  margin: 6px 0 18px;
  color: #6f8098;
  font-size: 13px;
}

.info-list {
  display: grid;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2eaf7;
  border-radius: 10px;
  padding: 10px 12px;
}

.info-item span {
  color: #6b7e98;
  font-size: 13px;
}

.info-item strong {
  color: #223a59;
}

.logout-btn {
  margin-top: 18px;
  border: none;
  border-radius: 8px;
  padding: 9px 14px;
  color: #fff;
  background: #2f5a90;
  cursor: pointer;
}
</style>
