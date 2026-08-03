<template>
  <div class="panel card-shadow">
    <div class="panel-header">
      <h2 class="panel-title">待办事项</h2>
      <span class="panel-meta">
        待办理 {{ stats.pending }} 项 · 超期 {{ stats.overdue }} 项
      </span>
    </div>

    <div v-if="showStats" class="stats">
      <div class="stat-box">
        <div class="stat-num">{{ stats.pending }}</div>
        <div class="stat-label">未办理</div>
      </div>
      <div class="stat-box">
        <div class="stat-num done">{{ stats.done }}</div>
        <div class="stat-label">已办理</div>
      </div>
      <div class="stat-box">
        <div class="stat-num overdue">{{ stats.overdue }}</div>
        <div class="stat-label">超期</div>
      </div>
    </div>

    <div class="filters">
      <template v-if="richFilters">
        <el-select v-model="source" clearable placeholder="全部来源" style="width: 140px">
          <el-option label="全部来源" value="" />
          <el-option
            v-for="opt in sources"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select v-model="status" clearable placeholder="全部状态" style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="未办理" value="pending" />
          <el-option label="已办理" value="done" />
          <el-option label="超期" value="overdue" />
        </el-select>
        <el-date-picker
          v-model="dateFrom"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始日期"
          style="width: 160px"
        />
        <el-input
          v-model="keyword"
          clearable
          placeholder="关键词搜索"
          style="width: 160px"
          @keyup.enter="emitQuery"
        />
        <el-button type="primary" @click="emitQuery">查询</el-button>
      </template>
      <el-select
        v-else
        v-model="status"
        clearable
        placeholder="全部状态"
        style="width: 140px"
        @change="emitQuery"
      >
        <el-option label="全部状态" value="" />
        <el-option label="未办理" value="pending" />
        <el-option label="已办理" value="done" />
        <el-option label="超期" value="overdue" />
      </el-select>
    </div>

    <div class="table-wrap">
      <el-table
        :data="todos"
        height="320"
        highlight-current-row
        @row-click="onRowClick"
      >
        <el-table-column type="index" label="序号" :width="indexColWidth" />
        <el-table-column prop="source" label="来源" :width="sourceColWidth" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" :width="categoryColWidth" show-overflow-tooltip />
        <el-table-column prop="name" label="事项名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="开始时间" :width="compactDateTime ? 90 : 110">
          <template #default="{ row }">
            {{ formatStartTime(row.startTime, compactDateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template #default="{ row }">
            <span :class="'st-' + row.status">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="办理时间" :width="compactDateTime ? 130 : 150">
          <template #default="{ row }">
            {{ formatHandleTime(row.handleTime, compactDateTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts" name="TodoPanel">
import { ref, computed } from 'vue'
import type {
  DomainFilterOption,
  DomainTodo,
  DomainTodoQuery,
  DomainTodoStats,
  DomainTodoStatus
} from '@/types/api/domain-workbench'
import { formatHandleTime, formatStartTime } from '../utils/formatTime'

const props = withDefaults(
  defineProps<{
    todos: DomainTodo[]
    stats: DomainTodoStats
    sources?: DomainFilterOption[]
    /** 是否展示未办理/已办理/超期三格统计，默认 true */
    showStats?: boolean
    /** 浙路通：开始时间 MM-DD，办理时间 MM-DD HH:mm */
    compactDateTime?: boolean
    /** 完整筛选：来源 + 状态 + 日期 + 关键词 */
    richFilters?: boolean
  }>(),
  {
    sources: () => [],
    showStats: true,
    compactDateTime: false,
    richFilters: false
  }
)

const emit = defineEmits<{
  query: [payload: DomainTodoQuery]
  open: [todo: DomainTodo]
}>()

const source = ref('')
const status = ref<DomainTodoStatus | ''>('')
const dateFrom = ref('')
const keyword = ref('')

/** 浙路通列宽加宽；其它域保持紧凑 */
const indexColWidth = computed(() => (props.richFilters || props.compactDateTime ? 72 : 56))
const sourceColWidth = computed(() => (props.richFilters || props.compactDateTime ? 110 : 90))
const categoryColWidth = computed(() => (props.richFilters || props.compactDateTime ? 110 : 90))

function statusLabel(s: DomainTodoStatus): string {
  if (s === 'pending') return '未办理'
  if (s === 'done') return '已办理'
  return '超期'
}

function emitQuery(): void {
  if (props.richFilters) {
    emit('query', {
      source: source.value || undefined,
      status: status.value || undefined,
      dateFrom: dateFrom.value || undefined,
      keyword: keyword.value || undefined
    })
    return
  }
  emit('query', { status: status.value || undefined })
}

function onRowClick(row: DomainTodo): void {
  emit('open', row)
}
</script>

<style lang="scss" scoped>
.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-meta {
  font-size: 12px;
  color: #86909c;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-box {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.stat-num {
  font-size: 20px;
  font-weight: 600;
  color: #165dff;

  &.done {
    color: #00b42a;
  }

  &.overdue {
    color: #f53f3f;
  }
}

.stat-label {
  font-size: 12px;
  color: #86909c;
  margin-top: 2px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.table-wrap {
  flex: 1;
  min-height: 0;
}

.st-pending {
  color: #165dff;
  font-size: 13px;
}

.st-done {
  color: #00b42a;
  font-size: 13px;
}

.st-overdue {
  color: #f53f3f;
  font-size: 13px;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
