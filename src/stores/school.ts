import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type Gender = '男' | '女'

export type Student = {
  id: string
  studentNo: string
  name: string
  gender: Gender
  age: number
  phone: string
  classId: string
}

export type SchoolClass = {
  id: string
  name: string
  grade: string
  headTeacher: string
  room: string
}

export type StudentInput = Omit<Student, 'id'> & { id?: string }
export type ClassInput = Omit<SchoolClass, 'id'> & { id?: string }

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export const useSchoolStore = defineStore('school', () => {
  const students = ref<Student[]>([
    {
      id: 'stu-1001',
      studentNo: '2026001',
      name: '林一鸣',
      gender: '男',
      age: 12,
      phone: '13800000001',
      classId: 'class-1',
    },
    {
      id: 'stu-1002',
      studentNo: '2026002',
      name: '周雨桐',
      gender: '女',
      age: 12,
      phone: '13800000002',
      classId: 'class-1',
    },
    {
      id: 'stu-1003',
      studentNo: '2026003',
      name: '陈安',
      gender: '男',
      age: 13,
      phone: '13800000003',
      classId: '',
    },
  ])

  const classes = ref<SchoolClass[]>([
    {
      id: 'class-1',
      name: '一年级一班',
      grade: '一年级',
      headTeacher: '王老师',
      room: 'A101',
    },
    {
      id: 'class-2',
      name: '一年级二班',
      grade: '一年级',
      headTeacher: '李老师',
      room: 'A102',
    },
  ])

  const schoolSnapshot = computed(() => ({
    students: students.value.map((student) => ({
      ...student,
      className: getClassName(student.classId),
    })),
    classes: classes.value.map((schoolClass) => ({
      ...schoolClass,
      studentCount: getStudentsByClass(schoolClass.id).length,
      students: getStudentsByClass(schoolClass.id).map((student) => ({
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
      })),
    })),
    unassignedStudents: students.value
      .filter((student) => !student.classId)
      .map((student) => ({ id: student.id, name: student.name, studentNo: student.studentNo })),
  }))

  function getClassName(classId: string) {
    return classes.value.find((schoolClass) => schoolClass.id === classId)?.name ?? '未分班'
  }

  function getStudentsByClass(classId: string) {
    return students.value.filter((student) => student.classId === classId)
  }

  function createStudent(input: StudentInput) {
    const student: Student = {
      id: input.id || createId('stu'),
      studentNo: input.studentNo.trim(),
      name: input.name.trim(),
      gender: input.gender,
      age: Number(input.age),
      phone: input.phone.trim(),
      classId: input.classId || '',
    }
    students.value = [student, ...students.value]
    return student
  }

  function updateStudent(id: string, input: Partial<StudentInput>) {
    const current = students.value.find((student) => student.id === id)
    if (!current) return null
    const updated: Student = {
      ...current,
      studentNo: input.studentNo !== undefined ? input.studentNo.trim() : current.studentNo,
      name: input.name !== undefined ? input.name.trim() : current.name,
      gender: input.gender ?? current.gender,
      age: input.age !== undefined ? Number(input.age) : current.age,
      phone: input.phone !== undefined ? input.phone.trim() : current.phone,
      classId: input.classId !== undefined ? input.classId : current.classId,
    }
    students.value = students.value.map((student) => (student.id === id ? updated : student))
    return updated
  }

  function deleteStudent(id: string) {
    const current = students.value.find((student) => student.id === id)
    students.value = students.value.filter((student) => student.id !== id)
    return current ?? null
  }

  function createClass(input: ClassInput) {
    const schoolClass: SchoolClass = {
      id: input.id || createId('class'),
      name: input.name.trim(),
      grade: input.grade.trim(),
      headTeacher: input.headTeacher.trim(),
      room: input.room.trim(),
    }
    classes.value = [schoolClass, ...classes.value]
    return schoolClass
  }

  function updateClass(id: string, input: Partial<ClassInput>) {
    const current = classes.value.find((schoolClass) => schoolClass.id === id)
    if (!current) return null
    const updated: SchoolClass = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      grade: input.grade !== undefined ? input.grade.trim() : current.grade,
      headTeacher: input.headTeacher !== undefined ? input.headTeacher.trim() : current.headTeacher,
      room: input.room !== undefined ? input.room.trim() : current.room,
    }
    classes.value = classes.value.map((schoolClass) => (schoolClass.id === id ? updated : schoolClass))
    return updated
  }

  function deleteClass(id: string) {
    const current = classes.value.find((schoolClass) => schoolClass.id === id)
    classes.value = classes.value.filter((schoolClass) => schoolClass.id !== id)
    students.value = students.value.map((student) =>
      student.classId === id ? { ...student, classId: '' } : student,
    )
    return current ?? null
  }

  function assignStudentToClass(studentId: string, classId: string) {
    const student = students.value.find((item) => item.id === studentId)
    const schoolClass = classes.value.find((item) => item.id === classId)
    if (!student || !schoolClass) return null
    const updated = updateStudent(studentId, { classId })
    return updated ? { student: updated, class: schoolClass } : null
  }

  function removeStudentFromClass(studentId: string) {
    const student = students.value.find((item) => item.id === studentId)
    if (!student) return null
    return updateStudent(studentId, { classId: '' })
  }

  function resetSchoolData() {
    students.value = [
      {
        id: 'stu-1001',
        studentNo: '2026001',
        name: '林一鸣',
        gender: '男',
        age: 12,
        phone: '13800000001',
        classId: 'class-1',
      },
      {
        id: 'stu-1002',
        studentNo: '2026002',
        name: '周雨桐',
        gender: '女',
        age: 12,
        phone: '13800000002',
        classId: 'class-1',
      },
      {
        id: 'stu-1003',
        studentNo: '2026003',
        name: '陈安',
        gender: '男',
        age: 13,
        phone: '13800000003',
        classId: '',
      },
    ]
    classes.value = [
      {
        id: 'class-1',
        name: '一年级一班',
        grade: '一年级',
        headTeacher: '王老师',
        room: 'A101',
      },
      {
        id: 'class-2',
        name: '一年级二班',
        grade: '一年级',
        headTeacher: '李老师',
        room: 'A102',
      },
    ]
  }

  return {
    students,
    classes,
    schoolSnapshot,
    getClassName,
    getStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent,
    createClass,
    updateClass,
    deleteClass,
    assignStudentToClass,
    removeStudentFromClass,
    resetSchoolData,
  }
})
