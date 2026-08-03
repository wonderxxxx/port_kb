<template>
  <div class="kb-qa-page">
    <domain-top-nav
      v-if="config"
      :title="config.title"
      :subtitle="config.subtitle"
      :nav="config.nav"
      :systems="systems"
      @home="goHome"
      @open-system="openSystem"
    />

    <!-- 登录界面 -->
    <div v-if="!isAuthenticated" class="login-container">
      <div class="login-card">
        <div class="login-header">
          <svg class="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <h2>港航智能助手</h2>
          <p>请登录以使用智能问答功能</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="loginUsername"
              type="text"
              placeholder="请输入用户名"
              :disabled="loginLoading"
              required
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input
              v-model="loginPassword"
              type="password"
              placeholder="请输入密码"
              :disabled="loginLoading"
              required
            />
          </div>
          <div v-if="loginError" class="login-error">{{ loginError }}</div>
          <button type="submit" :disabled="loginLoading" class="login-btn">
            <span v-if="loginLoading" class="loading-spinner"></span>
            {{ loginLoading ? '登录中...' : '登 录' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 主界面 -->
    <div v-else class="kb-qa-wrapper">
      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'chat' }]"
          @click="activeTab = 'chat'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          业务问答
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'search' }]"
          @click="activeTab = 'search'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          知识检索
        </button>
        <div class="tab-right">
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>

      <!-- 业务问答 -->
      <div v-show="activeTab === 'chat'" class="kb-qa-container">
        <!-- 会话列表侧边栏 -->
        <aside class="conversation-sidebar">
          <button class="new-conversation-btn" @click="createNewConversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            新建会话
          </button>
          <div class="conversation-list">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              :class="['conversation-item', { active: conv.id === currentConversationId }]"
              @click="switchConversation(conv.id)"
            >
              <div class="conv-info">
                <div class="conv-title">{{ conv.title }}</div>
                <div class="conv-time">{{ formatDate(conv.updated_at) }}</div>
              </div>
              <button class="conv-delete" @click.stop="deleteConversation(conv.id)" title="删除会话">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
            <div v-if="conversations.length === 0" class="empty-conversations">
              暂无历史会话
            </div>
          </div>
        </aside>

        <!-- 聊天主区域 -->
        <div class="chat-main">
          <div class="chat-header">
            <div class="header-left">
              <svg class="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
              </svg>
              <div class="header-info">
                <div class="bot-name">港航智能助手</div>
                <div class="bot-status">AI 在线</div>
              </div>
            </div>
          </div>

          <div class="chat-messages" ref="messagesContainer">
            <div v-if="messages.length === 0 && greeting" class="message-item assistant">
              <div class="message-content">
                <span class="message-label">AI</span>
                <p class="greeting-text">{{ greeting }}</p>
              </div>
            </div>

            <div v-for="msg in messages" :key="msg.id" :class="['message-item', msg.role]">
              <div class="message-content">
                <span v-if="msg.role === 'assistant'" class="message-label">AI</span>
                <p class="whitespace-pre-wrap">{{ msg.content }}</p>

                <!-- 参考来源 -->
                <div v-if="msg.role === 'assistant' && msg.sources && msg.sources.length" class="msg-sources">
                  <button class="sources-toggle" @click="toggleSources(msg.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    参考来源 ({{ msg.sources.length }})
                    <svg :class="['toggle-arrow', { expanded: expandedSources.has(msg.id) }]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <div v-if="expandedSources.has(msg.id)" class="sources-list">
                    <div v-for="(src, si) in msg.sources" :key="si" class="source-item">
                      <div class="source-header">
                        <span class="source-name">{{ src.document_name }}</span>
                        <span class="source-score">相关度 {{ (src.score * 100).toFixed(1) }}%</span>
                      </div>
                      <p class="source-text">{{ src.chunk_text }}</p>
                    </div>
                  </div>
                </div>

                <div class="message-footer">
                  <span class="message-time">{{ formatTime(msg.created_at) }}</span>
                  <div v-if="msg.role === 'assistant'" class="message-actions">
                    <button
                      :class="['action-icon-btn', { active: msg.feedback === 'up' }]"
                      @click="handleFeedback(msg.id, 'up')"
                      title="有帮助"
                    >👍</button>
                    <button
                      :class="['action-icon-btn', { active: msg.feedback === 'down' }]"
                      @click="handleFeedback(msg.id, 'down')"
                      title="无帮助"
                    >👎</button>
                    <button
                      class="action-icon-btn"
                      :class="{ active: speakingMsgId === msg.id }"
                      @click="toggleSpeak(msg.id, msg.content)"
                      :title="speakingMsgId === msg.id ? '停止播报' : '朗读'"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                      </svg>
                    </button>
                    <button
                      class="action-icon-btn"
                      @click="copyMessage(msg.content)"
                      title="复制"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="loading" class="message-item assistant">
              <div class="message-content">
                <span class="message-label">AI</span>
                <div class="loading-indicator">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="loading-text">AI 思考中...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷问题 -->
          <div class="quick-questions">
            <button
              v-for="q in quickQuestions"
              :key="q"
              class="quick-q-btn"
              @click="sendQuick(q)"
              :disabled="loading"
            >{{ q }}</button>
          </div>

          <!-- 输入区 -->
          <div class="chat-input">
            <textarea
              ref="textareaRef"
              v-model="inputText"
              @keydown="handleInputKeydown"
              @input="handleInput"
              :disabled="loading"
              placeholder="输入您的问题，Enter 发送，Shift+Enter 换行..."
              class="input-field"
              rows="1"
            ></textarea>
            <button
              @click="handleSend"
              :disabled="loading || !inputText.trim()"
              class="send-button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 知识检索 -->
      <div v-show="activeTab === 'search'" class="search-container">
        <div class="search-box">
          <input
            v-model="searchQuery"
            @keydown.enter="handleSearch"
            :disabled="searchLoading"
            placeholder="输入关键词检索知识库文档（法规、案例、预案等）..."
            class="search-input"
          />
          <button @click="handleSearch" :disabled="searchLoading || !searchQuery.trim()" class="search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            {{ searchLoading ? '检索中...' : '检 索' }}
          </button>
        </div>

        <!-- 快捷检索词 -->
        <div class="search-suggestions">
          <span class="suggestion-label">试试：</span>
          <button
            v-for="s in searchSuggestions"
            :key="s"
            class="suggestion-btn"
            @click="searchQuery = s; handleSearch()"
            :disabled="searchLoading"
          >{{ s }}</button>
        </div>

        <div class="search-results">
          <div v-if="searchLoading" class="search-loading">
            <div class="loading-spinner-sm"></div>
            <span>正在检索知识库...</span>
          </div>

          <template v-else-if="searchResults.length || searchAnswer">
            <!-- AI 总结 -->
            <div v-if="searchAnswer" class="result-card answer-card">
              <div class="card-header">
                <span class="card-badge ai-badge">AI</span>
                <span class="card-title">智能摘要</span>
              </div>
              <p class="answer-text whitespace-pre-wrap">{{ searchAnswer }}</p>
              <div class="card-meta">来源：知识库 · 向量检索</div>
            </div>

            <!-- 参考来源 -->
            <div v-if="searchResults.length" class="result-card sources-card">
              <div class="card-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="card-title">参考来源 ({{ searchResults.length }})</span>
              </div>
              <div class="search-sources-list">
                <div v-for="(src, si) in searchResults" :key="si" class="search-source-item">
                  <div class="source-header">
                    <span class="source-name">{{ src.document_name }}</span>
                    <span class="source-score">相关度 {{ (src.score * 100).toFixed(1) }}%</span>
                  </div>
                  <p class="source-text">{{ src.chunk_text }}</p>
                </div>
              </div>
            </div>
          </template>

          <div v-else-if="searchExecuted" class="search-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>未找到相关内容</p>
            <span>请尝试其他关键词，或先在知识库管理中上传文档</span>
          </div>

          <div v-else class="search-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>输入关键词开始检索知识库</p>
            <span>系统将基于向量检索返回最相关的文档片段</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DomainTopNav from './DomainTopNav.vue'
import { kbGetGreeting, kbChat, kbLogin, setKBToken, clearKBToken, kbGetConversations, kbGetMessages, kbDeleteConversation, kbHybridSearch } from '@/lib/kb-api'
import type { Message, ChatResponse, Conversation, SearchResult } from '@/types/kb-api'
import { getDomainConfig } from '../configs'
import { listDomainSystems } from '@/api/domain-workbench'
import type { DomainCode, DomainSystemItem } from '@/types/api/domain-workbench'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const domainCode = computed<DomainCode | null>(() => {
  const code = String(route.params.domain || '')
  if (code === 'zgt' || code === 'zlt') return code
  return null
})

const config = computed(() => (domainCode.value ? getDomainConfig(domainCode.value) : null))
const systems = ref<DomainSystemItem[]>([])

async function loadSystems() {
  if (!domainCode.value) return
  try {
    const res = await listDomainSystems(domainCode.value)
    systems.value = res.data || []
  } catch (err) {
    console.error('获取系统列表失败:', err)
  }
}

function goHome() {
  router.push(`/domain/${domainCode.value}`)
}

function openSystem(name: string, url?: string) {
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener')
  } else {
    ElMessage.warning(`系统「${name}」入口未配置`)
  }
}

const isAuthenticated = ref(!!localStorage.getItem('kb_token'))
const loginUsername = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)
const loginError = ref('')

async function handleLogin() {
  loginLoading.value = true
  loginError.value = ''
  try {
    const result = await kbLogin(loginUsername.value, loginPassword.value)
    setKBToken(result.access_token)
    isAuthenticated.value = true
    ElMessage.success('登录成功')
    greeting.value = ''
    loadGreeting()
    loadConversations()
  } catch (err) {
    loginError.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    loginLoading.value = false
  }
}

function handleLogout() {
  stopSpeak()
  clearKBToken()
  isAuthenticated.value = false
  activeTab.value = 'chat'
  messages.value = []
  conversations.value = []
  currentConversationId = undefined
  greeting.value = ''
  loginUsername.value = ''
  loginPassword.value = ''
}

// ============ Tab 切换 ============
const activeTab = ref<'chat' | 'search'>('chat')

// ============ 会话管理 ============
const conversations = ref<Conversation[]>([])

async function loadConversations() {
  if (!isAuthenticated.value) return
  try {
    const data = await kbGetConversations()
    conversations.value = (data as Conversation[]) || []
  } catch (err) {
    console.error('获取会话列表失败:', err)
  }
}

async function switchConversation(id: number) {
  if (id === currentConversationId) return
  stopSpeak()
  currentConversationId = id
  messages.value = []
  greeting.value = ''
  try {
    const data = await kbGetMessages(id)
    messages.value = ((data as Message[]) || []).map(m => ({ ...m }))
    await scrollToBottom()
  } catch (err) {
    console.error('获取会话消息失败:', err)
    ElMessage.error('获取会话消息失败')
  }
}

function createNewConversation() {
  stopSpeak()
  currentConversationId = undefined
  messages.value = []
  greeting.value = ''
  loadGreeting()
}

async function deleteConversation(id: number) {
  try {
    await kbDeleteConversation(id)
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (currentConversationId === id) {
      currentConversationId = undefined
      messages.value = []
      loadGreeting()
    }
    ElMessage.success('会话已删除')
  } catch (err) {
    console.error('删除会话失败:', err)
    ElMessage.error(err instanceof Error ? err.message : '删除会话失败')
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// ============ 聊天 ============
interface DisplayMessage extends Message {
  sources?: SearchResult[]
  feedback?: 'up' | 'down'
}

const inputText = ref('')
const messages = ref<DisplayMessage[]>([])
const loading = ref(false)
const greeting = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const expandedSources = ref<Set<number>>(new Set())

let currentConversationId: number | undefined

const quickQuestions = ['水位查询', '船舶动态', '泊位情况', '法规咨询']

async function loadGreeting() {
  if (!isAuthenticated.value) return
  try {
    const res = await kbGetGreeting()
    greeting.value = res.greeting
  } catch (err) {
    console.error('获取问候语失败:', err)
    greeting.value = '你好！我是港航智能助手，可以帮您查询水位、船舶、泊位、法规等信息。'
  }
}

function toggleSources(msgId: number) {
  const next = new Set(expandedSources.value)
  if (next.has(msgId)) {
    next.delete(msgId)
  } else {
    next.add(msgId)
  }
  expandedSources.value = next
}

async function handleSend() {
  if (!inputText.value.trim() || loading.value) return
  await sendQuestion(inputText.value)
}

async function sendQuick(q: string) {
  if (loading.value) return
  await sendQuestion(q)
}

async function sendQuestion(question: string) {
  loading.value = true
  const userMessage: DisplayMessage = {
    id: Date.now(),
    conversation_id: currentConversationId || 0,
    role: 'user',
    content: question,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMessage)
  inputText.value = ''
  resetTextarea()
  await scrollToBottom()

  try {
    const response = await kbChat(question, currentConversationId) as ChatResponse
    currentConversationId = response.conversation_id

    const assistantMessage: DisplayMessage = {
      id: Date.now() + 1,
      conversation_id: response.conversation_id,
      role: 'assistant',
      content: response.answer,
      created_at: new Date().toISOString(),
      sources: response.sources || [],
    }
    messages.value.push(assistantMessage)
    loadConversations()
  } catch (err) {
    const errorMessage: DisplayMessage = {
      id: Date.now() + 1,
      conversation_id: currentConversationId || 0,
      role: 'assistant',
      content: err instanceof Error ? err.message : '发送失败，请重试',
      created_at: new Date().toISOString(),
    }
    messages.value.push(errorMessage)
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function resetTextarea() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleInput() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ============ 消息操作 ============
function handleFeedback(msgId: number, rating: 'up' | 'down') {
  messages.value = messages.value.map(m => {
    if (m.id === msgId) {
      // 再次点击相同评价则取消
      const feedback = m.feedback === rating ? undefined : rating
      return { ...m, feedback }
    }
    return m
  })
  ElMessage.success('反馈已记录')
}

async function copyMessage(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
    document.body.removeChild(textarea)
  }
}

// ============ TTS 朗读 ============
const speakingMsgId = ref<number | null>(null)

function toggleSpeak(msgId: number, text: string) {
  if (speakingMsgId.value === msgId) {
    stopSpeak()
    return
  }
  stopSpeak()
  if (!('speechSynthesis' in window)) {
    ElMessage.warning('当前浏览器不支持语音播报')
    return
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 1.0
  utterance.onend = () => {
    speakingMsgId.value = null
  }
  utterance.onerror = () => {
    speakingMsgId.value = null
    ElMessage.error('播报失败')
  }
  speakingMsgId.value = msgId
  window.speechSynthesis.speak(utterance)
}

function stopSpeak() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  speakingMsgId.value = null
}

// ============ 知识检索 ============
const searchQuery = ref('')
const searchLoading = ref(false)
const searchAnswer = ref('')
const searchResults = ref<SearchResult[]>([])
const searchExecuted = ref(false)

const searchSuggestions = ['救生衣', '桥区航行', '船舶违规', '防汛预案']

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q || searchLoading.value) return

  searchLoading.value = true
  searchAnswer.value = ''
  searchResults.value = []
  searchExecuted.value = true

  try {
    const data = await kbHybridSearch(q, 5)
    // 兼容多种返回格式
    const raw = data as any
    const results: SearchResult[] = Array.isArray(raw)
      ? raw
      : raw?.results || raw?.sources || raw?.data || []
    searchResults.value = results
    searchAnswer.value = raw?.answer || ''
    if (results.length === 0 && !searchAnswer.value) {
      ElMessage.info('未找到相关内容')
    } else if (results.length > 0) {
      ElMessage.success(`找到 ${results.length} 条相关结果`)
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '检索失败')
  } finally {
    searchLoading.value = false
  }
}

onMounted(() => {
  if (isAuthenticated.value) {
    loadGreeting()
    loadConversations()
  }
  loadSystems()
})
</script>

<style lang="scss" scoped>
.kb-qa-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 56px);
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .login-icon {
    width: 64px;
    height: 64px;
    color: #165dff;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1d2129;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #86909c;
    margin: 0;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      font-weight: 500;
      color: #1d2129;
    }

    input {
      padding: 12px 16px;
      border: 1px solid #e5e6eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: #165dff;
        box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
      }

      &:disabled {
        background: #f5f7fa;
        cursor: not-allowed;
      }
    }
  }
}

.login-error {
  padding: 10px 14px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 13px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============ 主界面 ============
.kb-qa-wrapper {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: transparent;
    color: #86909c;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: #f2f3f5;
      color: #4e5969;
    }

    &.active {
      background: #e8f3ff;
      color: #165dff;
    }
  }

  .tab-right {
    margin-left: auto;
  }
}

.logout-btn {
  padding: 6px 14px;
  background: transparent;
  color: #86909c;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fff1f0;
    color: #ff4d4f;
    border-color: #ffccc7;
  }
}

// ============ 业务问答 ============
.kb-qa-container {
  flex: 1;
  display: flex;
  background: #f5f7fa;
  overflow: hidden;
}

.conversation-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;

  .new-conversation-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    margin: 12px;
    background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
    }
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 2px;
    }
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 4px;

    &:hover {
      background: #f2f3f5;
    }

    &.active {
      background: #e8f3ff;
      .conv-title {
        color: #165dff;
      }
    }

    .conv-info {
      flex: 1;
      min-width: 0;

      .conv-title {
        font-size: 13px;
        font-weight: 500;
        color: #1d2129;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conv-time {
        font-size: 11px;
        color: #c9cdd4;
        margin-top: 2px;
      }
    }

    .conv-delete {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #c9cdd4;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.2s;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        background: #fff1f0;
        color: #ff4d4f;
      }
    }

    &:hover .conv-delete {
      opacity: 1;
    }
  }

  .empty-conversations {
    text-align: center;
    color: #c9cdd4;
    font-size: 13px;
    padding: 24px;
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #1a3a6b 0%, #1e5799 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar-icon {
    width: 36px;
    height: 36px;
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 6px;
  }

  .header-info {
    .bot-name {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .bot-status {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 2px;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item {
  display: flex;

  &.user {
    justify-content: flex-end;
    .message-content {
      background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
      color: #fff;
      border-radius: 16px 16px 4px 16px;
      .message-time {
        color: rgba(255, 255, 255, 0.6);
      }
      .message-actions {
        display: none;
      }
    }
  }

  &.assistant {
    justify-content: flex-start;
    .message-content {
      background: #fff;
      color: #1d2129;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .message-content {
    max-width: 80%;
    padding: 12px 16px;

    .message-label {
      font-size: 10px;
      font-weight: 600;
      color: #6c7072;
      margin-bottom: 4px;
      display: block;
    }

    .greeting-text {
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      word-break: break-word;
    }

    p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      word-break: break-word;
    }
  }
}

// 参考来源
.msg-sources {
  margin-top: 10px;
  border-top: 1px dashed #e5e6eb;
  padding-top: 8px;

  .sources-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: #f2f7ff;
    border: none;
    border-radius: 6px;
    color: #165dff;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    svg {
      width: 14px;
      height: 14px;
    }

    .toggle-arrow {
      width: 12px;
      height: 12px;
      transition: transform 0.2s;

      &.expanded {
        transform: rotate(180deg);
      }
    }

    &:hover {
      background: #e8f3ff;
    }
  }

  .sources-list {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .source-item {
    padding: 8px 10px;
    background: #f7f8fa;
    border-radius: 6px;
    border-left: 2px solid #165dff;

    .source-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;

      .source-name {
        font-size: 12px;
        font-weight: 500;
        color: #165dff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .source-score {
        font-size: 11px;
        color: #86909c;
        flex-shrink: 0;
      }
    }

    .source-text {
      font-size: 12px;
      color: #4e5969;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;

  .message-time {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.4);
  }

  .message-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #c9cdd4;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #f2f3f5;
    color: #4e5969;
  }

  &.active {
    color: #165dff;
    background: #e8f3ff;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 6px;

  .dot {
    width: 6px;
    height: 6px;
    background: #165dff;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }

  .loading-text {
    font-size: 12px;
    color: #86909c;
  }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

// 快捷问题
.quick-questions {
  display: flex;
  gap: 8px;
  padding: 8px 16px 0;
  overflow-x: auto;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    height: 0;
  }

  .quick-q-btn {
    flex-shrink: 0;
    padding: 5px 12px;
    background: #fff;
    border: 1px solid #e5e6eb;
    border-radius: 16px;
    color: #4e5969;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: #165dff;
      color: #165dff;
      background: #e8f3ff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e6eb;
  flex-shrink: 0;
  align-items: flex-end;

  .input-field {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #e5e6eb;
    border-radius: 12px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    font-family: inherit;

    &:focus {
      border-color: #165dff;
      box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
    }

    &:disabled {
      background: #f5f7fa;
      cursor: not-allowed;
    }
  }

  .send-button {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
    border: none;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// ============ 知识检索 ============
.search-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.search-box {
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  .search-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #165dff;
      box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
    }

    &:disabled {
      background: #f5f7fa;
      cursor: not-allowed;
    }
  }

  .search-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 20px;
    background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.search-suggestions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  flex-shrink: 0;
  flex-wrap: wrap;

  .suggestion-label {
    font-size: 12px;
    color: #86909c;
  }

  .suggestion-btn {
    padding: 4px 12px;
    background: #fff;
    border: 1px solid #e5e6eb;
    border-radius: 16px;
    color: #4e5969;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: #165dff;
      color: #165dff;
      background: #e8f3ff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.search-results {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #86909c;
  font-size: 13px;

  .loading-spinner-sm {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e6eb;
    border-top-color: #165dff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    svg {
      width: 16px;
      height: 16px;
      color: #165dff;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #1d2129;
    }

    .card-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .ai-badge {
      background: #f2e8ff;
      color: #722ed1;
    }
  }

  .card-meta {
    font-size: 11px;
    color: #c9cdd4;
    margin-top: 8px;
  }
}

.answer-card {
  border-left: 3px solid #722ed1;

  .answer-text {
    font-size: 14px;
    line-height: 1.7;
    color: #1d2129;
    margin: 0;
    word-break: break-word;
  }
}

.sources-card {
  border-left: 3px solid #165dff;
}

.search-sources-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-source-item {
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 8px;
  border-left: 2px solid #165dff;

  .source-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;

    .source-name {
      font-size: 13px;
      font-weight: 500;
      color: #165dff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .source-score {
      font-size: 11px;
      color: #86909c;
      flex-shrink: 0;
    }
  }

  .source-text {
    font-size: 12px;
    color: #4e5969;
    line-height: 1.6;
    margin: 0;
  }
}

.search-empty,
.search-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 80px 20px;
  color: #c9cdd4;
  text-align: center;

  svg {
    width: 56px;
    height: 56px;
    opacity: 0.5;
  }

  p {
    font-size: 15px;
    color: #86909c;
    margin: 0;
  }

  span {
    font-size: 12px;
  }
}
</style>
