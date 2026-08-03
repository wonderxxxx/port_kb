<template>
  <div class="panel card-shadow">
    <div class="panel-header">
      <h2 class="panel-title">消息提醒</h2>
      <span class="panel-meta">
        共 {{ messages.length }} 条
        <template v-if="unreadCount"> · {{ unreadCount }} 未读</template>
      </span>
    </div>

    <div class="filters">
      <el-select v-model="source" clearable placeholder="全部来源" style="width: 140px">
        <el-option label="全部来源" value="" />
        <el-option
          v-for="opt in sources"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-date-picker
        v-if="dateFilter"
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
        style="width: 180px"
        @keyup.enter="emitQuery"
      />
      <el-button type="primary" @click="emitQuery">查询</el-button>
    </div>

    <div class="table-wrap">
      <el-table
        :data="messages"
        height="360"
        highlight-current-row
        @row-click="onRowClick"
      >
        <el-table-column type="index" label="序号" width="52" />
        <el-table-column prop="source" label="来源" width="90" show-overflow-tooltip />
        <el-table-column prop="title" label="事件标题" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ unread: row.status === 'unread' }">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="事件时间" :width="compactDateTime ? 120 : 150">
          <template #default="{ row }">
            {{ formatEventTime(row.eventTime, compactDateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="72">
          <template #default="{ row }">
            <span :class="row.status === 'unread' ? 'status-unread' : 'status-read'">
              {{ row.status === 'unread' ? '未读' : '已读' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" :width="compactDateTime ? 80 : 150">
          <template #default="{ row }">
            {{ formatOperateTime(row.operateTime, compactDateTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts" name="MessagePanel">
import { ref, computed } from 'vue'
import type { DomainFilterOption, DomainMessage } from '@/types/api/domain-workbench'
import { formatEventTime, formatOperateTime } from '../utils/formatTime'

const props = withDefaults(
  defineProps<{
    messages: DomainMessage[]
    sources: DomainFilterOption[]
    dateFilter?: boolean
    /** 浙路通：事件时间去年份，操作时间仅 HH:mm */
    compactDateTime?: boolean
  }>(),
  {
    compactDateTime: false
  }
)

const emit = defineEmits<{
  query: [payload: { source?: string; keyword?: string; dateFrom?: string }]
  open: [msg: DomainMessage]
}>()

const source = ref('')
const keyword = ref('')
const dateFrom = ref('')

const unreadCount = computed(
  () => props.messages.filter((m: DomainMessage) => m.status === 'unread').length
)

function emitQuery(): void {
  emit('query', {
    source: source.value || undefined,
    keyword: keyword.value || undefined,
    dateFrom: props.dateFilter ? dateFrom.value || undefined : undefined
  })
}

function onRowClick(row: DomainMessage): void {
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
  color: #1d2129;
}

.panel-meta {
  font-size: 12px;
  color: #86909c;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.table-wrap {
  flex: 1;
  min-height: 0;
}

.unread {
  color: #165dff;
  font-weight: 500;
}

.status-unread {
  color: #f53f3f;
  font-size: 12px;
}

.status-read {
  color: #86909c;
  font-size: 12px;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
