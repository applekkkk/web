<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const userName = computed(() => auth.user?.name || "管理员");

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
        <p>管理端账户资料</p>
      </div>
      <button class="edit-btn" @click="goEditProfile">编辑个人资料</button>
    </div>
  </section>
</template>

<style scoped>
.admin-profile {
  max-width: 720px;
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
</style>
