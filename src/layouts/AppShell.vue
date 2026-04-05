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
  { to: "/user/market", label: "数据市场", icon: "/img/数据市场 (2).png" },
  { to: "/user/upload", label: "数据上传", icon: "/img/数据更新,数据上传.png" },
  { to: "/user/custom-bids", label: "任务市场", icon: "/img/mti-任务市场 (2).png" },
  { to: "/user/custom-requests", label: "任务发布", icon: "/img/通用-上报事件任务上传文档.png" },
  { to: "/user/feedback", label: "管理员留言", icon: "/img/留言.png" },
  { to: "/user/processing", label: "AI数据处理", icon: "/img/AI数据处理.png" },
  { to: "/user/visualization", label: "数据可视化", icon: "/img/数据可视化.png" }
];

const adminMenus = [
  { to: "/admin/review", label: "数据审核"},
  { to: "/admin/users", label: "用户管理"},
  { to: "/admin/orders", label: "订单监控" },
  { to: "/admin/messages", label: "留言查看" }
];

const menus = computed(() => (isAdmin.value ? adminMenus : userMenus));
const avatarUrl = computed(() => auth.user?.avatar || "/img/avatar.png");
const sidebarProfilePath = computed(() => (isAdmin.value ? "/admin/profile" : "/user/profile"));
const sidebarUserName = computed(() => auth.user?.name || "未登录用户");
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
      <div class="side-nav-wrap">
        <el-scrollbar class="side-nav-scrollbar">
          <nav class="side-nav">
            <button
              v-for="item in menus"
              :key="item.to"
              type="button"
              class="menu-item"
              :class="{ active: isActive(item.to) }"
              @click="navigate(item.to)"
            >
              <img v-if="item.icon" :src="item.icon" :alt="item.label" class="menu-icon" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </el-scrollbar>
      </div>
      <div class="sidebar-divider" />
      <button
        type="button"
        class="profile-entry"
        :class="{ active: isActive(sidebarProfilePath) }"
        @click="navigate(sidebarProfilePath)"
      >
        <span class="profile-avatar-wrap">
          <img class="profile-avatar" :src="avatarUrl" alt="侧边栏头像" @error="onAvatarError" />
        </span>
        <span class="profile-text">
          <strong>{{ sidebarUserName }}</strong>
        </span>
      </button>
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
  display: flex;
  flex-direction: column;
  width: 230px;
  height: 100vh;
  overflow: hidden;
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

.side-nav-wrap {
  flex: 1;
  min-height: 0;
}

.side-nav-scrollbar {
  height: 100%;
}

.side-nav {
  padding-right: 6px;
}

.menu-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 12px;
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  color: inherit;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.menu-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex: 0 0 18px;
}

.menu-item.active,
.menu-item:hover {
  background: rgba(255, 255, 255, 0.18);
}

:deep(.side-nav-scrollbar .el-scrollbar__bar.is-vertical) {
  width: 8px;
  right: 2px;
}

:deep(.side-nav-scrollbar .el-scrollbar__thumb) {
  background: rgba(255, 255, 255, 0.36);
  border-radius: 999px;
}

.profile-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  border-radius: 12px;
  margin-top: 12px;
  padding: 10px 12px;
  color: #eef4ff;
  background: transparent;
  cursor: pointer;
}

.profile-entry.active,
.profile-entry:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-divider {
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  margin-top: 6px;
}

.profile-avatar-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  flex: 0 0 36px;
}

.profile-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-text {
  display: grid;
  text-align: left;
  line-height: 1.2;
}

.profile-text strong {
  font-size: 14px;
}

.profile-text small {
  margin-top: 3px;
  color: #d8e3f5;
  font-size: 12px;
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
