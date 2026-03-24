<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const user = ref(null)
const tasks = ref([])
const newTitle = ref('')
const editingId = ref(null)
const editTitle = ref('')

onMounted(async () => {
  const { data } = await api.get('/auth/me')
  user.value = data
  if (data) loadTasks()
})

async function loadTasks() {
  const { data } = await api.get('/tasks')
  tasks.value = data
}

function login() {
  window.location.href = 'http://localhost:3000/auth/google'
}

async function logout() {
  await api.get('/auth/logout')
  user.value = null
  tasks.value = []
}

async function addTask() {
  if (!newTitle.value.trim()) return
  const { data } = await api.post('/tasks', { title: newTitle.value })
  tasks.value.push(data)
  newTitle.value = ''
}

async function toggleDone(task) {
  const { data } = await api.patch(`/tasks/${task.id}`, { done: task.done ? 0 : 1 })
  Object.assign(task, data)
}

function startEdit(task) {
  editingId.value = task.id
  editTitle.value = task.title
}

async function saveEdit(task) {
  const { data } = await api.patch(`/tasks/${task.id}`, { title: editTitle.value })
  Object.assign(task, data)
  editingId.value = null
}

async function deleteTask(id) {
  await api.delete(`/tasks/${id}`)
  tasks.value = tasks.value.filter(t => t.id !== id)
}
</script>

<template>
  <div class="app">
    <header>
      <h1>Task Manager</h1>
      <div v-if="user">
        <span>{{ user.name }}</span>
        <button @click="logout">Logout</button>
      </div>
      <button v-else @click="login">Sign in with Google</button>
    </header>

    <main v-if="user">
      <form @submit.prevent="addTask">
        <input v-model="newTitle" placeholder="New task..." />
        <button type="submit">Add</button>
      </form>

      <ul>
        <li v-for="task in tasks" :key="task.id">
          <input type="checkbox" :checked="task.done" @change="toggleDone(task)" />
          <template v-if="editingId === task.id">
            <input v-model="editTitle" @keyup.enter="saveEdit(task)" @blur="saveEdit(task)" />
          </template>
          <span v-else :class="{ done: task.done }" @dblclick="startEdit(task)">{{ task.title }}</span>
          <button @click="deleteTask(task.id)">✕</button>
        </li>
      </ul>
    </main>

    <p v-else class="hint">Sign in to manage your tasks.</p>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #f5f5f5; }
.app { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { font-size: 1.4rem; }
header span { margin-right: 8px; font-size: .9rem; color: #555; }
form { display: flex; gap: 8px; margin-bottom: 16px; }
input[type=text], input:not([type]) { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
button { padding: 8px 14px; border: none; border-radius: 4px; background: #4285f4; color: #fff; cursor: pointer; }
button:hover { background: #3367d6; }
ul { list-style: none; }
li { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid #eee; }
li input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }
li span { flex: 1; }
li button { background: #e53e3e; padding: 4px 8px; }
li button:hover { background: #c53030; }
.done { text-decoration: line-through; color: #aaa; }
.hint { text-align: center; color: #888; margin-top: 24px; }
</style>
