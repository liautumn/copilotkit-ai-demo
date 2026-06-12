<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { useSchoolStore, type Gender, type Student } from '@/stores/school'

const school = useSchoolStore()
const editingId = ref('')
const isFormOpen = ref(false)
const keyword = ref('')
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

async function importStudents(uploadFile: UploadFile) {
  const file = uploadFile.raw
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
    ElMessage.success(importMessage.value)
  } catch (error) {
    importMessage.value = `导入失败：${error instanceof Error ? error.message : '文件格式无法解析'}`
    ElMessage.error(importMessage.value)
  } finally {
    return false
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
        <el-button type="primary" @click="openCreateStudent">新增学生</el-button>
        <el-upload
          accept=".xlsx,.xls"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="importStudents"
        >
          <el-button>导入 Excel</el-button>
        </el-upload>
        <el-button @click="exportStudents">导出 Excel</el-button>
        <el-button @click="school.resetSchoolData">重置数据</el-button>
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
          <el-input v-model="keyword" clearable placeholder="搜索学号、姓名、电话、班级" style="max-width: 320px" />
        </div>
        <el-alert v-if="importMessage" :title="importMessage" type="success" :closable="false" show-icon />

        <el-table :data="filteredStudents" border stripe empty-text="暂无学生">
          <el-table-column prop="studentNo" label="学号" min-width="120" />
          <el-table-column prop="name" label="姓名" min-width="100" />
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column prop="age" label="年龄" width="80" />
          <el-table-column prop="phone" label="电话" min-width="140" />
          <el-table-column label="班级" min-width="130">
            <template #default="{ row }">
              <el-tag :type="row.classId ? 'success' : 'info'">
                {{ school.getClassName(row.classId) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editStudent(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteStudent(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <el-dialog v-model="isFormOpen" :title="formTitle" width="520px" @closed="resetForm">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="学号" required>
          <el-input v-model="form.studentNo" placeholder="例如：2026004" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="学生姓名" />
        </el-form-item>
        <el-form-item label="性别" required>
          <el-radio-group v-model="form.gender">
            <el-radio-button label="男" value="男" />
            <el-radio-button label="女" value="女" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄" required>
          <el-input-number v-model="form.age" :min="1" :max="120" />
        </el-form-item>
        <el-form-item label="电话" required>
          <el-input v-model="form.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="form.classId" placeholder="未分班" clearable style="width: 100%">
            <el-option label="未分班" value="" />
            <el-option
              v-for="schoolClass in school.classes"
              :key="schoolClass.id"
              :label="schoolClass.name"
              :value="schoolClass.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeForm">取消</el-button>
        <el-button type="primary" @click="submitStudent">
          {{ editingId ? '保存学生' : '新增学生' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
