<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useSchoolStore, type Gender, type Student } from '@/stores/school'

const school = useSchoolStore()
const editingId = ref('')
const isFormOpen = ref(false)
const keyword = ref('')
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
        <button class="button-secondary" @click="school.resetSchoolData">重置数据</button>
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
