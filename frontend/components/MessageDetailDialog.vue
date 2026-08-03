<template>
  <el-dialog
    :model-value="modelValue"
    title="消息详情"
    width="520px"
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <template v-if="message">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="序号">{{ message.id }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ message.source }}</el-descriptions-item>
        <el-descriptions-item label="事件标题">{{ message.title }}</el-descriptions-item>
        <el-descriptions-item label="事件时间">{{ message.eventTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ message.status === 'unread' ? '未读' : '已读' }}
        </el-descriptions-item>
        <el-descriptions-item label="详细内容">
          <div class="content">{{ message.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <template #footer>
      <el-button type="primary" @click="emit('update:modelValue', false)">我知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="MessageDetailDialog">
import type { DomainMessage } from '@/types/api/domain-workbench'

defineProps<{
  modelValue: boolean
  message: DomainMessage | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style lang="scss" scoped>
.content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #4e5969;
}
</style>
