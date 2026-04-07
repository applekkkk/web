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
  { to: "/user/data-market", label: "数据市场", icon: "/img/数据市场 (2).png", match: ["/user/data-market", "/user/market", "/user/upload"] },
  { to: "/user/data-customization", label: "数据定制", icon: "/img/mti-任务市场 (2).png", match: ["/user/data-customization", "/user/custom-bids", "/user/custom-requests"] },
  { to: "/user/data-analysis", label: "数据分析", icon: "/img/AI数据处理.png", match: ["/user/data-analysis", "/user/processing", "/user/visualization"] },
  { to: "/user/appeals", label: "申诉记录", icon: "/img/用户申诉.png" }
];

const adminMenus = [
  { to: "/admin/review", label: "数据审核"},
  { to: "/admin/users", label: "用户管理"},
  { to: "/admin/orders", label: "订单监控" },
  { to: "/admin/appeals", label: "申诉处理" }
];

const menus = computed(() => (isAdmin.value ? adminMenus : userMenus));
const sidebarProfilePath = computed(() => (isAdmin.value ? "/admin/profile" : "/user/profile"));
const sidebarUserName = computed(() => auth.user?.name || "未登录用户");
const userInitial = computed(() => {
  const raw = String(auth.user?.name || "用户").trim();
  return raw ? raw.slice(0, 1).toUpperCase() : "U";
});
const sidebarUserMeta = computed(() => (isAdmin.value ? "系统管理员" : `${auth.user?.points ?? 0} 积分`));
const topUserMeta = computed(() => (isAdmin.value ? "管理员账号" : `${auth.user?.points ?? 0} 积分`));
const checkInText = computed(() => (auth.canDailyCheckIn ? "每日签到 +10" : "今日已签到"));
const avatarMenuOpen = ref(false);

function isActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`);
}

function isMenuActive(item) {
  const matches = Array.isArray(item?.match) && item.match.length ? item.match : [item.to];
  return matches.some((p) => route.path === p || route.path.startsWith(`${p}/`));
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
      <div class="sidebar-decor" aria-hidden="true">
        <span class="glow glow-a"></span>
        <span class="glow glow-b"></span>
        <span class="glow glow-c"></span>
      </div>
      <h1>数据交易平台</h1>
      <p>{{ title }}</p>
      <div class="sidebar-accent" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="side-nav-wrap">
        <el-scrollbar class="side-nav-scrollbar">
          <nav class="side-nav">
            <button
              v-for="item in menus"
              :key="item.to"
              type="button"
              class="menu-item"
              :class="{ active: isMenuActive(item) }"
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
        <span class="profile-avatar">{{ userInitial }}</span>
        <span class="profile-text">
          <strong>{{ sidebarUserName }}</strong>
          <small>{{ sidebarUserMeta }}</small>
        </span>
      </button>
    </aside>

    <section class="main">
      <header class="topbar">
        <div class="topbar-left">
          <div class="title-row">
            <strong>{{ route.meta.title || "页面" }}</strong>
            <i class="title-dot" aria-hidden="true"></i>
          </div>
          <div class="sub">欢迎，{{ auth.user?.name }}</div>
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
            <button class="user-chip" @click.stop="toggleAvatarMenu" :title="'用户菜单'">
              <span class="chip-avatar">{{ userInitial }}</span>
              <span class="chip-text">
                <strong>{{ auth.user?.name || "未登录用户" }}</strong>
                <small>{{ topUserMeta }}</small>
              </span>
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
  flex: 0 0 230px;
  width: 230px;
  min-width: 230px;
  height: 100vh;
  overflow: hidden;
  color: #eef4ff;
  padding: 28px 18px;
  background: linear-gradient(180deg, #0f2745, #1a3d66);
  isolation: isolate;
}

.sidebar-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(0.5px);
}

.glow-a {
  width: 160px;
  height: 160px;
  left: -46px;
  top: -32px;
  background: radial-gradient(circle at center, rgba(93, 138, 220, 0.42), rgba(93, 138, 220, 0));
}

.glow-b {
  width: 190px;
  height: 190px;
  right: -84px;
  top: 200px;
  background: radial-gradient(circle at center, rgba(86, 194, 255, 0.24), rgba(86, 194, 255, 0));
}

.glow-c {
  width: 220px;
  height: 220px;
  left: -90px;
  bottom: -80px;
  background: radial-gradient(circle at center, rgba(129, 111, 255, 0.18), rgba(129, 111, 255, 0));
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

.sidebar-accent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 16px;
}

.sidebar-accent span {
  display: inline-block;
  border-radius: 999px;
  background: rgba(220, 236, 255, 0.74);
}

.sidebar-accent span:nth-child(1) {
  width: 20px;
  height: 4px;
}

.sidebar-accent span:nth-child(2) {
  width: 6px;
  height: 6px;
}

.sidebar-accent span:nth-child(3) {
  width: 10px;
  height: 3px;
  opacity: 0.8;
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
  position: relative;
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
  transition: transform 0.16s ease, background-color 0.16s ease;
}

.menu-item::before {
  content: "";
  position: absolute;
  left: -4px;
  top: 50%;
  width: 3px;
  height: 0;
  border-radius: 999px;
  background: #84c5ff;
  transform: translateY(-50%);
  transition: height 0.16s ease;
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
  transform: translateX(2px);
}

.menu-item.active::before {
  height: 22px;
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
  border-radius: 0;
  margin-top: 12px;
  padding: 8px 2px;
  color: #eef4ff;
  background: transparent;
  cursor: pointer;
}

.profile-entry.active,
.profile-entry:hover {
  background: transparent;
  opacity: 0.9;
}

.sidebar-divider {
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  margin-top: 6px;
}

.profile-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 50%;
  font-size: 19px;
  font-weight: 700;
  color: #eef4ff;
  background: linear-gradient(135deg, #6f80ff, #5d63f0);
}

.profile-text {
  display: grid;
  text-align: left;
  line-height: 1.2;
}

.profile-text strong {
  font-size: 18px;
}

.profile-text small {
  margin-top: 2px;
  color: #c6d7ee;
  font-size: 13px;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #dce4f2;
  background: linear-gradient(180deg, #ffffff, #f9fbff);
}

.topbar-left {
  display: grid;
  gap: 2px;
}

.title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-row strong {
  letter-spacing: 0.01em;
}

.title-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5d84d9, #4fd0c6);
  box-shadow: 0 0 0 4px rgba(79, 208, 198, 0.12);
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

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 0;
  padding: 0;
  color: #2f4664;
  background: transparent;
  cursor: pointer;
}

.chip-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 700;
  color: #eef4ff;
  background: linear-gradient(135deg, #6f80ff, #5d63f0);
}

.chip-text {
  display: grid;
  text-align: left;
  line-height: 1.2;
}

.chip-text strong {
  font-size: 14px;
  color: #23344c;
}

.chip-text small {
  margin-top: 1px;
  color: #6f829d;
  font-size: 12px;
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
