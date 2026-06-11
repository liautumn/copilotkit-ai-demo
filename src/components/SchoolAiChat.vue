<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CopilotChat, useAgent, useAgentContext, useCopilotKit, useFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import { useSchoolStore } from '@/stores/school'
import ThemeToolRenderer from '@/components/ThemeToolRenderer.vue'

const threadId = 'school-ai-chat'
const router = useRouter()
const school = useSchoolStore()
const { agent } = useAgent({ agentId: 'default', threadId })
const { copilotkit } = useCopilotKit()

const open = ref(false)
const lastAction = ref('可以帮你操作学生和班级')
const canRun = computed(() => Boolean(agent.value && !agent.value.isRunning))

const schoolContext = computed(() => ({
  route: router.currentRoute.value.fullPath,
  ...school.schoolSnapshot,
}))

useAgentContext({
  description:
    '教务管理系统当前数据。包含学生、班级、每个班级的学生、未分班学生。AI 可以读取这些数据并调用工具完成学生 CRUD、班级 CRUD、班级添加学生和移出学生。',
  value: schoolContext,
})

function setAction(message: string) {
  lastAction.value = message
}

async function sendPrompt(message: string) {
  open.value = true
  if (!agent.value || agent.value.isRunning) return
  agent.value.addMessage({
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
  })
  setAction(`已发送：${message}`)
  await copilotkit.value.runAgent({
    agent: agent.value,
    forwardedProps: { source: 'school-ai-chat' },
  })
}

useFrontendTool({
  name: 'readSchoolManagementData',
  description: '读取当前学生和班级管理数据。返回学生、班级、班级成员和未分班学生。',
  parameters: z.object({}),
  handler: async () => {
    setAction('已读取教务数据')
    return school.schoolSnapshot
  },
  render: ThemeToolRenderer as any,
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
    setAction(`已跳转到${page === 'students' ? '学生管理' : '班级管理'}`)
    return { page, path }
  },
  render: ThemeToolRenderer as any,
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
    setAction(`已新增学生：${student.name}`)
    return { student, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
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
    setAction(student ? `已更新学生：${student.name}` : '未找到学生')
    return { student, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'deleteStudent',
  description: '删除学生。',
  parameters: z.object({
    id: z.string(),
  }),
  handler: async ({ id }) => {
    const student = school.deleteStudent(id)
    setAction(student ? `已删除学生：${student.name}` : '未找到学生')
    return { student, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
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
    setAction(`已新增班级：${schoolClass.name}`)
    return { class: schoolClass, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
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
    setAction(schoolClass ? `已更新班级：${schoolClass.name}` : '未找到班级')
    return { class: schoolClass, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'deleteClass',
  description: '删除班级。删除后该班学生会变为未分班。',
  parameters: z.object({
    id: z.string(),
  }),
  handler: async ({ id }) => {
    const schoolClass = school.deleteClass(id)
    setAction(schoolClass ? `已删除班级：${schoolClass.name}` : '未找到班级')
    return { class: schoolClass, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
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
    setAction(result ? `已把 ${result.student.name} 加入 ${result.class.name}` : '学生或班级不存在')
    return { result, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
})

useFrontendTool({
  name: 'removeStudentFromClass',
  description: '把学生从当前班级移出，变成未分班。',
  parameters: z.object({
    studentId: z.string(),
  }),
  handler: async ({ studentId }) => {
    const student = school.removeStudentFromClass(studentId)
    setAction(student ? `已把 ${student.name} 移出班级` : '未找到学生')
    return { student, snapshot: school.schoolSnapshot }
  },
  render: ThemeToolRenderer as any,
})
</script>

<template>
  <div v-if="open" class="ai-chat-window">
    <header class="ai-chat-window__header">
      <div>
        <strong>AI 教务助手</strong>
        <span>{{ agent?.isRunning ? '正在执行...' : lastAction }}</span>
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

    <div class="ai-chat-window__body">
      <CopilotChat
        agent-id="default"
        :thread-id="threadId"
      />
    </div>
  </div>

  <button v-else class="ai-chat-launcher" @click="open = true">
    AI
  </button>
</template>
