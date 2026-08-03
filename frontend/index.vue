<template>
  <div class="domain-workbench" v-loading="loading">
    <domain-top-nav
      v-if="config"
      :title="config.title"
      :subtitle="config.subtitle"
      :nav="config.nav"
      :systems="systems"
      :home-active="true"
      @home="scrollTop"
      @open-system="openSystem"
    />

    <main v-if="config" class="main">
      <section class="middle">
        <message-panel
          :messages="messages"
          :sources="config.messageSources"
          :date-filter="config.messageDateFilter"
          :compact-date-time="!!config.compactDateTime"
          @query="onMessageQuery"
          @open="openMessage"
        />
        <todo-panel
          :todos="todos"
          :stats="todoStats"
          :sources="config.todoSources || config.messageSources"
          :show-stats="config.todoStatsVisible !== false"
          :compact-date-time="!!config.compactDateTime"
          :rich-filters="!!config.todoRichFilters"
          @query="onTodoQuery"
          @open="openTodo"
        />
      </section>

      <section class="map-section">
        <component
          :is="config.mapComponent"
          v-bind="mapBind"
        />
      </section>
    </main>

    <el-empty v-else-if="!loading" description="未识别的领域工作台" />

    <message-detail-dialog v-model="msgVisible" :message="currentMessage" />
    <todo-handle-dialog
      v-model="todoVisible"
      :todo="currentTodo"
      :submitting="todoSubmitting"
      @submit="submitTodo"
      @open-third="openSystem"
    />
  </div>
</template>

<script setup lang="ts" name="DomainWorkbenchHome">
import { ref, computed, watch, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import DomainTopNav from './components/DomainTopNav.vue'
import MessagePanel from './components/MessagePanel.vue'
import MessageDetailDialog from './components/MessageDetailDialog.vue'
import TodoPanel from './components/TodoPanel.vue'
import TodoHandleDialog from './components/TodoHandleDialog.vue'
import { ElMessage } from 'element-plus'
import {
  getDomainTodoStats,
  handleDomainTodo,
  listDomainMessages,
  listDomainSystems,
  listDomainTodos,
  markDomainMessageRead
} from '@/api/domain-workbench'
import type {
  DomainCode,
  DomainMessage,
  DomainMessageQuery,
  DomainSystemItem,
  DomainTodo,
  DomainTodoQuery,
  DomainTodoStats
} from '@/types/api/domain-workbench'
import { getDomainConfig } from './configs'

const route = useRoute()
const { proxy } = getCurrentInstance() as any

const loading = ref(false)
const messages = ref<DomainMessage[]>([])
const todos = ref<DomainTodo[]>([])
const systems = ref<DomainSystemItem[]>([])
const todoStats = ref<DomainTodoStats>({ pending: 0, done: 0, overdue: 0 })

const msgVisible = ref(false)
const currentMessage = ref<DomainMessage | null>(null)
const todoVisible = ref(false)
const currentTodo = ref<DomainTodo | null>(null)
const todoSubmitting = ref(false)

const lastMsgQuery = ref<DomainMessageQuery>({})
const lastTodoQuery = ref<DomainTodoQuery>({})

const domainCode = computed<DomainCode | null>(() => {
  const code = (route.meta.domainCode as string) || String(route.params.domain || '')
  if (code === 'zgt' || code === 'zlt') return code
  if (route.path.endsWith('/zgt')) return 'zgt'
  if (route.path.endsWith('/zlt')) return 'zlt'
  return null
})

const config = computed(() => (domainCode.value ? getDomainConfig(domainCode.value) : null))

const mapBind = computed(() => {
  if (!config.value) return {}
  if (config.value.domainCode === 'zlt' && config.value.roadSearchPlaceholder) {
    return { placeholder: config.value.roadSearchPlaceholder }
  }
  return {}
})

function scrollTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openSystem(name: string, url?: string): void {
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener')
    return
  }
  proxy?.$modal?.msgWarning?.(`系统「${name}」入口未配置`) || ElMessage.warning(`系统「${name}」入口未配置`)
}

async function loadAll(): Promise<void> {
  if (!domainCode.value) return
  loading.value = true
  try {
    const domain = domainCode.value
    const [msgRes, todoRes, sysRes, statsRes] = await Promise.all([
      listDomainMessages(domain, lastMsgQuery.value),
      listDomainTodos(domain, lastTodoQuery.value),
      listDomainSystems(domain),
      getDomainTodoStats(domain)
    ])
    messages.value = msgRes.data || []
    todos.value = todoRes.data || []
    systems.value = sysRes.data || []
    todoStats.value = statsRes.data || { pending: 0, done: 0, overdue: 0 }
  } finally {
    loading.value = false
  }
}

async function onMessageQuery(q: DomainMessageQuery): Promise<void> {
  lastMsgQuery.value = q
  if (!domainCode.value) return
  const res = await listDomainMessages(domainCode.value, q)
  messages.value = res.data || []
}

async function onTodoQuery(q: DomainTodoQuery): Promise<void> {
  lastTodoQuery.value = q
  if (!domainCode.value) return
  const [todoRes, statsRes] = await Promise.all([
    listDomainTodos(domainCode.value, q),
    getDomainTodoStats(domainCode.value)
  ])
  todos.value = todoRes.data || []
  todoStats.value = statsRes.data || todoStats.value
}

async function openMessage(msg: DomainMessage): Promise<void> {
  currentMessage.value = msg
  msgVisible.value = true
  if (!domainCode.value || msg.status !== 'unread') return
  const res = await markDomainMessageRead(domainCode.value, msg.id)
  if (res.data) {
    currentMessage.value = res.data
    const listRes = await listDomainMessages(domainCode.value, lastMsgQuery.value)
    messages.value = listRes.data || []
  }
}

function openTodo(todo: DomainTodo): void {
  currentTodo.value = todo
  todoVisible.value = true
}

async function submitTodo(payload: { description: string; attachments: string[] }): Promise<void> {
  if (!domainCode.value || !currentTodo.value) return
  todoSubmitting.value = true
  try {
    const res = await handleDomainTodo(domainCode.value, currentTodo.value.id, {
      description: payload.description,
      attachments: payload.attachments
    })
    if (res.data) {
      currentTodo.value = res.data
      proxy?.$modal?.msgSuccess?.('办理提交成功') || ElMessage.success('办理提交成功')
      await onTodoQuery(lastTodoQuery.value)
      todoVisible.value = false
    }
  } finally {
    todoSubmitting.value = false
  }
}

watch(
  domainCode,
  (code: DomainCode | null) => {
    if (code) {
      lastMsgQuery.value = {}
      lastTodoQuery.value = {}
      loadAll()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.domain-workbench {
  min-height: 100vh;
  background: #f5f7fa;
  /* 避免祖先裁切顶栏下拉 */
  overflow: visible;
}

.main {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.middle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .middle {
    grid-template-columns: 1fr;
  }
}

.map-section {
  min-height: 200px;
}
</style>
