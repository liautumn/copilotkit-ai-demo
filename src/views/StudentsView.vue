<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useSchoolStore, type Gender, type Student } from '@/stores/school'

const school = useSchoolStore()
const editingId = ref('')
const isFormOpen = ref(false)
const keyword = ref('')
const importInput = ref<HTMLInputElement | null>(null)
const importMessage = ref('')
const form = reactive({
  studentNo: '',
  name: '',
  gender: '男' as Gender,
  age: 12,
  phone: '',
  classId: '',
})

const filteredStudents = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return school.students
  return school.students.filter((student) =>
    [student.studentNo, student.name, student.phone, school.getClassName(student.classId)]
      .join(' ')
      .toLowerCase()
      .includes(value),
  )
})

const formTitle = computed(() => (editingId.value ? '编辑学生' : '新增学生'))

const excelHeaders = ['学号', '姓名', '性别', '年龄', '电话', '班级']

function cell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null) return String(value).trim()
  }
  return ''
}

function resolveClassId(value: string) {
  if (!value || value === '未分班') return ''
  return school.classes.find((item) => item.id === value || item.name === value)?.id ?? ''
}

function normalizeGender(value: string): Gender | null {
  if (value === '男' || value.toLowerCase() === 'male') return '男'
  if (value === '女' || value.toLowerCase() === 'female') return '女'
  return null
}

function resetForm() {
  editingId.value = ''
  form.studentNo = ''
  form.name = ''
  form.gender = '男'
  form.age = 12
  form.phone = ''
  form.classId = ''
}

function openCreateStudent() {
  resetForm()
  isFormOpen.value = true
}

function closeForm() {
  resetForm()
  isFormOpen.value = false
}

function editStudent(student: Student) {
  editingId.value = student.id
  form.studentNo = student.studentNo
  form.name = student.name
  form.gender = student.gender
  form.age = student.age
  form.phone = student.phone
  form.classId = student.classId
  isFormOpen.value = true
}

function submitStudent() {
  const payload = {
    studentNo: form.studentNo,
    name: form.name,
    gender: form.gender,
    age: form.age,
    phone: form.phone,
    classId: form.classId,
  }
  if (editingId.value) {
    school.updateStudent(editingId.value, payload)
  } else {
    school.createStudent(payload)
  }
  closeForm()
}

function deleteStudent(id: string) {
  school.deleteStudent(id)
  if (editingId.value === id) closeForm()
}

async function loadXlsx() {
  return await import('xlsx')
}

async function exportStudents() {
  const XLSX = await loadXlsx()
  const rows = school.students.map((student) => [
    student.studentNo,
    student.name,
    student.gender,
    student.age,
    student.phone,
    school.getClassName(student.classId),
  ])
  const sheet = XLSX.utils.aoa_to_sheet([excelHeaders, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '学生')
  XLSX.writeFile(workbook, `学生名单-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function openImportFile() {
  importInput.value?.click()
}

async function importStudents(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const XLSX = await loadXlsx()
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null
    if (!firstSheet) {
      importMessage.value = '导入失败：Excel 中没有可读取的工作表。'
      return
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })
    let created = 0
    let updated = 0
    let skipped = 0

    for (const row of rows) {
      const studentNo = cell(row, ['学号', 'studentNo', 'Student No'])
      const name = cell(row, ['姓名', 'name', 'Name'])
      const gender = normalizeGender(cell(row, ['性别', 'gender', 'Gender']))
      const age = Number(cell(row, ['年龄', 'age', 'Age']))
      const phone = cell(row, ['电话', 'phone', 'Phone'])
      const classId = resolveClassId(cell(row, ['班级', 'className', 'classId', 'Class']))

      if (!studentNo || !name || !gender || !Number.isFinite(age) || age < 1 || !phone) {
        skipped += 1
        continue
      }

      const existing = school.students.find((student) => student.studentNo === studentNo)
      const payload = { studentNo, name, gender, age, phone, classId }
      if (existing) {
        school.updateStudent(existing.id, payload)
        updated += 1
      } else {
        school.createStudent(payload)
        created += 1
      }
    }

    importMessage.value = `导入完成：新增 ${created} 条，更新 ${updated} 条，跳过 ${skipped} 条。`
  } catch (error) {
    importMessage.value = `导入失败：${error instanceof Error ? error.message : '文件格式无法解析'}`
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">学生</p>
        <h1>学生管理</h1>
        <p>维护学生基础信息，也可以直接把学生分配到班级。</p>
      </div>
      <div class="button-row">
        <button @click="openCreateStudent">新增学生</button>
        <button class="button-secondary" @click="openImportFile">导入 Excel</button>
        <button class="button-secondary" @click="exportStudents">导出 Excel</button>
        <button class="button-secondary" @click="school.resetSchoolData">重置数据</button>
        <input ref="importInput" class="file-input" type="file" accept=".xlsx,.xls" @change="importStudents" />
      </div>
    </header>

    <div class="stats-grid">
      <div>
        <span>学生总数</span>
        <strong>{{ school.students.length }}</strong>
      </div>
      <div>
        <span>已分班</span>
        <strong>{{ school.students.filter((student) => student.classId).length }}</strong>
      </div>
      <div>
        <span>未分班</span>
        <strong>{{ school.students.filter((student) => !student.classId).length }}</strong>
      </div>
    </div>

    <div class="content-grid content-grid--single">
      <section class="panel table-panel">
        <div class="table-toolbar">
          <h2>学生列表</h2>
          <input v-model="keyword" class="search-input" placeholder="搜索学号、姓名、电话、班级" />
        </div>
        <p v-if="importMessage" class="inline-notice">{{ importMessage }}</p>

        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th>学号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>电话</th>
                <th>班级</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in filteredStudents" :key="student.id">
                <td>{{ student.studentNo }}</td>
                <td>{{ student.name }}</td>
                <td>{{ student.gender }}</td>
                <td>{{ student.age }}</td>
                <td>{{ student.phone }}</td>
                <td>{{ school.getClassName(student.classId) }}</td>
                <td>
                  <div class="row-actions">
                    <button class="button-secondary" @click="editStudent(student)">编辑</button>
                    <button class="button-danger" @click="deleteStudent(student.id)">删除</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
                <td colspan="7" class="empty-cell">暂无学生</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div v-if="isFormOpen" class="modal-backdrop" role="presentation" @click.self="closeForm">
      <section class="modal" role="dialog" aria-modal="true" :aria-label="formTitle">
        <header class="modal__header">
          <h2>{{ formTitle }}</h2>
          <button type="button" class="button-secondary" @click="closeForm">关闭</button>
        </header>

        <form class="form-panel" @submit.prevent="submitStudent">
          <label>
            <span>学号</span>
            <input v-model="form.studentNo" required placeholder="例如：2026004" />
          </label>
          <label>
            <span>姓名</span>
            <input v-model="form.name" required placeholder="学生姓名" />
          </label>
          <label>
            <span>性别</span>
            <select v-model="form.gender">
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
          <label>
            <span>年龄</span>
            <input v-model.number="form.age" type="number" min="1" required />
          </label>
          <label>
            <span>电话</span>
            <input v-model="form.phone" required placeholder="联系电话" />
          </label>
          <label>
            <span>班级</span>
            <select v-model="form.classId">
              <option value="">未分班</option>
              <option v-for="schoolClass in school.classes" :key="schoolClass.id" :value="schoolClass.id">
                {{ schoolClass.name }}
              </option>
            </select>
          </label>
          <div class="button-row modal__actions">
            <button type="submit">{{ editingId ? '保存学生' : '新增学生' }}</button>
            <button type="button" class="button-secondary" @click="closeForm">取消</button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>
