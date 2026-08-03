<template>
  <header class="domain-top-nav" ref="navRef">
    <div class="nav-inner">
      <div class="brand" @click="emit('home')">
        <div class="brand-text">
          <div class="title">{{ title }}</div>
          <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <nav class="menu">
        <div
          class="menu-item"
          :class="{ active: homeActive }"
          @click="onHomeClick"
        >
          首页
        </div>
        <div
          v-for="item in nav"
          :key="item.key"
          class="menu-item"
          :class="{ open: openKey === item.key }"
          @mouseenter="onItemEnter(item)"
          @mouseleave="onItemLeave"
        >
          <span class="menu-label" @click.stop="onGroupClick(item)">
            {{ item.label }}
            <span v-if="item.children?.length" class="arrow">▾</span>
          </span>
          <div
            v-if="item.children?.length && openKey === item.key"
            class="dropdown"
            @mouseenter="onDropdownEnter"
            @mouseleave="onItemLeave"
          >
            <a
              v-for="child in item.children"
              :key="child.key"
              href="javascript:void(0)"
              class="dropdown-item"
              @click.prevent="openSystem(child.label, child.url)"
            >
              {{ child.label }}
            </a>
          </div>
        </div>
      </nav>

      <div class="nav-right">
        <system-search :systems="systems" @open="openSystem" />
        <el-button link type="primary" class="back-link" @click="goWorkbench">
          综合工作台
        </el-button>
        <el-dropdown trigger="click" @command="onUserCommand" class="user-dropdown">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">
              {{ displayName }}
            </el-avatar>
            <span class="user-name">{{ user?.full_name || user?.username || '用户' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-icon><User /></el-icon>
                {{ user?.username || '用户' }}
              </el-dropdown-item>
              <el-dropdown-item disabled v-if="user?.email">
                <el-icon><Message /></el-icon>
                {{ user.email }}
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts" name="DomainTopNav">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { User, Message, SwitchButton } from '@element-plus/icons-vue'
import type { DomainNavItem, DomainSystemItem } from '@/types/api/domain-workbench'
import SystemSearch from './SystemSearch.vue'
import { useAuth } from '@/composables/auth'

defineProps<{
  title: string
  subtitle?: string
  nav: DomainNavItem[]
  systems: DomainSystemItem[]
  homeActive?: boolean
}>()

const emit = defineEmits<{
  home: []
  openSystem: [name: string, url?: string]
}>()

const router = useRouter()
const { user, logout } = useAuth()
const openKey = ref('')
const navRef = ref<HTMLElement | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const displayName = computed(() => {
  const name = user.value?.full_name || user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

async function onUserCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      logout()
      ElMessage.success('已退出登录')
      router.replace('/login')
    } catch {
      // 用户取消
    }
  }
}

function clearLeaveTimer(): void {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function openSystem(name: string, url?: string): void {
  openKey.value = ''
  if (url && url.startsWith('/')) {
    router.push(url)
  } else {
    emit('openSystem', name, url)
  }
}

function onHomeClick(): void {
  openKey.value = ''
  emit('home')
}

function onItemEnter(item: DomainNavItem): void {
  clearLeaveTimer()
  if (item.children?.length) {
    openKey.value = item.key
  }
}

function onDropdownEnter(): void {
  clearLeaveTimer()
}

function onItemLeave(): void {
  clearLeaveTimer()
  // 短暂延迟，避免移入下拉时闪断
  leaveTimer = setTimeout(() => {
    openKey.value = ''
  }, 120)
}

function onGroupClick(item: DomainNavItem): void {
  if (item.children?.length) {
    openKey.value = openKey.value === item.key ? '' : item.key
    return
  }
  openSystem(item.label, item.url)
}

function goWorkbench(): void {
  router.push('/workbench')
}

function onDocClick(e: MouseEvent): void {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    openKey.value = ''
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  clearLeaveTimer()
})
</script>

<style lang="scss" scoped>
.domain-top-nav {
  background: linear-gradient(135deg, #1a3a6b 0%, #1e5799 50%, #2073b5 100%);
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  position: sticky;
  top: 0;
  /* 高于主内容区卡片，避免下拉被盖住 */
  z-index: 2000;
  overflow: visible;
}

.nav-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: visible;
  position: relative;
}

.brand {
  cursor: pointer;
  flex-shrink: 0;
  min-width: 160px;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 1px;
  }
}

.menu {
  display: flex;
  align-items: stretch;
  height: 100%;
  flex: 1;
  min-width: 0;
  /* 禁止 overflow-x:auto，否则会裁切下拉并出现滚动条 */
  overflow: visible;
}

.menu-item {
  position: relative;
  height: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  flex-shrink: 0;

  &:hover,
  &.active,
  &.open {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
  }

  &.active {
    border-bottom-color: #fff;
    font-weight: 500;
  }

  .menu-label {
    display: inline-flex;
    align-items: center;
  }

  .arrow {
    font-size: 10px;
    margin-left: 2px;
  }
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  z-index: 2100;
}

.dropdown-item {
  display: block;
  padding: 10px 16px;
  font-size: 13px;
  color: #1d2129;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: #e8f3ff;
    color: #165dff;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.back-link {
  font-size: 13px;
  /* 深蓝渐变背景上保持白色文字 */
  --el-color-primary: #fff;
}

.user-dropdown {
  margin-left: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

.user-avatar {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.user-name {
  font-size: 13px;
  color: #fff;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
