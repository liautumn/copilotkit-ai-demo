<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useSchoolStore, type SchoolClass } from '@/stores/school'

const school = useSchoolStore()
const editingId = ref('')
const isFormOpen = ref(false)
const selectedClassId = ref(school.classes[0]?.id ?? '')
const addStudentId = ref('')
const form = reactive({
  name: '',
  grade: '',
  headTeacher: '',
  room: '',
})

const selectedClass = computed(() => school.classes.find((item) => item.id === selectedClassId.value) ?? null)
const selectedClassStudents = computed(() =>
  selectedClass.value ? school.getStudentsByClass(selectedClass.value.id) : [],
)
const availableStudents = computed(() => school.students.filter((student) => student.classId !== selectedClassId.value))
const formTitle = computed(() => (editingId.value ? '编辑班级' : '新增班级'))

function resetForm() {
  editingId.value = ''
  form.name = ''
  form.grade = ''
  form.headTeacher = ''
  form.room = ''
}

function openCreateClass() {
  resetForm()
  isFormOpen.value = true
}

function closeForm() {
  resetForm()
  isFormOpen.value = false
}

function editClass(schoolClass: SchoolClass) {
  editingId.value = schoolClass.id
  form.name = schoolClass.name
  form.grade = schoolClass.grade
  form.headTeacher = schoolClass.headTeacher
  form.room = schoolClass.room
  isFormOpen.value = true
}

function submitClass() {
  const payload = {
    name: form.name,
    grade: form.grade,
    headTeacher: form.headTeacher,
    room: form.room,
  }
  if (editingId.value) {
    school.updateClass(editingId.value, payload)
  } else {
    const created = school.createClass(payload)
    selectedClassId.value = created.id
  }
  closeForm()
}

function deleteClass(id: string) {
  school.deleteClass(id)
  if (selectedClassId.value === id) selectedClassId.value = school.classes[0]?.id ?? ''
  if (editingId.value === id) closeForm()
}

function assignStudent() {
  if (!selectedClassId.value || !addStudentId.value) return
  school.assignStudentToClass(addStudentId.value, selectedClassId.value)
  addStudentId.value = ''
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">班级</p>
        <h1>班级管理</h1>
        <p>维护班级信息，并把已有学生添加到指定班级。</p>
      </div>
      <el-button type="primary" @click="openCreateClass">新增班级</el-button>
    </header>

    <div class="stats-grid">
      <div>
        <span>班级总数</span>
        <strong>{{ school.classes.length }}</strong>
      </div>
      <div>
        <span>班级学生</span>
        <strong>{{ selectedClassStudents.length }}</strong>
      </div>
      <div>
        <span>未分班学生</span>
        <strong>{{ school.students.filter((student) => !student.classId).length }}</strong>
      </div>
    </div>

    <div class="content-grid content-grid--single">
      <section class="panel table-panel">
        <div class="table-toolbar">
          <h2>班级列表</h2>
          <el-select v-model="selectedClassId" placeholder="选择班级" style="max-width: 260px">
            <el-option
              v-for="schoolClass in school.classes"
              :key="schoolClass.id"
              :label="schoolClass.name"
              :value="schoolClass.id"
            />
          </el-select>
        </div>

        <div class="class-grid">
          <article
            v-for="schoolClass in school.classes"
            :key="schoolClass.id"
            class="class-card"
            :class="{ 'class-card--active': selectedClassId === schoolClass.id }"
            @click="selectedClassId = schoolClass.id"
          >
            <div>
              <strong>{{ schoolClass.name }}</strong>
              <span>{{ schoolClass.grade }} · {{ schoolClass.room }}</span>
              <span>班主任：{{ schoolClass.headTeacher }}</span>
              <span>学生：{{ school.getStudentsByClass(schoolClass.id).length }} 人</span>
            </div>
            <div class="row-actions">
              <el-button size="small" @click.stop="editClass(schoolClass)">编辑</el-button>
              <el-button size="small" type="danger" @click.stop="deleteClass(schoolClass.id)">删除</el-button>
            </div>
          </article>
        </div>

        <section v-if="selectedClass" class="member-panel">
          <div class="table-toolbar">
            <div>
              <h2>{{ selectedClass.name }}学生</h2>
              <p>{{ selectedClass.grade }} · {{ selectedClass.room }}</p>
            </div>
            <div class="inline-form">
              <el-select v-model="addStudentId" clearable placeholder="选择学生" style="min-width: 260px">
                <el-option
                  v-for="student in availableStudents"
                  :key="student.id"
                  :label="`${student.name} · ${student.studentNo} · ${school.getClassName(student.classId)}`"
                  :value="student.id"
                />
              </el-select>
              <el-button type="primary" :disabled="!addStudentId" @click="assignStudent">添加学生</el-button>
            </div>
          </div>

          <el-table :data="selectedClassStudents" border stripe empty-text="这个班级还没有学生">
            <el-table-column prop="studentNo" label="学号" min-width="120" />
            <el-table-column prop="name" label="姓名" min-width="100" />
            <el-table-column prop="gender" label="性别" width="80" />
            <el-table-column prop="age" label="年龄" width="80" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="school.removeStudentFromClass(row.id)">移出班级</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </section>
    </div>

    <el-dialog v-model="isFormOpen" :title="formTitle" width="520px" @closed="resetForm">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="班级名称" required>
          <el-input v-model="form.name" placeholder="例如：一年级三班" />
        </el-form-item>
        <el-form-item label="年级" required>
          <el-input v-model="form.grade" placeholder="例如：一年级" />
        </el-form-item>
        <el-form-item label="班主任" required>
          <el-input v-model="form.headTeacher" placeholder="班主任姓名" />
        </el-form-item>
        <el-form-item label="教室" required>
          <el-input v-model="form.room" placeholder="例如：A103" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeForm">取消</el-button>
        <el-button type="primary" @click="submitClass">
          {{ editingId ? '保存班级' : '新增班级' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.class-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  padding: 1rem;
}

.class-card--active {
  border-color: var(--accent);
  background: #ecfdf5;
}

.class-card > div:first-child {
  display: grid;
  gap: 0.25rem;
}

.class-card strong {
  font-size: 1rem;
}

.class-card span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.member-panel {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
