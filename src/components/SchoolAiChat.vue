<script setup lang="ts">
import { computed, isRef, ref, toRaw, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  CopilotChat,
  CopilotChatInput,
  useAgent,
  useAgentContext,
  useCopilotKit,
  useFrontendTool,
} from '@copilotkit/vue/v2'
import { z } from 'zod'
import { useSchoolStore } from '@/stores/school'

const threadId = 'school-ai-chat'
const router = useRouter()
const school = useSchoolStore()
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()

const open = ref(false)
const statusText = ref('可以帮你操作学生和班级')
const runNotice = ref('')
const canRun = computed(() => Boolean(agent.value && !agent.value.isRunning))
const attachmentConfig = {
  enabled: true,
}
const patchedAgents = new WeakSet<object>()

function showRunNotice(message: string) {
  runNotice.value = message
  setTimeout(() => {
    if (runNotice.value === message) runNotice.value = ''
  }, 8000)
}

// CopilotKit 运行参数会经过 structuredClone，这里提前清理 Vue proxy、ref 和不可克隆对象。
function toPlainJson<T>(value: T): T {
  const plainValue = toJsonCompatible(value)
  if (plainValue === undefined) return plainValue as T
  return JSON.parse(JSON.stringify(plainValue)) as T
}

function toJsonCompatible(value: unknown, seen = new WeakSet<object>()): unknown {
  if (isRef(value)) return toJsonCompatible(unref(value), seen)
  if (value === null) return null
  if (value === undefined) return undefined

  const valueType = typeof value
  if (valueType === 'string' || valueType === 'boolean') return value
  if (valueType === 'number') return Number.isFinite(value) ? value : null
  if (valueType === 'bigint') return value.toString()
  if (valueType === 'function' || valueType === 'symbol') return undefined

  const rawValue = toRaw(value as object) as object
  if (seen.has(rawValue)) return '[Circular]'
  seen.add(rawValue)

  if (rawValue instanceof Date) return rawValue.toISOString()
  if (rawValue instanceof Error) {
    return {
      name: rawValue.name,
      message: rawValue.message,
    }
  }
  if (typeof File !== 'undefined' && rawValue instanceof File) {
    return {
      name: rawValue.name,
      size: rawValue.size,
      type: rawValue.type,
      lastModified: rawValue.lastModified,
    }
  }
  if (typeof Blob !== 'undefined' && rawValue instanceof Blob) {
    return {
      size: rawValue.size,
      type: rawValue.type,
    }
  }
  if (rawValue instanceof Map) {
    return Object.fromEntries(
      Array.from(rawValue.entries())
        .map(([key, entryValue]) => [String(key), toJsonCompatible(entryValue, seen)])
        .filter(([, entryValue]) => entryValue !== undefined),
    )
  }
  if (rawValue instanceof Set) {
    return Array.from(rawValue.values())
      .map((entryValue) => toJsonCompatible(entryValue, seen))
      .filter((entryValue) => entryValue !== undefined)
  }
  if (Array.isArray(rawValue)) {
    return rawValue.map((entryValue) => toJsonCompatible(entryValue, seen) ?? null)
  }

  const output: Record<string, unknown> = {}
  for (const [key, entryValue] of Object.entries(rawValue)) {
    const plainEntry = toJsonCompatible(entryValue, seen)
    if (plainEntry !== undefined) output[key] = plainEntry
  }
  return output
}

function getSchoolSnapshot() {
  return toPlainJson(school.schoolSnapshot)
}

function classPageName(page: 'students' | 'classes') {
  return page === 'students' ? '学生管理' : '班级管理'
}

function toolResult<T extends Record<string, unknown>>(message: string, payload: T) {
  statusText.value = message
  return {
    ...payload,
    snapshot: getSchoolSnapshot(),
  }
}

useAgentContext({
  description:
    '教务管理系统当前数据。包含学生、班级、每个班级的学生、未分班学生。AI 可以读取这些数据并调用工具完成学生 CRUD、班级 CRUD、班级添加学生和移出学生。',
  value: () => ({
    route: router.currentRoute.value.fullPath,
    ...getSchoolSnapshot(),
  }),
})

function formatAiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '未知错误')
  if (/structuredClone|could not be cloned|could not be clone/i.test(message)) {
    return `AI 处理失败：前端传给 CopilotKit 的数据里还有不可克隆对象。原始错误：${message}`
  }
  return `AI 处理失败：${message}`
}

function handleChatError(event: { error: Error }) {
  showRunNotice(formatAiError(event.error))
}

function sanitizeRunParameters(parameters: unknown) {
  if (!parameters || typeof parameters !== 'object') return parameters
  const sanitized = { ...(parameters as Record<string, unknown>) }
  for (const key of ['tools', 'context', 'forwardedProps'] as const) {
    if (key in sanitized) sanitized[key] = toPlainJson(sanitized[key])
  }
  return sanitized
}

function sanitizeAgentData(currentAgent: unknown) {
  if (!currentAgent || typeof currentAgent !== 'object') return
  const mutableAgent = currentAgent as {
    messages?: unknown
    state?: unknown
    setMessages?: (messages: unknown[]) => void
    setState?: (state: unknown) => void
  }
  const plainMessages = toPlainJson(mutableAgent.messages ?? []) as unknown[]
  const plainState = toPlainJson(mutableAgent.state ?? {})

  if (typeof mutableAgent.setMessages === 'function') {
    mutableAgent.setMessages(plainMessages)
  } else {
    mutableAgent.messages = plainMessages
  }

  if (typeof mutableAgent.setState === 'function') {
    mutableAgent.setState(plainState)
  } else {
    mutableAgent.state = plainState
  }
}

// 当前版本的 Agent 内部可能缓存响应式数据，运行前统一转成普通 JSON，避免浏览器克隆失败。
function patchAgentCloneInputs(currentAgent: unknown) {
  if (!currentAgent || typeof currentAgent !== 'object' || patchedAgents.has(currentAgent)) return

  const mutableAgent = currentAgent as {
    runAgent?: (parameters?: unknown, subscriber?: unknown) => Promise<unknown>
    connectAgent?: (parameters?: unknown, subscriber?: unknown) => Promise<unknown>
  }
  const originalRunAgent = mutableAgent.runAgent?.bind(currentAgent)
  const originalConnectAgent = mutableAgent.connectAgent?.bind(currentAgent)

  if (originalRunAgent) {
    mutableAgent.runAgent = (parameters?: unknown, subscriber?: unknown) => {
      sanitizeAgentData(currentAgent)
      return originalRunAgent(sanitizeRunParameters(parameters), subscriber)
    }
  }

  if (originalConnectAgent) {
    mutableAgent.connectAgent = (parameters?: unknown, subscriber?: unknown) => {
      sanitizeAgentData(currentAgent)
      return originalConnectAgent(sanitizeRunParameters(parameters), subscriber)
    }
  }

  patchedAgents.add(currentAgent)
}

async function sendPrompt(message: string) {
  open.value = true
  if (!agent.value || agent.value.isRunning) return
  patchAgentCloneInputs(agent.value)
  agent.value.addMessage(toPlainJson({
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
  }))
  statusText.value = `已发送：${message}`
  try {
    await copilotkit.value.runAgent({
      agent: agent.value,
      forwardedProps: { source: 'school-ai-chat' },
    })
  } catch (error) {
    showRunNotice(formatAiError(error))
  }
}

watch(
  () => agent.value,
  (currentAgent, _previous, onCleanup) => {
    if (!currentAgent) return
    patchAgentCloneInputs(currentAgent)
    const subscription = currentAgent.subscribe({
      onRunStartedEvent: () => {
        runNotice.value = ''
      },
      onRunErrorEvent: ({ event }) => {
        showRunNotice(`AI 运行失败：${event.message}`)
      },
      onRunFailed: ({ error }) => {
        showRunNotice(formatAiError(error))
      },
    })
    onCleanup(() => subscription.unsubscribe())
  },
  { immediate: true },
)

useFrontendTool({
  name: 'readSchoolManagementData',
  description: '读取当前学生和班级管理数据。返回学生、班级、班级成员和未分班学生。',
  parameters: z.object({}),
  handler: async () => {
    statusText.value = '已读取教务数据'
    return getSchoolSnapshot()
  },
})

useFrontendTool({
  name: 'navigateSchoolPage',
  description: '跳转到学生管理或班级管理页面。',
  parameters: z.object({
    page: z.enum(['students', 'classes']),
  }),
  handler: async ({ page }) => {
    const path = page === 'students' ? '/students' : '/classes'
    await router.push(path)
    statusText.value = `已跳转到${classPageName(page)}`
    return { page, path }
  },
})

useFrontendTool({
  name: 'createStudent',
  description: '新增学生。classId 为空表示未分班；如果要加入班级，先读取班级数据获取 classId。',
  parameters: z.object({
    studentNo: z.string(),
    name: z.string(),
    gender: z.enum(['男', '女']),
    age: z.number().int().min(1),
    phone: z.string(),
    classId: z.string().optional(),
  }),
  handler: async (input) => {
    const student = school.createStudent({ ...input, classId: input.classId ?? '' })
    return toolResult(`已新增学生：${student.name}`, { student: toPlainJson(student) })
  },
})

useFrontendTool({
  name: 'updateStudent',
  description: '更新学生。只传需要修改的字段。',
  parameters: z.object({
    id: z.string(),
    studentNo: z.string().optional(),
    name: z.string().optional(),
    gender: z.enum(['男', '女']).optional(),
    age: z.number().int().min(1).optional(),
    phone: z.string().optional(),
    classId: z.string().optional(),
  }),
  handler: async ({ id, ...input }) => {
    const student = school.updateStudent(id, input)
    return toolResult(student ? `已更新学生：${student.name}` : '未找到学生', {
      student: toPlainJson(student),
    })
  },
})

useFrontendTool({
  name: 'deleteStudent',
  description: '删除学生。',
  parameters: z.object({
    id: z.string(),
  }),
  handler: async ({ id }) => {
    const student = school.deleteStudent(id)
    return toolResult(student ? `已删除学生：${student.name}` : '未找到学生', {
      student: toPlainJson(student),
    })
  },
})

useFrontendTool({
  name: 'createClass',
  description: '新增班级。',
  parameters: z.object({
    name: z.string(),
    grade: z.string(),
    headTeacher: z.string(),
    room: z.string(),
  }),
  handler: async (input) => {
    const schoolClass = school.createClass(input)
    return toolResult(`已新增班级：${schoolClass.name}`, { class: toPlainJson(schoolClass) })
  },
})

useFrontendTool({
  name: 'updateClass',
  description: '更新班级。只传需要修改的字段。',
  parameters: z.object({
    id: z.string(),
    name: z.string().optional(),
    grade: z.string().optional(),
    headTeacher: z.string().optional(),
    room: z.string().optional(),
  }),
  handler: async ({ id, ...input }) => {
    const schoolClass = school.updateClass(id, input)
    return toolResult(schoolClass ? `已更新班级：${schoolClass.name}` : '未找到班级', {
      class: toPlainJson(schoolClass),
    })
  },
})

useFrontendTool({
  name: 'deleteClass',
  description: '删除班级。删除后该班学生会变为未分班。',
  parameters: z.object({
    id: z.string(),
  }),
  handler: async ({ id }) => {
    const schoolClass = school.deleteClass(id)
    return toolResult(schoolClass ? `已删除班级：${schoolClass.name}` : '未找到班级', {
      class: toPlainJson(schoolClass),
    })
  },
})

useFrontendTool({
  name: 'assignStudentToClass',
  description: '把学生加入班级。如果学生已在其他班，会自动转入目标班级。',
  parameters: z.object({
    studentId: z.string(),
    classId: z.string(),
  }),
  handler: async ({ studentId, classId }) => {
    const result = school.assignStudentToClass(studentId, classId)
    return toolResult(
      result ? `已把 ${result.student.name} 加入 ${result.class.name}` : '学生或班级不存在',
      { result: toPlainJson(result) },
    )
  },
})

useFrontendTool({
  name: 'removeStudentFromClass',
  description: '把学生从当前班级移出，变成未分班。',
  parameters: z.object({
    studentId: z.string(),
  }),
  handler: async ({ studentId }) => {
    const student = school.removeStudentFromClass(studentId)
    return toolResult(student ? `已把 ${student.name} 移出班级` : '未找到学生', {
      student: toPlainJson(student),
    })
  },
})
</script>

<template>
  <div v-if="open" class="ai-chat-window">
    <header class="ai-chat-window__header">
      <div class="ai-chat-window__title">
        <strong>AI 教务助手</strong>
        <span>{{ agent?.isRunning ? '正在执行...' : statusText }}</span>
      </div>
      <button class="button-secondary" @click="open = false">收起</button>
    </header>

    <div class="ai-chat-window__quick">
      <button
        class="button-secondary"
        :disabled="!canRun"
        @click="sendPrompt('读取当前学生和班级数据，给我一个摘要')"
      >
        读取数据
      </button>
      <button
        class="button-secondary"
        :disabled="!canRun"
        @click="sendPrompt('帮我新增学生赵明，学号 2026004，男，12 岁，电话 13800000004，并加入一年级二班')"
      >
        新增学生
      </button>
      <button
        class="button-secondary"
        :disabled="!canRun"
        @click="sendPrompt('帮我创建一个一年级三班，班主任赵老师，教室 A103')"
      >
        新增班级
      </button>
    </div>

    <p v-if="runNotice" class="ai-chat-window__notice ai-chat-window__notice--error">{{ runNotice }}</p>

    <div class="ai-chat-window__body">
      <CopilotChat
        agent-id="default"
        :thread-id="threadId"
        :attachments="attachmentConfig"
        :auto-scroll="'pin-to-bottom'"
        :on-error="handleChatError"
      >
        <template #input="inputProps">
          <CopilotChatInput
            :model-value="inputProps.modelValue"
            :is-running="inputProps.isRunning"
            :mode="inputProps.inputMode"
            :tools-menu="inputProps.inputToolsMenu"
            positioning="static"
            :show-disclaimer="true"
            :bottom-anchored="true"
            @update:model-value="inputProps.onUpdateModelValue"
            @submit-message="inputProps.onSubmitMessage"
            @stop="inputProps.onStop?.()"
            @add-file="inputProps.onAddFile"
          >
            <template #add-menu-button="{ disabled, labels }">
              <button
                type="button"
                data-testid="copilot-chat-input-add"
                :aria-label="labels.chatInputToolbarAddButtonLabel"
                :disabled="disabled"
                class="ai-chat-window__upload-button"
                @click.stop="inputProps.onAddFile"
              >
                +
              </button>
            </template>
          </CopilotChatInput>
        </template>
      </CopilotChat>
    </div>
  </div>

  <button v-else class="ai-chat-launcher" @click="open = true">
    AI
  </button>
</template>

<style scoped>
.ai-chat-window {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 80;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  width: min(520px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  border: 1px solid #c8d4e4;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 26px 80px rgba(18, 28, 45, 0.28);
}

.ai-chat-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, #f8fbff 0%, #f2f6fb 100%);
  padding: 0.9rem 1rem;
}

.ai-chat-window__title {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
}

.ai-chat-window__title strong,
.ai-chat-window__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-chat-window__title span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.ai-chat-window__header .button-secondary {
  min-width: 70px;
  flex: 0 0 auto;
}

.ai-chat-window__quick {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
  background: #ffffff;
  padding: 0.65rem 1rem;
}

.ai-chat-window__quick .button-secondary {
  min-width: 0;
  min-height: 32px;
  border-color: #cde3df;
  background: #f0fdfa;
  color: var(--accent-strong);
  font-size: 0.86rem;
  padding: 0.35rem 0.55rem;
}

.ai-chat-window__quick .button-secondary:hover {
  background: #ccfbf1;
}

.ai-chat-window__notice {
  margin: 0;
  border-bottom: 1px solid #fecdd3;
  background: #fff1f2;
  color: #9f1239;
  font-size: 0.84rem;
  padding: 0.55rem 1rem;
}

.ai-chat-window__body {
  height: min(620px, calc(100vh - 220px));
  min-height: 440px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.ai-chat-window__body > * {
  height: 100%;
}

.ai-chat-window :deep([data-copilotkit]) {
  overflow: hidden;
  border-radius: 0 0 8px 8px;
}

.ai-chat-window__upload-button {
  width: 36px;
  height: 36px;
  min-height: 36px;
  border: 1px solid var(--accent) !important;
  border-radius: 12px;
  background: #ecfdf5 !important;
  color: var(--accent);
  box-shadow: 0 1px 4px rgba(15, 118, 110, 0.18);
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.ai-chat-window__upload-button:hover {
  background: #d1fae5 !important;
  color: var(--accent-strong);
}

.ai-chat-launcher {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 80;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  box-shadow: 0 18px 44px rgba(18, 28, 45, 0.24);
  padding: 0;
}

@media (max-width: 720px) {
  .ai-chat-window {
    right: 1rem;
    bottom: 1rem;
    width: calc(100vw - 2rem);
  }

  .ai-chat-window__header {
    align-items: flex-start;
  }

  .ai-chat-window__quick {
    grid-template-columns: 1fr;
  }

  .ai-chat-window__body,
  .ai-chat-window__body > * {
    height: 480px;
    min-height: 480px;
  }
}
</style>
