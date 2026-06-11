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
      <button @click="openCreateClass">新增班级</button>
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
          <select v-model="selectedClassId" class="search-input">
            <option v-for="schoolClass in school.classes" :key="schoolClass.id" :value="schoolClass.id">
              {{ schoolClass.name }}
            </option>
          </select>
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
              <button class="button-secondary" @click.stop="editClass(schoolClass)">编辑</button>
              <button class="button-danger" @click.stop="deleteClass(schoolClass.id)">删除</button>
            </div>
          </article>
        </div>

        <section v-if="selectedClass" class="member-panel">
          <div class="table-toolbar">
            <div>
              <h2>{{ selectedClass.name }}学生</h2>
              <p>{{ selectedClass.grade }} · {{ selectedClass.room }}</p>
            </div>
            <form class="inline-form" @submit.prevent="assignStudent">
              <select v-model="addStudentId">
                <option value="">选择学生</option>
                <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                  {{ student.name }} · {{ student.studentNo }} · {{ school.getClassName(student.classId) }}
                </option>
              </select>
              <button type="submit" :disabled="!addStudentId">添加学生</button>
            </form>
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>年龄</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in selectedClassStudents" :key="student.id">
                  <td>{{ student.studentNo }}</td>
                  <td>{{ student.name }}</td>
                  <td>{{ student.gender }}</td>
                  <td>{{ student.age }}</td>
                  <td>
                    <button class="button-secondary" @click="school.removeStudentFromClass(student.id)">
                      移出班级
                    </button>
                  </td>
                </tr>
                <tr v-if="selectedClassStudents.length === 0">
                  <td colspan="5" class="empty-cell">这个班级还没有学生</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>

    <div v-if="isFormOpen" class="modal-backdrop" role="presentation" @click.self="closeForm">
      <section class="modal" role="dialog" aria-modal="true" :aria-label="formTitle">
        <header class="modal__header">
          <h2>{{ formTitle }}</h2>
          <button type="button" class="button-secondary" @click="closeForm">关闭</button>
        </header>

        <form class="form-panel" @submit.prevent="submitClass">
          <label>
            <span>班级名称</span>
            <input v-model="form.name" required placeholder="例如：一年级三班" />
          </label>
          <label>
            <span>年级</span>
            <input v-model="form.grade" required placeholder="例如：一年级" />
          </label>
          <label>
            <span>班主任</span>
            <input v-model="form.headTeacher" required placeholder="班主任姓名" />
          </label>
          <label>
            <span>教室</span>
            <input v-model="form.room" required placeholder="例如：A103" />
          </label>
          <div class="button-row modal__actions">
            <button type="submit">{{ editingId ? '保存班级' : '新增班级' }}</button>
            <button type="button" class="button-secondary" @click="closeForm">取消</button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>
