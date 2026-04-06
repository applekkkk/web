import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const LoginView = () => import("../views/LoginView.vue");
const AppShell = () => import("../layouts/AppShell.vue");

const userRoutes = [
  { path: "dashboard", name: "user-dashboard", component: () => import("../views/user/UserDashboardView.vue"), meta: { title: "工作台" } },
  { path: "data-market", name: "user-data-market", component: () => import("../views/user/DataMarketHubView.vue"), meta: { title: "数据市场" } },
  { path: "market", redirect: { name: "user-data-market", query: { tab: "trade" } } },
  { path: "upload", redirect: { name: "user-data-market", query: { tab: "upload" } } },
  { path: "market/:id", name: "user-market-detail", component: () => import("../views/user/DatasetDetailView.vue"), meta: { title: "数据详情" } },
  { path: "orders", name: "user-orders", component: () => import("../views/user/OrdersView.vue"), meta: { title: "交易订单" } },
  { path: "warehouse", name: "user-warehouse", component: () => import("../views/user/WarehouseView.vue"), meta: { title: "个人仓库" } },
  { path: "data-customization", name: "user-data-customization", component: () => import("../views/user/DataCustomizationHubView.vue"), meta: { title: "数据定制" } },
  { path: "custom-bids", redirect: { name: "user-data-customization", query: { tab: "accept" } } },
  { path: "custom-requests", redirect: { name: "user-data-customization", query: { tab: "publish" } } },
  { path: "custom-bids/:id", name: "user-need-detail", component: () => import("../views/user/NeedDetailView.vue"), meta: { title: "任务详情" } },
  { path: "data-analysis", name: "user-data-analysis", component: () => import("../views/user/DataAnalysisHubView.vue"), meta: { title: "数据分析" } },
  { path: "processing", redirect: { name: "user-data-analysis", query: { tab: "ai" } } },
  { path: "visualization", redirect: { name: "user-data-analysis", query: { tab: "viz" } } },
  { path: "appeals", name: "user-appeals", component: () => import("../views/user/AppealsView.vue"), meta: { title: "我的申诉" } },
  { path: "analytics", name: "user-analytics", component: () => import("../views/user/AnalyticsView.vue"), meta: { title: "分析展示" } },
  { path: "feedback", redirect: { name: "user-data-analysis" } },
  { path: "profile", name: "user-profile", component: () => import("../views/user/ProfileView.vue"), meta: { title: "个人中心" } },
  { path: "profile/edit", name: "user-profile-edit", component: () => import("../views/common/EditProfileView.vue"), meta: { title: "编辑个人资料" } }
];

const adminRoutes = [
  { path: "dashboard", redirect: { name: "admin-profile" } },
  { path: "review", name: "admin-review", component: () => import("../views/admin/ReviewView.vue"), meta: { title: "数据审核" } },
  { path: "review/:id", name: "admin-review-detail", component: () => import("../views/user/DatasetDetailView.vue"), meta: { title: "数据详情" } },
  { path: "users", name: "admin-users", component: () => import("../views/admin/UsersView.vue"), meta: { title: "用户管理" } },
  { path: "orders", name: "admin-orders", component: () => import("../views/admin/OrderMonitorView.vue"), meta: { title: "订单监控" } },
  { path: "appeals", name: "admin-appeals", component: () => import("../views/admin/AppealsManageView.vue"), meta: { title: "申诉处理" } },
  { path: "appeals/task/:id", name: "admin-appeal-task-detail", component: () => import("../views/user/NeedDetailView.vue"), meta: { title: "任务详情" } },
  { path: "messages", name: "admin-messages", component: () => import("../views/admin/MessagesView.vue"), meta: { title: "留言查看" } },
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
      children: [{ path: "", redirect: { name: "user-data-market" } }, ...userRoutes]
    },
    {
      path: "/admin",
      component: AppShell,
      meta: { requiresAuth: true, role: "admin", baseTitle: "在线数据交易平台 - 管理端" },
      children: [{ path: "", redirect: { name: "admin-profile" } }, ...adminRoutes]
    },
    { path: "/", redirect: "/login" },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: "login", query: { redirect: to.fullPath } };
  if (to.meta.role && auth.user?.role !== to.meta.role) return auth.user?.role === "admin" ? "/admin" : "/user";
  return true;
});

router.afterEach((to) => {
  const baseTitle = to.matched.find((r) => r.meta.baseTitle)?.meta.baseTitle || "在线数据交易平台";
  document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;
});

export default router;
