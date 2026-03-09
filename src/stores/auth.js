import { computed, ref } from "vue";
import { defineStore } from "pinia";

const TOKEN_KEY = "trade-token";
const USER_KEY = "trade-user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || "");
  const user = ref(loadUser());

  const isLoggedIn = computed(() => Boolean(token.value));
  const canDailyCheckIn = computed(() => {
    if (!user.value || user.value.role === "admin") return false;
    return user.value.lastCheckInDate !== getTodayLocal();
  });

  function loadUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function login(form) {
    const role = form.account?.includes("admin") ? "admin" : "user";
    token.value = `token-${Date.now()}`;
    user.value = {
      id: role === "admin" ? 1 : 1001,
      name: role === "admin" ? "平台管理员" : "普通用户",
      role,
      points: role === "admin" ? 0 : 1800,
      avatar: "/img/avatar.png",
      bio: "",
      password: form.password,
      lastCheckInDate: ""
    };

    localStorage.setItem(TOKEN_KEY, token.value);
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  }

  function updateProfile(payload) {
    if (!user.value) return;
    user.value = {
      ...user.value,
      ...payload
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  }

  function logout() {
    token.value = "";
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getTodayLocal() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function dailyCheckIn() {
    if (!user.value || user.value.role === "admin") {
      return { ok: false, reason: "forbidden" };
    }
    const today = getTodayLocal();
    if (user.value.lastCheckInDate === today) {
      return { ok: false, reason: "already" };
    }
    user.value = {
      ...user.value,
      points: (user.value.points ?? 0) + 10,
      lastCheckInDate: today
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    return { ok: true, points: user.value.points };
  }

  return {
    token,
    user,
    isLoggedIn,
    canDailyCheckIn,
    login,
    updateProfile,
    dailyCheckIn,
    logout
  };
});
