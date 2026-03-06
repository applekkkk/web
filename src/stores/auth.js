import { computed, ref } from "vue";
import { defineStore } from "pinia";

const TOKEN_KEY = "trade-token";
const USER_KEY = "trade-user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || "");
  const user = ref(loadUser());

  const isLoggedIn = computed(() => Boolean(token.value));

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
      password: form.password
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

  return {
    token,
    user,
    isLoggedIn,
    login,
    updateProfile,
    logout
  };
});
