<script setup>
import { onBeforeUnmount, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { View, Hide } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { authApi } from "@/services/api";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const error = ref("");
const loading = ref(false);
const isRegister = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const codeCountdown = ref(0);
let countdownTimer = null;

const form = reactive({
  account: "",
  password: "",
  confirmPassword: "",
  email: "",
  emailCode: ""
});

function resetForm() {
  form.account = "";
  form.password = "";
  form.confirmPassword = "";
  form.email = "";
  form.emailCode = "";
  error.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
  stopCodeCountdown();
}

function toggleMode() {
  isRegister.value = !isRegister.value;
  resetForm();
}

function stopCodeCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  codeCountdown.value = 0;
}

function startCodeCountdown() {
  stopCodeCountdown();
  codeCountdown.value = 60;
  countdownTimer = setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      stopCodeCountdown();
    }
  }, 1000);
}

function isValidEmail(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

function sendRegisterCode() {
  const email = form.email.trim();
  if (!email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  if (!isValidEmail(email)) {
    ElMessage.warning("邮箱格式不正确");
    return;
  }
  if (codeCountdown.value > 0) return;
  startCodeCountdown();
  ElMessage.success("验证码已发送，请查收邮箱");
  authApi.sendRegisterEmailCode(email).catch((e) => {
    console.error("send register email code failed", e);
  });
}

async function onSubmit() {
  error.value = "";

  if (isRegister.value) {
    if (!form.account || !form.password || !form.confirmPassword || !form.email || !form.emailCode) {
      error.value = "请完整填写注册信息";
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      error.value = "邮箱格式不正确";
      return;
    }
    if (form.password !== form.confirmPassword) {
      error.value = "两次输入的密码不一致";
      return;
    }

    loading.value = true;
    try {
      const res = await authApi.register({
        username: form.account.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        email: form.email.trim(),
        emailCode: form.emailCode.trim()
      });
      if (res?.code !== 200) {
        throw new Error(res?.message || "注册失败，请稍后重试");
      }
      ElMessage.success("注册成功，请登录");
      isRegister.value = false;
      form.password = "";
      form.confirmPassword = "";
      form.email = "";
      form.emailCode = "";
      showPassword.value = false;
      showConfirmPassword.value = false;
      stopCodeCountdown();
      return;
    } catch (e) {
      const msg = e?.message || "注册失败，请稍后重试";
      error.value = msg;
      ElMessage.error(msg);
      return;
    } finally {
      loading.value = false;
    }
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
    const msg = e?.message || "登录失败，请稍后重试";
    error.value = msg;
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  stopCodeCountdown();
});
</script>

<template>
  <div class="login-page">
    <section class="login-card">
      <h1>数据交易平台</h1>
      <p v-if="!isRegister">账号登录</p>
      <p v-else>新用户注册</p>
      <form @submit.prevent="onSubmit">
        <label>
          <span>{{ isRegister ? "用户名" : "账号" }}</span>
          <input
            v-model.trim="form.account"
            :placeholder="isRegister ? '请输入用户名' : '请输入账号'"
          />
        </label>

        <label v-if="isRegister">
          邮箱
          <input v-model.trim="form.email" type="email" placeholder="请输入邮箱" />
        </label>

        <label v-if="isRegister">
          邮箱验证码
          <div class="code-row">
            <input v-model.trim="form.emailCode" placeholder="输入验证码" />
            <button
              class="code-btn"
              type="button"
              :disabled="codeCountdown > 0"
              @click="sendRegisterCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : "发送验证码" }}
            </button>
          </div>
        </label>

        <label>
          密码
          <div class="password-field">
            <input
              v-model.trim="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="isRegister ? '请输入密码' : '请输入密码'"
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

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
}

.code-row input {
  margin-top: 0;
}

.code-btn {
  width: auto;
  white-space: nowrap;
  border: 1px solid #c9d7ef;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
  color: #2d5e97;
  cursor: pointer;
}

.code-btn:disabled {
  color: #8fa4c2;
  cursor: not-allowed;
}

.password-field {
  position: relative;
  width: 100%;
  margin-top: 6px;
}

.password-field input {
  margin-top: 0;
  padding-right: 42px;
}

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: auto;
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
</style>
