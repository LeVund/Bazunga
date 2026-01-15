<script setup lang="ts">
import { ref, nextTick } from 'vue'
import MarkdownRenderer from './components/MarkdownRenderer.vue'
import SidePanel from './components/SidePanel.vue'
import { apiService } from './services/api'

interface Message {
  id: number
  type: 'user' | 'assistant'
  content: string
  timestamp: number
  isLoading?: boolean
}

const prompt = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const activeRoute = ref('/chat')
let messageIdCounter = 0

const routes = [
  { path: '/chat', label: 'Chat' },
  { path: '/help', label: 'Aide' },
  { path: '/status', label: 'Status' }
]

async function sendPrompt() {
  if (!prompt.value.trim() || isLoading.value) return

  const userMessage = prompt.value
  prompt.value = ''

  // Ajouter le message de l'utilisateur immédiatement
  messages.value.push({
    id: messageIdCounter++,
    type: 'user',
    content: userMessage,
    timestamp: Date.now()
  })

  // Ajouter un message de loader
  const loaderMessage: Message = {
    id: messageIdCounter++,
    type: 'assistant',
    content: '',
    timestamp: Date.now(),
    isLoading: true
  }
  messages.value.push(loaderMessage)

  isLoading.value = true

  try {
    const response = await apiService.sendPrompt(userMessage)

    // Remplacer le loader par la vraie réponse
    const loaderIndex = messages.value.findIndex(m => m.id === loaderMessage.id)
    if (loaderIndex !== -1) {
      messages.value[loaderIndex] = {
        id: loaderMessage.id,
        type: 'assistant',
        content: response.content,
        timestamp: response.timestamp,
        isLoading: false
      }
    }
  } catch (error) {
    // En cas d'erreur, remplacer le loader par un message d'erreur
    const loaderIndex = messages.value.findIndex(m => m.id === loaderMessage.id)
    if (loaderIndex !== -1) {
      messages.value[loaderIndex] = {
        id: loaderMessage.id,
        type: 'assistant',
        content: `**Erreur**: ${error instanceof Error ? error.message : 'Impossible de contacter le serveur'}`,
        timestamp: Date.now(),
        isLoading: false
      }
    }
  } finally {
    isLoading.value = false
    // Scroll vers le bas
    await nextTick()
    const main = document.querySelector('.main')
    if (main) {
      main.scrollTop = main.scrollHeight
    }
  }
}

async function fetchRoute(path: string) {
  activeRoute.value = path
  // Cette fonction pourrait être implémentée plus tard si nécessaire
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
        <div v-if="messages.length === 0" class="placeholder">
          <p>Envoyez un message pour commencer la conversation.</p>
        </div>
        <div v-else class="messages-container">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.type]"
          >
            <div class="message-content">
              <div v-if="message.isLoading" class="loading">
                <div class="spinner"></div>
                <span>Le serveur réfléchit...</span>
              </div>
              <template v-else>
                <div v-if="message.type === 'user'" class="user-text">
                  {{ message.content }}
                </div>
                <MarkdownRenderer v-else :content="message.content" />
              </template>
            </div>
            <div class="message-meta">
              <span class="timestamp">
                {{ new Date(message.timestamp).toLocaleTimeString() }}
              </span>
            </div>
          </div>
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

    <SidePanel />
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

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  background-color: #242424;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  word-wrap: break-word;
}

.message.user .message-content {
  background-color: #646cff;
  color: #fff;
}

.user-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.message.assistant .message-content {
  background-color: #2a2a2a;
}

.message-meta {
  display: flex;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.message.user .message-meta {
  justify-content: flex-end;
}

.message.assistant .message-meta {
  justify-content: flex-start;
}

.timestamp {
  color: #666;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #888;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #333;
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
