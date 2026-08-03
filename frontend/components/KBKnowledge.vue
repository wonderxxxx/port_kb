<template>
  <div class="kb-knowledge-page">
    <domain-top-nav
      v-if="config"
      :title="config.title"
      :subtitle="config.subtitle"
      :nav="config.nav"
      :systems="systems"
      @home="goHome"
      @open-system="openSystem"
    />
    <div class="kb-knowledge-container">
      <div class="knowledge-header">
        <div class="header-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span>知识库管理</span>
        </div>
      </div>

      <div class="knowledge-content">
        <!-- 上传区域 -->
        <div class="upload-section">
          <div class="upload-config">
            <span class="config-label">文档类型：</span>
            <div class="category-select">
              <button
                v-for="cat in categories"
                :key="cat"
                :class="['category-btn', { active: uploadCategory === cat }]"
                @click="uploadCategory = cat"
              >{{ cat }}</button>
            </div>
          </div>

          <div
            :class="['upload-zone', { 'drag-over': dragOver }]"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
            @click="triggerFileSelect"
          >
            <input
              ref="fileInputRef"
              type="file"
              :accept="supportedTypes"
              multiple
              @change="handleFileSelect"
              class="file-input-hidden"
            />
            <div v-if="!uploading" class="upload-content">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="upload-title">拖拽文件到此处上传，或点击选择文件</p>
              <p class="upload-hint">支持 PDF · Word (.doc/.docx) · Markdown (.md) · TXT · CSV · HTML · JSON · XML</p>
              <p class="upload-hint">文件将归类为「{{ uploadCategory }}」，自动解析为知识条目</p>
            </div>
            <div v-else class="uploading-content">
              <div class="upload-progress-bar">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <p class="upload-status">{{ uploadStatus }}</p>
            </div>
          </div>
        </div>

        <!-- 文档列表 -->
        <div class="documents-section">
          <div class="section-header">
            <h3 class="section-title">已上传文档</h3>
            <span class="doc-count">共 {{ documents.length }} 个</span>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
          </div>

          <div v-else-if="documents.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <p>暂无文档，请上传知识库文件</p>
          </div>

          <div v-else class="document-grid">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="document-card"
            >
              <div class="card-icon" :class="getFileClass(doc.file_type)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path v-if="doc.file_type === 'pdf'" stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  <path v-else-if="doc.file_type === 'docx' || doc.file_type === 'doc'" stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </div>
              <div class="card-info">
                <div class="doc-name">{{ doc.filename }}</div>
                <div class="doc-meta">
                  <span class="category-tag" :class="getCategoryClass(doc.category)">{{ doc.category }}</span>
                  <span class="file-type">{{ doc.file_type?.toUpperCase() || 'FILE' }}</span>
                </div>
                <div class="doc-time">{{ formatDate(doc.created_at) }}</div>
              </div>
              <button @click="handleDelete(doc.id)" class="card-delete" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DomainTopNav from './DomainTopNav.vue'
import { kbGetDocuments, kbUploadDocument, kbDeleteDocument } from '@/lib/kb-api'
import type { Document } from '@/types/kb-api'
import { ElMessage } from 'element-plus'
import { getDomainConfig } from '../configs'
import { listDomainSystems } from '@/api/domain-workbench'
import type { DomainCode, DomainSystemItem } from '@/types/api/domain-workbench'

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

// 文档类型配置
const categories = ['法规', '案例', '文书']
const supportedTypes = '.pdf,.doc,.docx,.md,.txt,.csv,.html,.json,.xml'

// 上传相关状态
const uploadCategory = ref('法规')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const dragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 文档列表
const documents = ref<Document[]>([])
const loading = ref(false)

async function loadDocuments() {
  loading.value = true
  try {
    const data = await kbGetDocuments()
    documents.value = (data as Document[]) || []
  } catch (err) {
    console.error('获取文档列表失败:', err)
    ElMessage.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

function triggerFileSelect() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    uploadFiles(files)
  }
  target.value = ''
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    uploadFiles(files)
  }
}

async function uploadFiles(files: FileList) {
  if (uploading.value) return

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = `准备上传 ${files.length} 个文件...`

  let successCount = 0
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    uploadProgress.value = Math.round((i / total) * 80)
    uploadStatus.value = `正在上传 ${file.name} (${i + 1}/${total})...`

    try {
      const res = await kbUploadDocument(file, uploadCategory.value)
      // 检查响应
      if (res.ok) {
        successCount++
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error(`${file.name} 上传失败:`, errData)
      }
    } catch (err) {
      console.error(`${file.name} 上传异常:`, err)
    }
  }

  uploadProgress.value = 100
  uploadStatus.value = successCount > 0 ? `成功上传 ${successCount} 个文件` : '上传失败'

  setTimeout(() => {
    uploading.value = false
    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件`)
      loadDocuments()
    } else {
      ElMessage.error('上传失败，请重试')
    }
  }, 500)
}

async function handleDelete(id: number) {
  try {
    await kbDeleteDocument(id)
    documents.value = documents.value.filter(doc => doc.id !== id)
    ElMessage.success('删除成功')
  } catch (err) {
    console.error('删除失败:', err)
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}

function getFileClass(fileType: string) {
  const type = (fileType || '').toLowerCase()
  switch (type) {
    case 'pdf': return 'pdf'
    case 'docx':
    case 'doc': return 'doc'
    case 'md': return 'md'
    case 'txt': return 'txt'
    default: return 'other'
  }
}

function getCategoryClass(category: string) {
  switch (category) {
    case '法规': return 'cat-law'
    case '案例': return 'cat-case'
    case '文书': return 'cat-doc'
    default: return ''
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadDocuments()
  loadSystems()
})
</script>

<style lang="scss" scoped>
.kb-knowledge-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.kb-knowledge-container {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.knowledge-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;

    .title-icon {
      width: 24px;
      height: 24px;
      color: #165dff;
    }
  }
}

.knowledge-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
}

// 上传区域
.upload-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.upload-config {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .config-label {
    font-size: 13px;
    color: #4e5969;
    font-weight: 500;
  }
}

.category-select {
  display: flex;
  gap: 8px;
}

.category-btn {
  padding: 6px 16px;
  background: #f2f3f5;
  border: 1px solid transparent;
  border-radius: 16px;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e8f3ff;
    color: #165dff;
  }

  &.active {
    background: linear-gradient(135deg, #165dff 0%, #0d47a1 100%);
    color: #fff;
    border-color: #165dff;
  }
}

.upload-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: #165dff;
    background: #f7faff;
  }

  &.drag-over {
    border-color: #165dff;
    background: #e8f3ff;
  }

  .file-input-hidden {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }
}

.upload-content {
  .upload-icon {
    width: 48px;
    height: 48px;
    color: #165dff;
    margin-bottom: 12px;
  }

  .upload-title {
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    margin: 0 0 8px;
  }

  .upload-hint {
    font-size: 12px;
    color: #86909c;
    margin: 4px 0;
  }
}

.uploading-content {
  .upload-progress-bar {
    width: 200px;
    height: 8px;
    background: #f2f3f5;
    border-radius: 4px;
    margin: 0 auto 12px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #165dff 0%, #0d47a1 100%);
      border-radius: 4px;
      transition: width 0.3s;
    }
  }

  .upload-status {
    font-size: 13px;
    color: #165dff;
    margin: 0;
  }
}

// 文档列表区域
.documents-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
    margin: 0;
  }

  .doc-count {
    font-size: 12px;
    color: #86909c;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #86909c;

  svg {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e6eb;
  border-top-color: #165dff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.document-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f1f2;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 22px;
      height: 22px;
      color: #fff;
    }

    &.pdf { background: #e74c3c; }
    &.doc { background: #3498db; }
    &.md { background: #2c3e50; }
    &.txt { background: #95a5a6; }
    &.other { background: #7f8c8d; }
  }

  .card-info {
    flex: 1;
    min-width: 0;

    .doc-name {
      font-size: 14px;
      font-weight: 500;
      color: #1d2129;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 6px;
    }

    .doc-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;

      .category-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;

        &.cat-law {
          background: #e8f3ff;
          color: #165dff;
        }
        &.cat-case {
          background: #fff7e6;
          color: #d48806;
        }
        &.cat-doc {
          background: #f6e8ff;
          color: #722ed1;
        }
      }

      .file-type {
        font-size: 11px;
        padding: 2px 6px;
        background: #f5f7fa;
        color: #86909c;
        border-radius: 4px;
      }
    }

    .doc-time {
      font-size: 11px;
      color: #c9cdd4;
    }
  }

  .card-delete {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #c9cdd4;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: #fff1f0;
      color: #ff4d4f;
    }
  }
}
</style>