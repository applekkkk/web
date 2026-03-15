<script setup>
import { reactive, ref } from "vue";
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
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const fileInputRef = ref(null);

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
    bio: form.bio.trim()
  };

  const hasAnyPasswordInput =
    form.oldPassword.trim() || form.newPassword.trim() || form.confirmPassword.trim();
  if (hasAnyPasswordInput) {
    if (!form.oldPassword.trim() || !form.newPassword.trim() || !form.confirmPassword.trim()) {
      ElMessage.error("修改密码时需填写旧密码和两次新密码");
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

</script>

<template>
  <section class="edit-profile-page">
    <div class="card">
      <div class="avatar-row">
        <img class="avatar" :src="form.avatar || '/img/avatar.png'" alt="头像" />
        <div>
          <button type="button" class="btn ghost" @click="chooseAvatar">更换头像</button>
          <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="onAvatarChange" />
        </div>
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
        旧密码
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="修改密码时必填"
        />
      </label>

      <label>
        新密码
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
        />
      </label>

      <label>
        确认新密码
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </label>

      <div class="actions">
        <button type="button" class="btn ghost" @click="onCancel">取消</button>
        <button type="button" class="btn" @click="onSave">保存</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.edit-profile-page {
}

h1 {
  margin: 0 0 14px;
  color: #1f2f47;
  font-size: 26px;
}

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

input {
  width: 100%;
  margin-top: 6px;
  border: 1px solid #cad6ea;
  border-radius: 8px;
  padding: 9px 11px;
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
