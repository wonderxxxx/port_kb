<template>
  <el-dialog
    :model-value="modelValue"
    title="待办事项办理"
    width="560px"
    destroy-on-close
    @close="onClose"
  >
    <template v-if="todo">
      <el-descriptions :column="1" border class="mb-3">
        <el-descriptions-item label="来源">{{ todo.source }}</el-descriptions-item>
        <el-descriptions-item label="事项分类">{{ todo.category }}</el-descriptions-item>
        <el-descriptions-item label="事项名称">{{ todo.name }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ todo.startTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(todo.status) }}</el-descriptions-item>
        <el-descriptions-item label="详细内容">
          <div class="content">{{ todo.content }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="todo.thirdSystemName" class="third-box">
        <div class="third-title">第三方系统处置入口</div>
        <p class="third-desc">
          涉及第三方系统的事件，可跳转至原系统完成处置。本平台记录办结时间戳（mock 阶段仅本地更新）。
        </p>
        <el-button type="primary" link @click="openThird">
          前往原系统处置 → {{ todo.thirdSystemName }}
        </el-button>
      </div>

      <el-form v-if="todo.status !== 'done'" label-position="top" class="handle-form">
        <el-form-item label="办理描述" required>
          <el-input
            v-model="description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="请填写办理情况描述"
          />
        </el-form-item>
        <el-form-item label="佐证附件">
          <el-upload
            :auto-upload="false"
            :limit="5"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          >
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持图片、PDF、Word，单文件不超 10M（mock 不实际上传）</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <el-alert
        v-else
        type="success"
        :closable="false"
        :title="`已办理${todo.handleTime ? ' · ' + todo.handleTime : ''}`"
      />
    </template>

    <template #footer>
      <el-button @click="onClose">取消</el-button>
      <el-button
        v-if="todo && todo.status !== 'done'"
        type="primary"
        :loading="submitting"
        @click="submit"
      >
        确认提交
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="TodoHandleDialog">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { DomainTodo, DomainTodoStatus } from '@/types/api/domain-workbench'

const props = defineProps<{
  modelValue: boolean
  todo: DomainTodo | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { description: string; attachments: string[] }]
  openThird: [name: string, url?: string]
}>()

const description = ref('')
const fileNames = ref<string[]>([])

watch(
  () => props.modelValue,
  (val: boolean) => {
    if (val) {
      description.value = ''
      fileNames.value = []
    }
  }
)

function statusLabel(s: DomainTodoStatus): string {
  if (s === 'pending') return '未办理'
  if (s === 'done') return '已办理'
  return '超期'
}

function onClose(): void {
  emit('update:modelValue', false)
}

function openThird(): void {
  if (!props.todo) return
  emit('openThird', props.todo.thirdSystemName || '', props.todo.thirdSystemUrl)
}

function onFileChange(file: any, fileList: any[]): void {
  const raw = file?.raw as File | undefined
  if (raw && raw.size > 10 * 1024 * 1024) {
    ElMessage.warning('单文件不能超过 10M')
    fileList.pop()
    return
  }
  fileNames.value = fileList.map((f: any) => f.name as string)
}

function onFileRemove(_file: any, fileList: any[]): void {
  fileNames.value = fileList.map((f: any) => f.name as string)
}

function submit(): void {
  if (!description.value.trim()) {
    ElMessage.warning('请填写办理描述')
    return
  }
  emit('submit', {
    description: description.value.trim(),
    attachments: [...fileNames.value]
  })
}
</script>

<style lang="scss" scoped>
.mb-3 {
  margin-bottom: 16px;
}

.content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #4e5969;
}

.third-box {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.third-title {
  font-weight: 500;
  margin-bottom: 6px;
}

.third-desc {
  margin: 0 0 8px;
  font-size: 13px;
  color: #86909c;
  line-height: 1.5;
}

.handle-form {
  margin-top: 4px;
}
</style>
