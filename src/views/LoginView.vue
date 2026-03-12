<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { authApi } from "@/services/api";
import { ElMessage } from "element-plus";
import { View, Hide } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const error = ref("");
const loading = ref(false);
const isRegister = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  account: "",
  password: "",
  confirmPassword: ""
});

function resetForm() {
  form.account = "";
  form.password = "";
  form.confirmPassword = "";
  error.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
}

function toggleMode() {
  isRegister.value = !isRegister.value;
  resetForm();
}

async function onSubmit() {
  error.value = "";

  if (isRegister.value) {
    if (!form.account || !form.password || !form.confirmPassword) {
      error.value = "请输入用户名和两次密码";
      return;
    }
    if (form.password !== form.confirmPassword) {
      error.value = "两次输入的密码不一致";
      return;
    }
    try {
      const res = await authApi.register({ username: form.account, password: form.password, confirmPassword:form.confirmPassword });
      if (res.code === 200) {
        ElMessage.success("注册成功，请使用该账号登录");
        // 回到登录模式，并保留刚注册的账号密码用于自动填充
        isRegister.value = false;
        error.value = "";
        // 清空确认密码和显示状态
        form.confirmPassword = "";
        showConfirmPassword.value = false;
      } else {
        const msg = res.message || "注册失败，请稍后再试";
        error.value = msg;
        ElMessage.error(msg);
      }
    } catch (e) {
      const msg = e.message || "注册失败，请稍后再试";
      error.value = msg;
      ElMessage.error(msg);
    }
    return;
  }

  if (!form.account || !form.password) {
    error.value = "请输入账号和密码";
    return;
  }

  loading.value = true;
  try {
    await auth.login({ account: form.account, password: form.password });
    ElMessage.success("登录成功");

    const redirect = route.query.redirect;
    if (typeof redirect === "string" && redirect) {
      router.push(redirect);
      return;
    }
    router.push(auth.user?.role === "admin" ? "/admin" : "/user/market");
  } catch (e) {
    const msg = e?.message || "登录失败，请稍后再试";
    error.value = msg;
    ElMessage.error(msg);

  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-card">
      <h1>在线数据交易平台</h1>
      <p v-if="!isRegister">Web 端系统入口</p>
      <p v-else>新用户注册</p>
      <form @submit.prevent="onSubmit">
        <label>
          <span v-if="!isRegister">账号</span>
          <span v-else>用户名</span>
          <input
            v-model.trim="form.account"
            :placeholder="isRegister ? '请输入用户名' : '输入 user001 或 admin001'"
          />
        </label>
        <label>
          密码
          <div class="password-field">
            <input
              v-model.trim="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="isRegister ? '请输入密码' : '任意非空密码'"
            />
            <button
              type="button"
              class="eye-btn"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <el-icon>
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </button>
          </div>
        </label>
        <label v-if="isRegister">
          确认密码
          <div class="password-field">
            <input
              v-model.trim="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
            />
            <button
              type="button"
              class="eye-btn"
              :aria-label="showConfirmPassword ? '隐藏密码' : '显示密码'"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <el-icon>
                <View v-if="showConfirmPassword" />
                <Hide v-else />
              </el-icon>
            </button>
          </div>
        </label>
        <button :disabled="loading" type="submit">
          {{ loading ? (isRegister ? "注册中..." : "登录中...") : (isRegister ? "注册" : "登录") }}
        </button>
      </form>
      <button class="link-btn" type="button" @click="toggleMode">
        {{ isRegister ? "已有账号？去登录" : "没有账号？去注册" }}
      </button>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="tips" v-if="!isRegister">账号包含 admin 将进入管理端，否则进入用户端。</div>
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

.password-field {
  position: relative;
  width: 100%;
  margin-top: 6px;   /* 加这一行 */
}

/* 同时把 password-field 里的 input 的 margin-top 去掉，避免双重间距 */
.password-field input {
  margin-top: 0;     /* 加这一行 */
  padding-right: 42px;
}
.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: auto;          /* 加这一行，覆盖全局 button { width: 100% } */
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: #6b7f99;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.link-btn {
  margin-top: 10px;
  width: 100%;
  border: none;
  background: transparent;
  color: #24558f;
  font-size: 13px;
  cursor: pointer;
  text-align: right;
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
