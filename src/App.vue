<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { CopilotKitProvider, CopilotPopup, type VueFrontendTool } from '@copilotkit/vue/v2'
import { z } from 'zod'
import { useSchoolStore } from '@/stores/school'

type ChatLabels = InstanceType<typeof CopilotPopup>['$props']['labels']
type Gender = '男' | '女'
type NavigateSchoolPageInput = { page: 'students' | 'classes' }
type CreateStudentInput = {
  studentNo: string
  name: string
  gender: Gender
  age: number
  phone: string
  classId?: string
}
type UpdateStudentInput = {
  id: string
  studentNo?: string
  name?: string
  gender?: Gender
  age?: number
  phone?: string
  classId?: string
}
type DeleteByIdInput = { id: string }
type CreateClassInput = {
  name: string
  grade: string
  headTeacher: string
  room: string
}
type UpdateClassInput = Partial<CreateClassInput> & { id: string }
type AssignStudentToClassInput = { studentId: string; classId: string }
type StudentIdInput = { studentId: string }

const runtimeUrl = import.meta.env.VITE_COPILOT_RUNTIME_URL ?? '/api/copilotkit'
const router = useRouter()
const school = useSchoolStore()

const chatLabels = {
  chatInputPlaceholder: '输入指令，例如：新增学生张三并加入一年级一班',
  modalHeaderTitle: 'AI 教务助手',
  welcomeMessageText: '我可以帮你管理学生、班级和班级成员。',
} as unknown as ChatLabels

function defineTool<T extends Record<string, unknown>>(tool: VueFrontendTool<T>): VueFrontendTool {
  return tool as VueFrontendTool
}

const frontendTools: VueFrontendTool[] = [
  defineTool({
    name: 'readSchoolManagementData',
    description: '读取当前学生、班级、班级成员和未分班学生。',
    parameters: z.object({}),
    handler: async () => school.schoolSnapshot,
  }),
  defineTool<NavigateSchoolPageInput>({
    name: 'navigateSchoolPage',
    description: '跳转到学生管理或班级管理页面。',
    parameters: z.object({
      page: z.enum(['students', 'classes']),
    }),
    handler: async ({ page }) => {
      const path = page === 'students' ? '/students' : '/classes'
      await router.push(path)
      return { page, path }
    },
  }),
  defineTool<CreateStudentInput>({
    name: 'createStudent',
    description: '新增学生。classId 为空表示未分班；如需加入班级，请先读取数据获取 classId。',
    parameters: z.object({
      studentNo: z.string(),
      name: z.string(),
      gender: z.enum(['男', '女']),
      age: z.number().int().min(1),
      phone: z.string(),
      classId: z.string().optional(),
    }),
    handler: async (input) => ({
      student: school.createStudent({ ...input, classId: input.classId ?? '' }),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<UpdateStudentInput>({
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
    handler: async ({ id, ...input }) => ({
      student: school.updateStudent(id, input),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<DeleteByIdInput>({
    name: 'deleteStudent',
    description: '删除学生。',
    parameters: z.object({
      id: z.string(),
    }),
    handler: async ({ id }) => ({
      student: school.deleteStudent(id),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<CreateClassInput>({
    name: 'createClass',
    description: '新增班级。',
    parameters: z.object({
      name: z.string(),
      grade: z.string(),
      headTeacher: z.string(),
      room: z.string(),
    }),
    handler: async (input) => ({
      class: school.createClass(input),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<UpdateClassInput>({
    name: 'updateClass',
    description: '更新班级。只传需要修改的字段。',
    parameters: z.object({
      id: z.string(),
      name: z.string().optional(),
      grade: z.string().optional(),
      headTeacher: z.string().optional(),
      room: z.string().optional(),
    }),
    handler: async ({ id, ...input }) => ({
      class: school.updateClass(id, input),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<DeleteByIdInput>({
    name: 'deleteClass',
    description: '删除班级。删除后该班学生会变为未分班。',
    parameters: z.object({
      id: z.string(),
    }),
    handler: async ({ id }) => ({
      class: school.deleteClass(id),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<AssignStudentToClassInput>({
    name: 'assignStudentToClass',
    description: '把学生加入班级。如果学生已在其他班，会自动转入目标班级。',
    parameters: z.object({
      studentId: z.string(),
      classId: z.string(),
    }),
    handler: async ({ studentId, classId }) => ({
      result: school.assignStudentToClass(studentId, classId),
      snapshot: school.schoolSnapshot,
    }),
  }),
  defineTool<StudentIdInput>({
    name: 'removeStudentFromClass',
    description: '把学生从当前班级移出，变成未分班。',
    parameters: z.object({
      studentId: z.string(),
    }),
    handler: async ({ studentId }) => ({
      student: school.removeStudentFromClass(studentId),
      snapshot: school.schoolSnapshot,
    }),
  }),
]
</script>

<template>
  <CopilotKitProvider
    :runtime-url="runtimeUrl"
    :frontend-tools="frontendTools"
    :debug="{ events: false, lifecycle: false, verbose: false }"
    :show-dev-console="false"
  >
    <div class="app-shell">
      <aside class="app-nav">
        <RouterLink class="brand" to="/students">
          <span class="brand-mark">教</span>
          <span>
            <strong>教务管理</strong>
            <small>学生与班级 CRUD</small>
          </span>
        </RouterLink>

        <nav>
          <RouterLink to="/students">
            <small>学生</small>
            <span>学生管理</span>
          </RouterLink>
          <RouterLink to="/classes">
            <small>班级</small>
            <span>班级管理</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="app-content">
        <RouterView />
      </main>
    </div>

    <CopilotPopup
      agent-id="default"
      thread-id="school-ai-chat"
      :labels="chatLabels"
      :default-open="false"
      auto-scroll="pin-to-bottom"
    />
  </CopilotKitProvider>
</template>
