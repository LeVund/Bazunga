<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRenderer from './components/MarkdownRenderer.vue'
import { apiService, type ApiResponse } from './services/api'

const prompt = ref('')
const response = ref<ApiResponse | null>(null)
const isLoading = ref(false)
const activeRoute = ref('/chat')

const routes = [
  { path: '/chat', label: 'Chat' },
  { path: '/help', label: 'Aide' },
  { path: '/status', label: 'Status' }
]

async function sendPrompt() {
  if (!prompt.value.trim() || isLoading.value) return

  isLoading.value = true
  try {
    response.value = await apiService.sendPrompt(prompt.value)
    prompt.value = ''
  } finally {
    isLoading.value = false
  }
}

async function fetchRoute(path: string) {
  activeRoute.value = path
  isLoading.value = true
  try {
    response.value = await apiService.fetchMarkdown(path)
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendPrompt()
  }
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>LangChain Client</h1>
      <nav class="nav">
        <button
          v-for="route in routes"
          :key="route.path"
          :class="['nav-btn', { active: activeRoute === route.path }]"
          @click="fetchRoute(route.path)"
        >
          {{ route.label }}
        </button>
      </nav>
    </header>

    <main class="main">
      <div class="content-area">
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
        <div v-else-if="response" class="response">
          <MarkdownRenderer :content="response.content" />
          <div class="meta">
            <span :class="['status', response.status]">
              {{ response.status === 'success' ? 'Succès' : 'Erreur' }}
            </span>
            <span class="timestamp">
              {{ new Date(response.timestamp).toLocaleTimeString() }}
            </span>
          </div>
        </div>
        <div v-else class="placeholder">
          <p>Sélectionnez une route ou envoyez un message pour commencer.</p>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="input-container">
        <textarea
          v-model="prompt"
          placeholder="Tapez votre message..."
          @keydown="handleKeydown"
          :disabled="isLoading"
          rows="2"
        ></textarea>
        <button
          class="send-btn"
          @click="sendPrompt"
          :disabled="isLoading || !prompt.trim()"
        >
          Envoyer
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #242424;
  border-bottom: 1px solid #333;
}

.header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #fff;
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: transparent;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: #333;
}

.nav-btn.active {
  background-color: #646cff;
  border-color: #646cff;
  color: #fff;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.content-area {
  max-width: 900px;
  margin: 0 auto;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #888;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.response {
  background-color: #242424;
  border-radius: 12px;
  padding: 1.5rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  font-size: 0.85rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.status.success {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status.error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.timestamp {
  color: #666;
}

.placeholder {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.footer {
  padding: 1rem 2rem;
  background-color: #242424;
  border-top: 1px solid #333;
}

.input-container {
  display: flex;
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

textarea {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 1rem;
  resize: none;
}

textarea:focus {
  outline: none;
  border-color: #646cff;
}

textarea:disabled {
  opacity: 0.5;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: #646cff;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #5558dd;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
