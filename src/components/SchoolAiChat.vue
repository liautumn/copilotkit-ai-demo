<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  CopilotChat,
  useAgent,
  useAgentContext,
  useCopilotKit,
  useFrontendTool,
} from '@copilotkit/vue/v2'
import { z } from 'zod'
import { useSchoolStore, type SchoolClass, type Student } from '@/stores/school'

const threadId = 'school-ai-chat-v2'
const router = useRouter()
const school = useSchoolStore()
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()
type CurrentAgent = NonNullable<typeof agent.value>

const open = ref(false)
const statusText = ref('可以帮你操作学生和班级')
const runNotice = ref('')
const canRun = computed(() => Boolean(agent.value && !agent.value.isRunning))
const patchedAgents = new WeakSet<object>()
const attachmentConfig = {
  enabled: true,
  accept: '.pdf,.txt,.md,.json,image/*',
  maxSize: 10 * 1024 * 1024,
  onUpload: async (file: File) => {
    const base64 = await readFileAsBase64(file)
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || '文件上传失败')
    }

    const data = await response.json() as {
      url: string
      key: string
      originalName: string
      mimeType: string
      size: number
    }

    return {
      type: 'data' as const,
      value: base64,
      mimeType: data.mimeType || file.type,
      metadata: {
        url: data.url,
        key: data.key,
        originalName: data.originalName || file.name,
        size: data.size || file.size,
      },
    }
  },
  onUploadFailed: (error: { message?: string }) => {
    console.error('上传失败：', error.message)
  },
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('文件读取失败'))
        return
      }

      const base64 = result.split(',')[1]
      if (!base64) {
        reject(new Error('文件读取失败'))
        return
      }

      resolve(base64)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function showRunNotice(message: string) {
  runNotice.value = message
  setTimeout(() => {
    if (runNotice.value === message) runNotice.value = ''
  }, 8000)
}

function studentData(student: Student | null | undefined) {
  if (!student) return null
  return {
    id: student.id,
    studentNo: student.studentNo,
    name: student.name,
    gender: student.gender,
    age: student.age,
    phone: student.phone,
    classId: student.classId,
    className: school.getClassName(student.classId),
  }
}

function classData(schoolClass: SchoolClass | null | undefined) {
  if (!schoolClass) return null
  const students = school.getStudentsByClass(schoolClass.id)
  return {
    id: schoolClass.id,
    name: schoolClass.name,
    grade: schoolClass.grade,
    headTeacher: schoolClass.headTeacher,
    room: schoolClass.room,
    studentCount: students.length,
    students: students.map((student) => ({
      id: student.id,
      name: student.name,
      studentNo: student.studentNo,
    })),
  }
}

function assignmentData(result: { student: Student, class: SchoolClass } | null) {
  if (!result) return null
  return {
    student: studentData(result.student),
    class: classData(result.class),
  }
}

function getSchoolSnapshot() {
  return {
    students: school.students.map((student) => studentData(student)),
    classes: school.classes.map((schoolClass) => classData(schoolClass)),
    unassignedStudents: school.students
      .filter((student) => !student.classId)
      .map((student) => ({
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
      })),
  }
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
  return `AI 处理失败：${message}`
}

function handleChatError(event: { error: Error }) {
  showRunNotice(formatAiError(event.error))
}

function toPlainClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value))) as T
}

function patchAgentMessages(currentAgent: CurrentAgent) {
  const rawAgent = toRaw(currentAgent) as CurrentAgent & object
  if (patchedAgents.has(rawAgent)) return

  rawAgent.setMessages(toPlainClone(rawAgent.messages))
  const originalAddMessage = rawAgent.addMessage.bind(rawAgent)
  rawAgent.addMessage = ((message: Parameters<CurrentAgent['addMessage']>[0]) => {
    originalAddMessage(toPlainClone(message))
  }) as CurrentAgent['addMessage']
  patchedAgents.add(rawAgent)
}

function findUncloneablePath(value: unknown, path = 'messages', seen = new WeakSet<object>()): string | null {
  try {
    structuredClone(value)
    return null
  } catch {
    if (!value || typeof value !== 'object') return path
    if (seen.has(value)) return null
    seen.add(value)

    for (const [key, entry] of Object.entries(value)) {
      const entryPath = findUncloneablePath(entry, `${path}.${key}`, seen)
      if (entryPath) return entryPath
    }

    return path
  }
}

async function sendPrompt(message: string) {
  open.value = true
  if (!agent.value || agent.value.isRunning) return
  agent.value.addMessage({
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
  })
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
    patchAgentMessages(currentAgent)
    const subscription = currentAgent.subscribe({
      onMessagesChanged: ({ messages }) => {
        const uncloneablePath = findUncloneablePath(messages)
        if (uncloneablePath) console.warn('CopilotKit messages contain an uncloneable value at:', uncloneablePath)
      },
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
    return toolResult(`已新增学生：${student.name}`, { student: studentData(student) })
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
      student: studentData(student),
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
      student: studentData(student),
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
    return toolResult(`已新增班级：${schoolClass.name}`, { class: classData(schoolClass) })
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
      class: classData(schoolClass),
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
      class: classData(schoolClass),
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
      { result: assignmentData(result) },
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
      student: studentData(student),
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
      <el-button plain @click="open = false">收起</el-button>
    </header>

    <div class="ai-chat-window__quick">
      <el-button
        plain
        :disabled="!canRun"
        @click="sendPrompt('读取当前学生和班级数据，给我一个摘要')"
      >
        读取数据
      </el-button>
      <el-button
        plain
        :disabled="!canRun"
        @click="sendPrompt('帮我新增学生赵明，学号 2026004，男，12 岁，电话 13800000004，并加入一年级二班')"
      >
        新增学生
      </el-button>
      <el-button
        plain
        :disabled="!canRun"
        @click="sendPrompt('帮我创建一个一年级三班，班主任赵老师，教室 A103')"
      >
        新增班级
      </el-button>
    </div>

    <el-alert
      v-if="runNotice"
      class="ai-chat-window__notice"
      :title="runNotice"
      type="error"
      :closable="false"
      show-icon
    />

    <div class="ai-chat-window__body">
      <CopilotChat
        agent-id="default"
        :thread-id="threadId"
        :auto-scroll="'pin-to-bottom'"
        :on-error="handleChatError"
        :attachments="attachmentConfig"
      />
    </div>
  </div>

  <el-button v-else class="ai-chat-launcher" type="primary" circle @click="open = true">
    AI
  </el-button>
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

.ai-chat-window__header .el-button {
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

.ai-chat-window__quick .el-button {
  min-width: 0;
  min-height: 32px;
  margin-left: 0;
  font-size: 0.86rem;
  padding: 0.35rem 0.55rem;
}

.ai-chat-window__notice {
  border-radius: 0;
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
