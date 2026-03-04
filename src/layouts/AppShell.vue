<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isAdmin = computed(() => route.path.startsWith("/admin"));
const title = computed(() => (isAdmin.value ? "管理端" : "用户端"));

const userMenus = [
  { to: "/user/dashboard", label: "工作台" },
  { to: "/user/market", label: "数据市场" },
  { to: "/user/upload", label: "上传管理" },
  { to: "/user/orders", label: "交易订单" },
  { to: "/user/wallet", label: "积分结算" },
  { to: "/user/warehouse", label: "个人仓库" },
  { to: "/user/custom-requests", label: "需求发布" },
  { to: "/user/custom-bids", label: "需求承接" },
  { to: "/user/processing", label: "数据处理" },
  { to: "/user/analytics", label: "分析展示" }
];

const adminMenus = [
  { to: "/admin/dashboard", label: "管理概览" },
  { to: "/admin/review", label: "数据审核" },
  { to: "/admin/users", label: "用户管理" },
  { to: "/admin/orders", label: "订单监管" }
];

const menus = computed(() => (isAdmin.value ? adminMenus : userMenus));

function isActive(path) {
  return route.path === path;
}

function navigate(path) {
  if (route.path !== path) router.push(path);
}

function handleLogout() {
  auth.logout();
  router.push("/login");
}
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
          <div class="sub">欢迎，{{ auth.user?.name }}</div>
        </div>
        <button class="logout" @click="handleLogout">退出登录</button>
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
  margin-bottom: 8px;
  border: none;
  border-radius: 8px;
  padding: 9px 10px;
  color: inherit;
  font-size: 14px;
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

.logout {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  background: #345d92;
  cursor: pointer;
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
