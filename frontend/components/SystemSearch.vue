<template>
  <div class="system-search" ref="rootRef">
    <el-input
      v-model="keyword"
      clearable
      class="search-input"
      placeholder="搜索系统名称"
      @input="onInput"
      @focus="onInput"
      @keyup.enter="search"
    >
      <template #append>
        <el-button :icon="Search" @click="search" />
      </template>
    </el-input>
    <div v-if="visible && matches.length" class="suggestions">
      <div class="sug-header">匹配系统</div>
      <div
        v-for="item in matches"
        :key="item.name"
        class="sug-item"
        @click="pick(item)"
      >
        <span class="name">{{ item.name }}</span>
        <span class="cat">{{ item.category }}</span>
      </div>
    </div>
    <div v-else-if="visible && keyword.trim() && !matches.length" class="suggestions empty">
      未找到匹配系统
    </div>
  </div>
</template>

<script setup lang="ts" name="SystemSearch">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { DomainSystemItem } from '@/types/api/domain-workbench'

const props = defineProps<{
  systems: DomainSystemItem[]
}>()

const emit = defineEmits<{
  open: [name: string, url?: string]
}>()

const keyword = ref('')
const visible = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const matches = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  return props.systems
    .filter((s: DomainSystemItem) => s.name.toLowerCase().includes(kw))
    .slice(0, 8)
})

function onInput(): void {
  visible.value = true
}

function search(): void {
  visible.value = true
  if (matches.value.length === 1) {
    pick(matches.value[0])
  } else if (!matches.value.length && keyword.value.trim()) {
    ElMessage.warning('未找到匹配系统')
  }
}

function pick(item: DomainSystemItem): void {
  emit('open', item.name, item.url)
  visible.value = false
}

function onDocClick(e: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    visible.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style lang="scss" scoped>
.system-search {
  position: relative;
  width: 260px;
}

.search-input {
  width: 100%;
}

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 60;
  max-height: 280px;
  overflow-y: auto;

  &.empty {
    padding: 12px;
    font-size: 13px;
    color: #86909c;
    text-align: center;
  }
}

.sug-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #86909c;
  border-bottom: 1px solid #f2f3f5;
}

.sug-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #e8f3ff;
  }

  .name {
    color: #1d2129;
  }

  .cat {
    color: #86909c;
    font-size: 12px;
    flex-shrink: 0;
  }
}
</style>
