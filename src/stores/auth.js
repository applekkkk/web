import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authApi, userApi } from "../services/api";

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
    const data = raw ? JSON.parse(raw) : null;
    if (!data) return null;
    if (data.role === 1 || data.role === "1") data.role = "admin";
    if (data.role === 0 || data.role === "0") data.role = "user";
    return data;
  }

  async function login(form) {
    const username = form?.account ?? form?.username ?? "";
    const password = form?.password ?? "";
    const res = await authApi.login({ username, password });
    if (res?.code !== 200) {
      throw new Error(res?.message || "登录失败");
    }
    const data = res?.data || {};
    const role = Number(data.role) === 1 ? "admin" : "user";
    if (!data.token) {
      throw new Error("登录失败");
    }
    token.value = data.token;
    user.value = {
      id: data.id,
      name: data.name || username,
      role,
      points: data.points ?? 0,
      avatar: data.avatar || "/img/avatar.png",
      bio: data.bio || "",
      password: "",
      lastCheckInDate: data.lastCheckInDate || ""
    };

    localStorage.setItem(TOKEN_KEY, token.value);
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    await refreshUser();
    return res;
  }

  async function refreshUser() {
    if (!user.value?.id) return;
    try {
      const res = await userApi.getById(user.value.id);
      if (res?.code !== 200 || !res?.data) return;
      const data = res.data;
      user.value = {
        ...user.value,
        name: data.name ?? user.value.name,
        role: Number(data.role) === 1 ? "admin" : "user",
        points: data.points ?? user.value.points,
        avatar: data.avatar || user.value.avatar,
        bio: data.bio || user.value.bio,
        lastCheckInDate: data.lastCheckInDate || ""
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    } catch {
      // keep current local user state when refresh fails
    }
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

  async function checkIn() {
    if (!user.value || user.value.role === "admin") {
      return { ok: false, reason: "forbidden" };
    }
    const today = getTodayLocal();
    if (user.value.lastCheckInDate === today) {
      return { ok: false, reason: "already" };
    }
    const res = await userApi.checkIn(user.value.id);
    if (res?.code !== 200) {
      if (String(res?.message || "").includes("已签到")) {
        user.value = {
          ...user.value,
          lastCheckInDate: today
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user.value));
        return { ok: false, reason: "already" };
      }
      return { ok: false, reason: "error", message: res?.message || "签到失败" };
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
    checkIn,
    refreshUser,
    logout
  };
});




