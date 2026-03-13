<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isAdmin = computed(() => route.path.startsWith("/admin"));
const title = computed(() => (isAdmin.value ? "管理端" : "用户端"));

const userMenus = [
  { to: "/user/dashboard", label: "工作台" },
  { to: "/user/market", label: "数据市场" },
  { to: "/user/upload", label: "数据上传" },
  { to: "/user/custom-bids", label: "任务市场" },
  { to: "/user/custom-requests", label: "任务发布" },
  { to: "/user/processing", label: "数据处理" },
  { to: "/user/profile", label: "个人中心" }
];

const adminMenus = [
  { to: "/admin/review", label: "数据审核" },
  { to: "/admin/users", label: "用户管理" },
  { to: "/admin/orders", label: "订单监控" },
  { to: "/admin/profile", label: "个人中心" }
];

const menus = computed(() => (isAdmin.value ? adminMenus : userMenus));
const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const checkInText = computed(() => (auth.canDailyCheckIn ? "每日签到 +10" : "今日已签到"));
const avatarMenuOpen = ref(false);

function isActive(path) {
  return route.path === path;
}

function navigate(path) {
  if (route.path !== path) router.push(path);
}

function goProfile() {
  avatarMenuOpen.value = false;
  router.push(isAdmin.value ? "/admin/profile" : "/user/profile");
}

function logout() {
  avatarMenuOpen.value = false;
  auth.logout();
  router.push("/login");
}

function onAvatarError(event) {
  event.target.src = "/img/avatar.png";
}

async function handleCheckIn() {
  const result = await auth.checkIn();
  if (result.ok) {
    ElMessage.success("签到成功，积分 +10");
    return;
  }
  if (result.reason === "already") {
    ElMessage.warning("今日已签到");
    return;
  }
  if (result.reason === "forbidden") {
    ElMessage.warning("当前账号不可签到");
    return;
  }
  ElMessage.error(result.message || "签到失败");
}

function toggleAvatarMenu() {
  avatarMenuOpen.value = !avatarMenuOpen.value;
}

function onDocumentClick(event) {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest(".avatar-wrap")) {
    avatarMenuOpen.value = false;
  }
}

onMounted(() => {
  auth.refreshUser();
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <h1>数据交易平台</h1>
      <p>{{ title }}</p>
      <nav>
        <button
          v-for="item in menus"
          :key="item.to"
          type="button"
          class="menu-item"
          :class="{ active: isActive(item.to) }"
          @click="navigate(item.to)"
        >
          {{ item.label }}
        </button>
      </nav>
    </aside>

    <section class="main">
      <header class="topbar">
        <div>
          <strong>{{ route.meta.title || "页面" }}</strong>
          <div class="sub">欢迎，{{ auth.user?.name }}<span v-if="!isAdmin">（积分：{{ auth.user?.points ?? 0 }}）</span></div>
        </div>

        <div class="topbar-actions">
          <button
            v-if="!isAdmin"
            class="checkin-btn"
            :class="{ disabled: !auth.canDailyCheckIn }"
            @click="handleCheckIn"
          >
            {{ checkInText }}
          </button>

          <div class="avatar-wrap">
            <button class="avatar-btn" @click.stop="toggleAvatarMenu" :title="'用户菜单'">
              <img class="avatar-img" :src="avatarUrl" alt="用户头像" @error="onAvatarError" />
            </button>
            <div v-if="avatarMenuOpen" class="avatar-menu">
              <button type="button" class="avatar-menu-item" @click="goProfile">进入个人中心</button>
              <button type="button" class="avatar-menu-item danger" @click="logout">退出登录</button>
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  width: 230px;
  height: 100vh;
  overflow-y: auto;
  color: #eef4ff;
  padding: 28px 18px;
  background: linear-gradient(180deg, #0f2745, #1a3d66);
}

.sidebar h1 {
  margin: 0 0 4px;
  font-size: 20px;
}

.sidebar p {
  margin: 0 0 22px;
  font-size: 13px;
  color: #bfccdf;
}

.menu-item {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  border: none;
  border-radius: 10px;
  padding: 13px 14px;
  color: inherit;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.menu-item.active,
.menu-item:hover {
  background: rgba(255, 255, 255, 0.18);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #dce4f2;
  background: #fff;
}

.sub {
  margin-top: 4px;
  color: #7b8ca5;
  font-size: 12px;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.checkin-btn {
  border: 1px solid #c7d7ef;
  border-radius: 999px;
  padding: 6px 12px;
  color: #2f578d;
  background: #f7fbff;
  cursor: pointer;
}

.checkin-btn.disabled {
  color: #8ca0bc;
  background: #f4f7fb;
  cursor: not-allowed;
}

.avatar-wrap {
  position: relative;
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.avatar-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 132px;
  border: 1px solid #dde5f2;
  border-radius: 10px;
  padding: 6px;
  background: #fff;
  box-shadow: 0 10px 20px rgba(17, 24, 39, 0.12);
  z-index: 20;
}

.avatar-menu-item {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  text-align: left;
  color: #2d3d54;
  background: transparent;
  cursor: pointer;
}

.avatar-menu-item:hover {
  background: #f4f7fb;
}

.avatar-menu-item.danger {
  color: #b13a3a;
}

.avatar-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

.content {
  flex: 1;
  padding: 20px 24px;
}

@media (max-width: 900px) {
  .shell {
    flex-direction: column;
  }

  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    overflow: visible;
  }
}
</style>
