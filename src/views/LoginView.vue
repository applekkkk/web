<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const error = ref("");
const loading = ref(false);

const form = reactive({
  account: "",
  password: ""
});

async function onSubmit() {
  error.value = "";
  if (!form.account || !form.password) {
    error.value = "请输入账号和密码";
    return;
  }

  loading.value = true;
  try {
    auth.login(form);
    const redirect = route.query.redirect;
    if (typeof redirect === "string") {
      router.push(redirect);
      return;
    }
    router.push(auth.user?.role === "admin" ? "/admin" : "/user");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-card">
      <h1>在线数据交易平台</h1>
      <p>Web 端系统入口</p>
      <form @submit.prevent="onSubmit">
        <label>
          账号
          <input v-model.trim="form.account" placeholder="输入 user001 或 admin001" />
        </label>
        <label>
          密码
          <input v-model.trim="form.password" type="password" placeholder="任意非空密码" />
        </label>
        <button :disabled="loading" type="submit">{{ loading ? "登录中..." : "登录" }}</button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="tips">账号包含 admin 将进入管理端，否则进入用户端。</div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border: 1px solid #dce3ef;
  border-radius: 16px;
  padding: 26px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 35px rgba(28, 54, 92, 0.12);
}

h1 {
  margin: 0;
  font-size: 24px;
}

p {
  margin: 8px 0 18px;
  color: #6b7f99;
}

label {
  display: block;
  margin-bottom: 14px;
  font-size: 13px;
}

input {
  width: 100%;
  margin-top: 6px;
  border: 1px solid #cbd7eb;
  border-radius: 8px;
  padding: 10px 12px;
}

button {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 11px 14px;
  color: #fff;
  font-size: 14px;
  background: #24558f;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin-top: 10px;
  color: #b42318;
  font-size: 13px;
}

.tips {
  margin-top: 14px;
  color: #79869b;
  font-size: 12px;
}
</style>
