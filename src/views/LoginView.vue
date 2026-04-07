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
    router.push(auth.user?.role === "admin" ? "/admin" : "/user/data-market");
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
    <div class="login-board">
      <section class="login-visual">
        <div class="visual-bg-grid"></div>
        <span class="visual-badge">数据交易平台</span>
        <h1>数据价值，加速流通</h1>
        <p>数据交易、任务定制、智能分析，一站式完成。</p>

        <div class="visual-ornaments" aria-hidden="true">
          <div class="orb orb-a"></div>
          <div class="orb orb-b"></div>
          <div class="orb orb-c"></div>
          <div class="chip chip-main">AI</div>
          <div class="chip chip-sub">DATA</div>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <h2>{{ isRegister ? "新用户注册" : "账号登录" }}</h2>

          <form @submit.prevent="onSubmit">
            <label>
              <span class="label-text">{{ isRegister ? "用户名" : "账号" }}</span>
              <input v-model.trim="form.account" :placeholder="isRegister ? '请输入用户名' : '请输入账号'" />
            </label>

            <label v-if="isRegister">
              <span class="label-text">邮箱</span>
              <input v-model.trim="form.email" type="email" placeholder="请输入邮箱" />
            </label>

            <label v-if="isRegister">
              <span class="label-text">邮箱验证码</span>
              <div class="code-row">
                <input v-model.trim="form.emailCode" placeholder="输入验证码" />
                <button class="code-btn" type="button" :disabled="codeCountdown > 0" @click="sendRegisterCode">
                  {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : "发送验证码" }}
                </button>
              </div>
            </label>

            <label>
              <span class="label-text">密码</span>
              <div class="password-field">
                <input
                  v-model.trim="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
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
              <span class="label-text">确认密码</span>
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

            <button :disabled="loading" type="submit" class="submit-btn">
              {{ loading ? (isRegister ? "注册中..." : "登录中...") : isRegister ? "注册" : "登录" }}
            </button>
          </form>

          <button class="link-btn" type="button" @click="toggleMode">
            {{ isRegister ? "已有账号？去登录" : "没有账号？去注册" }}
          </button>

          <div v-if="error" class="error">{{ error }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background: radial-gradient(circle at 20% 12%, #dfe8ff 0%, #edf2ff 42%, #f2f5fb 100%);
}

.login-board {
  width: min(1160px, 100%);
  min-height: min(760px, calc(100vh - 56px));
  border-radius: 26px;
  border: 1px solid #dbe5f5;
  background: #f4f7ff;
  box-shadow: 0 24px 64px rgba(37, 63, 117, 0.14);
  display: grid;
  grid-template-columns: 1.18fr 0.82fr;
  overflow: hidden;
}

.login-visual {
  position: relative;
  padding: 72px 64px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(236, 242, 255, 0.88), rgba(227, 236, 255, 0.95));
}

.visual-bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(to right, rgba(76, 107, 178, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(76, 107, 178, 0.08) 1px, transparent 1px);
  background-size: 88px 88px;
  pointer-events: none;
}

.visual-badge,
.login-visual h1,
.login-visual p,
.visual-ornaments {
  position: relative;
  z-index: 1;
}

.visual-badge {
  display: inline-flex;
  align-items: center;
  height: 36px;
  border-radius: 999px;
  background: rgba(55, 96, 186, 0.12);
  color: #335d9a;
  border: 1px solid rgba(68, 109, 201, 0.2);
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.login-visual h1 {
  margin: 20px 0 0;
  font-size: clamp(30px, 4vw, 56px);
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: #18345d;
  max-width: 560px;
}

.login-visual p {
  margin: 22px 0 0;
  font-size: 22px;
  line-height: 1.5;
  color: #3f5d8c;
  max-width: 540px;
}

.visual-ornaments {
  margin-top: 58px;
  height: 320px;
  position: relative;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(0.2px);
}

.orb-a {
  width: 280px;
  height: 280px;
  left: 24px;
  top: 16px;
  background: radial-gradient(circle at 35% 35%, rgba(129, 111, 255, 0.7), rgba(129, 111, 255, 0.06));
}

.orb-b {
  width: 220px;
  height: 220px;
  right: 60px;
  top: 52px;
  background: radial-gradient(circle at 30% 30%, rgba(80, 166, 255, 0.58), rgba(80, 166, 255, 0.08));
}

.orb-c {
  width: 170px;
  height: 170px;
  left: 220px;
  top: 154px;
  background: radial-gradient(circle at 30% 30%, rgba(70, 225, 193, 0.45), rgba(70, 225, 193, 0.08));
}

.chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #f6fbff;
}

.chip-main {
  left: 146px;
  top: 94px;
  width: 170px;
  height: 108px;
  font-size: 38px;
  background: linear-gradient(135deg, #5f84ff, #6f56df);
  box-shadow: 0 18px 30px rgba(80, 95, 172, 0.35);
}

.chip-sub {
  left: 342px;
  top: 154px;
  width: 150px;
  height: 76px;
  font-size: 28px;
  background: linear-gradient(135deg, #4099f5, #50d1ff);
  box-shadow: 0 16px 24px rgba(63, 145, 225, 0.3);
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 28px;
  background: linear-gradient(180deg, rgba(244, 247, 255, 0.72), rgba(255, 255, 255, 0.92));
}

.login-card {
  width: min(430px, 100%);
  border-radius: 18px;
  border: 1px solid #d6e0f1;
  background: #fff;
  padding: 30px 26px 24px;
  box-shadow: 0 14px 34px rgba(35, 56, 93, 0.13);
}

.login-card h2 {
  margin: 0 0 20px;
  text-align: center;
  color: #1f3659;
  font-size: 34px;
  font-weight: 700;
}

label {
  display: block;
  margin-bottom: 14px;
}

.label-text {
  display: inline-block;
  color: #3d5680;
  font-size: 14px;
  margin-bottom: 6px;
}

input {
  width: 100%;
  border: 1px solid #c6d5ef;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 14px;
  color: #1e3558;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #4e84da;
  box-shadow: 0 0 0 3px rgba(76, 129, 216, 0.14);
}

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.code-btn {
  width: auto;
  border: 1px solid #c7d6ef;
  border-radius: 10px;
  padding: 0 12px;
  min-width: 108px;
  background: #f8fbff;
  color: #3a6097;
  cursor: pointer;
  font-size: 13px;
}

.code-btn:disabled {
  color: #8ea5c6;
  cursor: not-allowed;
}

.password-field {
  position: relative;
}

.password-field input {
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
  color: #6f86a8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.submit-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 11px 14px;
  margin-top: 4px;
  color: #fff;
  font-size: 15px;
  background: linear-gradient(135deg, #3f7ee6, #2f66c6);
  cursor: pointer;
}

.submit-btn:disabled {
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

@media (max-width: 980px) {
  .login-page {
    padding: 14px;
  }

  .login-board {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .login-visual {
    padding: 34px 24px;
  }

  .login-visual p {
    font-size: 16px;
    max-width: 100%;
  }

  .visual-ornaments {
    height: 170px;
    margin-top: 24px;
  }

  .orb-a,
  .orb-b,
  .orb-c {
    transform: scale(0.7);
    transform-origin: left top;
  }

  .chip-main {
    left: 92px;
    top: 62px;
    width: 120px;
    height: 72px;
    font-size: 24px;
  }

  .chip-sub {
    left: 228px;
    top: 104px;
    width: 100px;
    height: 56px;
    font-size: 20px;
  }

  .login-panel {
    padding: 16px;
  }

  .login-card h2 {
    font-size: 28px;
  }
}
</style>
