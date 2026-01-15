<script setup lang="ts">
import { ref, nextTick } from "vue";
import MarkdownRenderer from "./components/MarkdownRenderer.vue";
import SidePanel from "./components/SidePanel.vue";
import { apiService } from "./services/api";

interface Message {
 id: number;
 type: "user" | "assistant";
 content: string;
 timestamp: number;
 isLoading?: boolean;
}

const prompt = ref("");
const messages = ref<Message[]>([]);
const isLoading = ref(false);
const activeRoute = ref("/chat");
let messageIdCounter = 0;

const routes = [
 { path: "/chat", label: "Chat" },
 { path: "/help", label: "Aide" },
 { path: "/status", label: "Status" },
];

async function sendPrompt() {
 if (!prompt.value.trim() || isLoading.value) return;

 const userMessage = prompt.value;
 prompt.value = "";

 // Ajouter le message de l'utilisateur immédiatement
 messages.value.push({
  id: messageIdCounter++,
  type: "user",
  content: userMessage,
  timestamp: Date.now(),
 });

 // Ajouter un message de loader
 const loaderMessage: Message = {
  id: messageIdCounter++,
  type: "assistant",
  content: "",
  timestamp: Date.now(),
  isLoading: true,
 };
 messages.value.push(loaderMessage);

 isLoading.value = true;

 try {
  const response = await apiService.sendPrompt(userMessage);

  // Remplacer le loader par la vraie réponse
  const loaderIndex = messages.value.findIndex(
   (m) => m.id === loaderMessage.id,
  );
  if (loaderIndex !== -1) {
   messages.value[loaderIndex] = {
    id: loaderMessage.id,
    type: "assistant",
    content: response.content,
    timestamp: response.timestamp,
    isLoading: false,
   };
  }
 } catch (error) {
  // En cas d'erreur, remplacer le loader par un message d'erreur
  const loaderIndex = messages.value.findIndex(
   (m) => m.id === loaderMessage.id,
  );
  if (loaderIndex !== -1) {
   messages.value[loaderIndex] = {
    id: loaderMessage.id,
    type: "assistant",
    content: `**Erreur**: ${error instanceof Error ? error.message : "Impossible de contacter le serveur"}`,
    timestamp: Date.now(),
    isLoading: false,
   };
  }
 } finally {
  isLoading.value = false;
  // Scroll vers le bas
  await nextTick();
  const main = document.querySelector(".main");
  if (main) {
   main.scrollTop = main.scrollHeight;
  }
 }
}

async function fetchRoute(path: string) {
 activeRoute.value = path;
 // Cette fonction pourrait être implémentée plus tard si nécessaire
}

function handleKeydown(event: KeyboardEvent) {
 if (event.key === "Enter" && !event.shiftKey) {
  event.preventDefault();
  sendPrompt();
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

   <SidePanel />
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
 background-color: var(--ui-color-background-primary);
 color: var(--ui-color-text-primary);
}

.header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: var(--ui-spacing-base) var(--ui-spacing-xl);
 background-color: var(--ui-color-background-secondary);
 border-bottom: 1px solid var(--ui-color-border-default);
}

.header h1 {
 font-size: var(--ui-font-size-xl);
 margin: 0;
 color: var(--ui-color-text-strong);
}

.nav {
 display: flex;
 gap: var(--ui-gap-sm);
}

.nav-btn {
 padding: var(--ui-spacing-sm) var(--ui-spacing-base);
 border: 1px solid var(--ui-color-border-subtle);
 border-radius: var(--ui-radius-base);
 background: transparent;
 color: var(--ui-color-text-primary);
 cursor: pointer;
 transition: all var(--ui-transition-fast);
}

.nav-btn:hover {
 background-color: var(--ui-color-background-elevated);
}

.nav-btn.active {
 background-color: var(--ui-color-primary);
 border-color: var(--ui-color-primary);
 color: var(--ui-color-text-strong);
}

.main {
 flex: 1;
 overflow-y: auto;
 overflow-x: hidden;
 padding: var(--ui-spacing-xl);
 position: relative;
}

.content-area {
 max-width: var(--ui-width-content-max);
 margin: 0 auto;
}

.messages-container {
 display: flex;
 flex-direction: column;
 gap: var(--ui-gap-base);
}

.message {
 display: flex;
 flex-direction: column;
 max-width: 80%;
 animation: var(--ui-animation-slide-in);
}

.message.user {
 align-self: flex-end;
}

.message.assistant {
 align-self: flex-start;
}

.message-content {
 background-color: var(--ui-color-background-secondary);
 border-radius: var(--ui-radius-lg);
 padding: var(--ui-spacing-base) var(--ui-spacing-lg);
 word-wrap: break-word;
}

.message.user .message-content {
 background-color: var(--ui-color-primary);
 color: var(--ui-color-text-strong);
}

.user-text {
 white-space: pre-wrap;
 line-height: var(--ui-line-height-tight);
}

.message.assistant .message-content {
 background-color: var(--ui-color-background-tertiary);
}

.message-meta {
 display: flex;
 padding: var(--ui-spacing-xs) var(--ui-spacing-sm);
 font-size: var(--ui-font-size-xs);
}

.message.user .message-meta {
 justify-content: flex-end;
}

.message.assistant .message-meta {
 justify-content: flex-start;
}

.timestamp {
 color: var(--ui-color-text-tertiary);
}

.loading {
 display: flex;
 align-items: center;
 gap: var(--ui-gap-md);
 color: var(--ui-color-text-secondary);
}

.spinner {
 width: 20px;
 height: 20px;
 border: 2px solid var(--ui-color-background-elevated);
 border-top-color: var(--ui-color-primary);
 border-radius: var(--ui-radius-full);
 animation: var(--ui-animation-spin);
}

.placeholder {
 text-align: center;
 padding: var(--ui-spacing-2xl);
 color: var(--ui-color-text-tertiary);
}

.footer {
 padding: var(--ui-spacing-base) var(--ui-spacing-xl);
 background-color: var(--ui-color-background-secondary);
 border-top: 1px solid var(--ui-color-border-default);
}

.input-container {
 display: flex;
 gap: var(--ui-gap-base);
 max-width: var(--ui-width-content-max);
 margin: 0 auto;
}

textarea {
 flex: 1;
 padding: var(--ui-spacing-md) var(--ui-spacing-base);
 border: 1px solid var(--ui-color-border-subtle);
 border-radius: var(--ui-radius-md);
 background-color: var(--ui-color-background-primary);
 color: var(--ui-color-text-primary);
 font-family: inherit;
 font-size: var(--ui-font-size-base);
 resize: none;
}

textarea:focus {
 outline: none;
 border-color: var(--ui-color-primary);
}

textarea:disabled {
 opacity: 0.5;
}

.send-btn {
 padding: var(--ui-spacing-md) var(--ui-spacing-lg);
 border: none;
 border-radius: var(--ui-radius-md);
 background-color: var(--ui-color-primary);
 color: var(--ui-color-text-strong);
 font-weight: var(--ui-font-weight-medium);
 cursor: pointer;
 transition: background-color var(--ui-transition-fast);
}

.send-btn:hover:not(:disabled) {
 background-color: var(--ui-color-primary-hover);
}

.send-btn:disabled {
 opacity: 0.5;
 cursor: not-allowed;
}
</style>
