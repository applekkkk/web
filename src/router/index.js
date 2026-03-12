import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const LoginView = () => import("../views/LoginView.vue");
const AppShell = () => import("../layouts/AppShell.vue");

const userRoutes = [
  { path: "dashboard", name: "user-dashboard", component: () => import("../views/user/UserDashboardView.vue"), meta: { title: "工作台" } },
  { path: "market", name: "user-market", component: () => import("../views/user/MarketView.vue"), meta: { title: "数据市场" } },
  { path: "market/:id", name: "user-market-detail", component: () => import("../views/user/DatasetDetailView.vue"), meta: { title: "数据详情" } },
  { path: "upload", name: "user-upload", component: () => import("../views/user/UploadManageView.vue"), meta: { title: "上传管理" } },
  { path: "orders", name: "user-orders", component: () => import("../views/user/OrdersView.vue"), meta: { title: "交易订单" } },
  { path: "warehouse", name: "user-warehouse", component: () => import("../views/user/WarehouseView.vue"), meta: { title: "个人仓库" } },
  { path: "custom-requests", name: "user-custom-requests", component: () => import("../views/user/CustomRequestView.vue"), meta: { title: "任务发布" } },
  { path: "custom-bids", name: "user-custom-bids", component: () => import("../views/user/CustomBidsView.vue"), meta: { title: "任务市场" } },
  { path: "custom-bids/:id", name: "user-need-detail", component: () => import("../views/user/NeedDetailView.vue"), meta: { title: "任务详情" } },
  { path: "processing", name: "user-processing", component: () => import("../views/user/ProcessingView.vue"), meta: { title: "数据处理" } },
  { path: "analytics", name: "user-analytics", component: () => import("../views/user/AnalyticsView.vue"), meta: { title: "分析展示" } },
  { path: "profile", name: "user-profile", component: () => import("../views/user/ProfileView.vue"), meta: { title: "个人中心" } },
  { path: "profile/edit", name: "user-profile-edit", component: () => import("../views/common/EditProfileView.vue"), meta: { title: "编辑个人资料" } }
];

const adminRoutes = [
  { path: "dashboard", redirect: { name: "admin-profile" } },
  { path: "review", name: "admin-review", component: () => import("../views/admin/ReviewView.vue"), meta: { title: "数据审核" } },
  { path: "review/:id", name: "admin-review-detail", component: () => import("../views/user/DatasetDetailView.vue"), meta: { title: "数据详情" } },
  { path: "users", name: "admin-users", component: () => import("../views/admin/UsersView.vue"), meta: { title: "用户管理" } },
  { path: "orders", name: "admin-orders", component: () => import("../views/admin/OrderMonitorView.vue"), meta: { title: "订单监控" } },
  { path: "profile", name: "admin-profile", component: () => import("../views/admin/AdminProfileView.vue"), meta: { title: "个人中心" } },
  { path: "profile/edit", name: "admin-profile-edit", component: () => import("../views/common/EditProfileView.vue"), meta: { title: "编辑个人资料" } }
];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { public: true } },
    {
      path: "/user",
      component: AppShell,
      meta: { requiresAuth: true, role: "user", baseTitle: "在线数据交易平台 - 用户端" },
      children: [
        { path: "", redirect: { name: "user-market" } },
        ...userRoutes
      ]
    },
    {
      path: "/admin",
      component: AppShell,
      meta: { requiresAuth: true, role: "admin", baseTitle: "在线数据交易平台 - 管理端" },
      children: [
        { path: "", redirect: { name: "admin-profile" } },
        ...adminRoutes
      ]
    },
    {
      path: "/",
      redirect: "/login"
    },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.user?.role === "admin" ? "/admin" : "/user";
  }

  return true;
});

router.afterEach((to) => {
  const baseTitle = to.matched.find((r) => r.meta.baseTitle)?.meta.baseTitle || "在线数据交易平台";
  const pageTitle = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;
  document.title = pageTitle;
});

export default router;
