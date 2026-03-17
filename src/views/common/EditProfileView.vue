<script setup>
import { onBeforeUnmount, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";
import { userApi } from "../../services/api";

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  name: auth.user?.name || "",
  avatar: auth.user?.avatar || "/img/avatar.png",
  bio: auth.user?.bio || "",
  email: auth.user?.email || "",
  emailCode: "",
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const fileInputRef = ref(null);
const verifyingEmail = ref(false);
const localEmailVerified = ref(Number(auth.user?.emailVerified ?? 0) === 1);
const codeCountdown = ref(0);
let codeTimer = null;

function chooseAvatar() {
  fileInputRef.value?.click();
}

function onAvatarChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请选择图片文件作为头像");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.avatar = String(reader.result || "/img/avatar.png");
  };
  reader.readAsDataURL(file);
}

function startCodeCountdown() {
  codeCountdown.value = 60;
  if (codeTimer) clearInterval(codeTimer);
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer);
      codeTimer = null;
      codeCountdown.value = 0;
    }
  }, 1000);
}

function sendEmailCode() {
  if (!auth.user?.id) return;
  const email = form.email.trim();
  if (!email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(email)) {
    ElMessage.warning("邮箱格式不正确");
    return;
  }
  if (codeCountdown.value > 0) return;
  startCodeCountdown();
  ElMessage.success("验证码已发送，请留意邮箱");
  userApi.sendEmailCode(auth.user.id, email);
}

async function verifyEmail() {
  if (!auth.user?.id) return;
  if (!form.email.trim() || !form.emailCode.trim()) {
    ElMessage.warning("请填写邮箱和验证码");
    return;
  }
  verifyingEmail.value = true;
  try {
    const res = await userApi.verifyEmail(auth.user.id, form.email.trim(), form.emailCode.trim());
    if (res?.code !== 200) throw new Error(res?.message || "验证失败");
    localEmailVerified.value = true;
    auth.updateProfile({ email: form.email.trim(), emailVerified: 1 });
    ElMessage.success("邮箱验证成功");
  } catch (error) {
    ElMessage.error(error?.message || "邮箱验证失败");
  } finally {
    verifyingEmail.value = false;
  }
}

async function onSave() {
  if (!auth.user?.id) {
    ElMessage.error("请先登录");
    return;
  }
  if (!form.name.trim()) {
    ElMessage.error("用户名不能为空");
    return;
  }

  const profilePayload = {
    name: form.name.trim(),
    avatar: form.avatar,
    bio: form.bio.trim(),
    email: form.email.trim(),
    emailVerified: localEmailVerified.value ? 1 : 0
  };

  const hasAnyPasswordInput =
    form.oldPassword.trim() || form.newPassword.trim() || form.confirmPassword.trim();
  if (hasAnyPasswordInput) {
    if (!form.oldPassword.trim() || !form.newPassword.trim() || !form.confirmPassword.trim()) {
      ElMessage.error("修改密码时需填写原密码和两次新密码");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      ElMessage.error("两次新密码不一致");
      return;
    }
  }

  try {
    const profileRes = await userApi.updateProfile(auth.user.id, profilePayload);
    if (profileRes?.code !== 200) {
      ElMessage.error(profileRes?.message || "个人资料更新失败");
      return;
    }

    if (hasAnyPasswordInput) {
      const pwdRes = await userApi.changePassword(auth.user.id, {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      if (pwdRes?.code !== 200) {
        ElMessage.error(pwdRes?.message || "密码修改失败");
        return;
      }
    }

    auth.updateProfile(profilePayload);
    ElMessage.success(hasAnyPasswordInput ? "个人资料和密码已更新" : "个人资料已更新");
    router.back();
  } catch (error) {
    ElMessage.error(error?.message || "保存失败");
  }
}

function onCancel() {
  router.back();
}

function onNameBlur() {
  if (!form.name.trim()) {
    ElMessage.warning("用户名不能为空");
  }
}

onBeforeUnmount(() => {
  if (codeTimer) clearInterval(codeTimer);
});
</script>

<template>
  <section class="edit-profile-page">
    <div class="card">
      <div class="avatar-row">
        <img class="avatar" :src="form.avatar || '/img/avatar.png'" alt="头像" />
      </div>

      <label>
        用户名
        <el-input v-model.trim="form.name" placeholder="请输入用户名" @blur="onNameBlur" />
      </label>

      <label>
        个人介绍
        <textarea v-model="form.bio" rows="4" placeholder="介绍一下自己"></textarea>
      </label>

      <label>
        原密码
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="修改密码时必填" />
      </label>

      <label>
        新密码
        <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
      </label>

      <label>
        邮箱
        <el-input v-model.trim="form.email" placeholder="请输入邮箱地址" />
      </label>

      <label>
        邮箱验证码
        <div class="email-row">
          <el-input v-model.trim="form.emailCode" placeholder="输入验证码" />
          <button
            type="button"
            class="btn ghost mini"
            :disabled="codeCountdown > 0"
            @click="sendEmailCode"
          >
            {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : "发送验证码" }}
          </button>
          <button
            type="button"
            class="btn mini"
            :disabled="verifyingEmail || localEmailVerified"
            @click="verifyEmail"
          >
            {{ localEmailVerified ? "已验证" : verifyingEmail ? "验证中" : "验证邮箱" }}
          </button>
        </div>
      </label>

      <label>
        确认新密码
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </label>

      <div class="actions">
        <button type="button" class="btn ghost" @click="onCancel">取消</button>
        <button type="button" class="btn" @click="onSave">保存</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  border: 1px solid #dce6f5;
  border-radius: 14px;
  padding: 18px;
  background: #fff;
}
.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #d5deed;
}
label {
  display: block;
  margin-top: 12px;
  color: #3b4e68;
  font-size: 14px;
}
textarea {
  width: 100%;
  margin-top: 6px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 9px 11px;
}
:deep(.el-input) {
  margin-top: 6px;
}
.actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.email-row {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.mini {
  padding: 8px 10px;
  white-space: nowrap;
}
.btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  color: #fff;
  background: #2f5a90;
  cursor: pointer;
}
.btn.ghost {
  border: 1px solid #c7d7ef;
  color: #2f4e74;
  background: #fff;
}
.hidden {
  display: none;
}
</style>
