<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">
          <el-icon :size="40"><Lock /></el-icon>
        </div>
        <h1 class="login-title">欢迎登录</h1>
        <p class="login-subtitle">{{ isRegister ? '创建新账户' : '请输入您的账户信息' }}</p>
      </div>

      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        show-icon
        :closable="false"
        class="login-alert"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            :disabled="loading"
            autocomplete="username"
          />
        </el-form-item>

        <template v-if="isRegister">
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              :prefix-icon="Message"
              size="large"
              :disabled="loading"
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item label="姓名" prop="fullName">
            <el-input
              v-model="form.fullName"
              placeholder="请输入姓名（可选）"
              size="large"
              :disabled="loading"
              autocomplete="name"
            />
          </el-form-item>
        </template>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            :disabled="loading"
            autocomplete="current-password"
          >
            <template #suffix>
              <el-icon
                class="password-icon"
                @click="showPassword = !showPassword"
              >
                <View v-if="!showPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          native-type="submit"
        >
          {{ isRegister ? '注册' : '登录' }}
        </el-button>
      </el-form>

      <div class="login-footer">
        <el-button type="text" @click="toggleMode">
          {{ isRegister ? '已有账户？立即登录' : '还没有账户？立即注册' }}
        </el-button>
      </div>

      <div class="login-tip">
        <el-divider />
        <p class="tip-text">测试账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User, Message, View, Hide } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/auth'
import { kbRegister } from '@/lib/kb-api'

const route = useRoute()
const router = useRouter()
const { login, isAuthenticated, loading } = useAuth()

const formRef = ref<FormInstance>()
const showPassword = ref(false)
const isRegister = ref(false)
const errorMsg = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  fullName: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const redirect = () => {
  const redirectPath = (route.query.redirect as string) || '/domain/zgt'
  router.replace(redirectPath)
}

onMounted(() => {
  if (isAuthenticated.value) {
    redirect()
  }
})

function toggleMode() {
  isRegister.value = !isRegister.value
  errorMsg.value = ''
  form.email = ''
  form.fullName = ''
}

async function handleSubmit() {
  if (!formRef.value) return
  errorMsg.value = ''

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (isRegister.value) {
    try {
      await kbRegister({
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.fullName || undefined
      })
      ElMessage.success('注册成功，请登录')
      isRegister.value = false
    } catch (err: any) {
      errorMsg.value = err?.message || '注册失败，请检查输入'
    }
  } else {
    const success = await login(form.username, form.password)
    if (success) {
      ElMessage.success('登录成功')
      redirect()
    } else {
      errorMsg.value = '用户名或密码错误'
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 16px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.login-alert {
  margin-bottom: 20px;
}

.login-form {
  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    padding-bottom: 4px;
  }
}

.password-icon {
  cursor: pointer;
  color: #9ca3af;
  &:hover {
    color: #6b7280;
  }
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  &:hover {
    opacity: 0.9;
  }
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-tip {
  margin-top: 8px;
  .tip-text {
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
    margin: 0;
  }
}
</style>
