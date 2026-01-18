<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from "vue";
import { Send, Square, RefreshCw } from "lucide-vue-next";
import MarkdownRenderer from "./components/MarkdownRenderer.vue";
import SidePanel from "./components/SidePanel.vue";
import MarkdownToolbar from "./components/MarkdownToolbar.vue";
import MessageActions from "./components/MessageActions.vue";
import MessageMetrics from "./components/MessageMetrics.vue";
import { apiService } from "./services/api";
import { useChatStorage } from "./composables/useChatStorage";
import type { GenerationMetrics, StoredMessage } from "@core/types";

interface Message {
  id: number;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  isLoading?: boolean;
  isStreaming?: boolean;
  isEditing?: boolean;
  editContent?: string;
  storedId?: string; // Reference to stored message ID
  metadata?: {
    metrics?: GenerationMetrics;
    isDeletedPlaceholder?: boolean;
    modelName?: string;
  };
}

// Chat storage
const {
  currentChatId,
  currentMessages: storedMessages,
  loadTree,
  selectChat,
  createChat,
  addMessage: addStoredMessage,
  clearCurrentChat,
} = useChatStorage();

// Nom du modèle courant (pourrait venir d'un state global plus tard)
const currentModelName = ref("Agent");

const prompt = ref("");
const messages = ref<Message[]>([]);
const isLoading = ref(false);
const activeRoute = ref("/chat");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const containerHeight = ref(100);
const isResizing = ref(false);
let messageIdCounter = 0;

// Tracking pour les métriques de streaming
let currentStreamingMessageId: number | null = null;
let streamStartTime: number | null = null;
let streamTokenCount = 0;

// Load stored messages when chat changes
watch(storedMessages, (newMessages) => {
  if (newMessages.length > 0) {
    messages.value = newMessages.map((m: StoredMessage) => ({
      id: messageIdCounter++,
      type: m.type,
      content: m.content,
      timestamp: m.timestamp,
      storedId: m.id,
      metadata: m.metadata,
    }));
  }
}, { immediate: true });

// Initialize
onMounted(() => {
  loadTree();
});

const routes = [
 { path: "/chat", label: "Chat" },
 { path: "/help", label: "Aide" },
 { path: "/status", label: "Status" },
];

// Vérifier si l'utilisateur est proche du bas de la zone de scroll
function isNearBottom(element: HTMLElement, threshold = 100): boolean {
 return (
  element.scrollHeight - element.scrollTop - element.clientHeight < threshold
 );
}

// Scroller vers le bas
async function scrollToBottom() {
 await nextTick();
 const chatArea = document.querySelector(".chat-area") as HTMLElement;
 if (chatArea) {
  chatArea.scrollTop = chatArea.scrollHeight;
 }
}

// Construire l'historique de conversation
function buildConversationHistory(): Array<{
 role: "user" | "assistant";
 content: string;
}> {
 return messages.value
  .filter((m) => !m.isLoading && !m.isStreaming && m.content)
  .map((m) => ({
   role: m.type,
   content: m.content,
  }));
}

// Envoyer un message avec streaming
async function sendPrompt() {
  if (!prompt.value.trim() || isLoading.value) return;

  const userMessage = prompt.value;
  prompt.value = "";

  // Create chat if needed
  let chatId = currentChatId.value;
  if (!chatId) {
    const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : "");
    const chat = await createChat(title);
    chatId = chat.id;
    await selectChat(chatId);
  }

  const userTimestamp = Date.now();

  // Ajouter le message de l'utilisateur
  messages.value.push({
    id: messageIdCounter++,
    type: "user",
    content: userMessage,
    timestamp: userTimestamp,
  });

  // Save user message to storage
  await addStoredMessage({
    type: "user",
    content: userMessage,
    timestamp: userTimestamp,
  });

  // Ajouter un message assistant vide pour le streaming
  const assistantMessage: Message = {
    id: messageIdCounter++,
    type: "assistant",
    content: "",
    timestamp: Date.now(),
    isLoading: true,
    isStreaming: true,
  };
  messages.value.push(assistantMessage);

  isLoading.value = true;

  // Scroll initial si nécessaire
  const chatArea = document.querySelector(".chat-area") as HTMLElement;
  if (chatArea && isNearBottom(chatArea)) {
    await scrollToBottom();
  }

  // Initialiser le tracking
  currentStreamingMessageId = assistantMessage.id;
  streamStartTime = Date.now();
  streamTokenCount = 0;

  try {
    await apiService.sendPromptStream(
      {
        message: userMessage,
        conversationHistory: buildConversationHistory().slice(0, -1),
      },
      {
        onStart: () => {
          const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
          if (idx !== -1) {
            messages.value[idx].isLoading = false;
          }
        },
        onContent: async (content) => {
          const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
          if (idx !== -1) {
            messages.value[idx].content += content;
            streamTokenCount += Math.ceil(content.length / 4);
            const chatArea = document.querySelector(".chat-area") as HTMLElement;
            if (chatArea && isNearBottom(chatArea)) {
              await scrollToBottom();
            }
          }
        },
        onEnd: async (metrics) => {
          const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
          if (idx !== -1) {
            messages.value[idx].isStreaming = false;
            messages.value[idx].metadata = { metrics };

            // Save assistant message to storage
            await addStoredMessage({
              type: "assistant",
              content: messages.value[idx].content,
              timestamp: messages.value[idx].timestamp,
              metadata: { metrics },
            });
          }
          isLoading.value = false;
          currentStreamingMessageId = null;
          streamStartTime = null;
          streamTokenCount = 0;
        },
        onError: (error) => {
          const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
          if (idx !== -1) {
            messages.value[idx].content = `**Erreur**: ${error}`;
            messages.value[idx].isLoading = false;
            messages.value[idx].isStreaming = false;
          }
          isLoading.value = false;
          currentStreamingMessageId = null;
          streamStartTime = null;
          streamTokenCount = 0;
        },
      },
    );
  } catch (error) {
    const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
    if (idx !== -1) {
      messages.value[idx].content =
        `**Erreur**: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
      messages.value[idx].isLoading = false;
      messages.value[idx].isStreaming = false;
    }
    isLoading.value = false;
  }
}

// Annuler la génération
async function cancelGeneration() {
 // Calculer les métriques avant d'annuler
 if (currentStreamingMessageId !== null && streamStartTime !== null) {
  const durationMs = Date.now() - streamStartTime;
  const tokensPerSecond =
   durationMs > 0 ? (streamTokenCount / durationMs) * 1000 : 0;

  const metrics: GenerationMetrics = {
   tokensPerSecond,
   completionTokens: streamTokenCount,
   promptTokens: 0,
   totalTokens: streamTokenCount,
   durationMs,
   finishReason: "cancelled",
  };

  // Mettre à jour le message avec les métriques
  const idx = messages.value.findIndex(
   (m) => m.id === currentStreamingMessageId,
  );
  if (idx !== -1) {
   messages.value[idx].isStreaming = false;
   messages.value[idx].isLoading = false;
   messages.value[idx].metadata = { metrics };
  }
 }

 await apiService.cancelStream();
 isLoading.value = false;

 // Reset du tracking
 currentStreamingMessageId = null;
 streamStartTime = null;
 streamTokenCount = 0;
}

// Copier le contenu d'un message
async function copyMessage(messageId: number) {
 const message = messages.value.find((m) => m.id === messageId);
 if (message) {
  try {
   await navigator.clipboard.writeText(message.content);
  } catch (error) {
   console.error("Failed to copy message:", error);
  }
 }
}

// Commencer l'édition d'un message
function startEdit(messageId: number) {
 const message = messages.value.find((m) => m.id === messageId);
 if (message) {
  message.isEditing = true;
  message.editContent = message.content;
 }
}

// Sauvegarder l'édition
function saveEdit(messageId: number) {
 const message = messages.value.find((m) => m.id === messageId);
 if (message && message.editContent !== undefined) {
  message.content = message.editContent;
  message.isEditing = false;
  message.editContent = undefined;
 }
}

// Annuler l'édition
function cancelEdit(messageId: number) {
 const message = messages.value.find((m) => m.id === messageId);
 if (message) {
  message.isEditing = false;
  message.editContent = undefined;
 }
}

// Supprimer un message
function deleteMessage(messageId: number) {
 const idx = messages.value.findIndex((m) => m.id === messageId);
 if (idx !== -1) {
  const deletedMessage = messages.value[idx];

  // Si on supprime le dernier message assistant, ajouter un placeholder pour regénérer
  if (
   deletedMessage.type === "assistant" &&
   idx === messages.value.length - 1 &&
   idx > 0 &&
   messages.value[idx - 1].type === "user"
  ) {
   // Remplacer par un message placeholder
   messages.value[idx] = {
    id: messageIdCounter++,
    type: "assistant",
    content: "",
    timestamp: Date.now(),
    isLoading: false,
    metadata: { isDeletedPlaceholder: true },
   };
  } else {
   messages.value.splice(idx, 1);
  }
 }
}

// Regenerer un message assistant
async function regenerateMessage(messageId: number) {
 const messageIndex = messages.value.findIndex((m) => m.id === messageId);
 if (messageIndex === -1) return;

 // Trouver le message utilisateur precedent
 let userMessageIndex = messageIndex - 1;
 while (
  userMessageIndex >= 0 &&
  messages.value[userMessageIndex].type !== "user"
 ) {
  userMessageIndex--;
 }

 if (userMessageIndex < 0) return;

 const userMessage = messages.value[userMessageIndex];

 let assistantMessage: Message;

 // Si c'est un placeholder, juste le remplacer, sinon supprimer tous les messages après
 if (messages.value[messageIndex].metadata?.isDeletedPlaceholder) {
  // Remplacer le placeholder par un nouveau message
  assistantMessage = {
   id: messageIdCounter++,
   type: "assistant",
   content: "",
   timestamp: Date.now(),
   isLoading: true,
   isStreaming: true,
  };
  messages.value[messageIndex] = assistantMessage;
 } else {
  // Supprimer tous les messages apres le message utilisateur
  messages.value.splice(userMessageIndex + 1);

  // Créer un nouveau message assistant
  assistantMessage = {
   id: messageIdCounter++,
   type: "assistant",
   content: "",
   timestamp: Date.now(),
   isLoading: true,
   isStreaming: true,
  };
  messages.value.push(assistantMessage);
 }

 // Regenerer
 isLoading.value = true;

 // Scroll initial si nécessaire
 const chatArea = document.querySelector(".chat-area") as HTMLElement;
 if (chatArea && isNearBottom(chatArea)) {
  await scrollToBottom();
 }

 // Initialiser le tracking
 currentStreamingMessageId = assistantMessage.id;
 streamStartTime = Date.now();
 streamTokenCount = 0;

 try {
  await apiService.sendPromptStream(
   {
    message: userMessage.content,
    conversationHistory: buildConversationHistory().slice(0, -1),
   },
   {
    onStart: () => {
     const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
     if (idx !== -1) {
      messages.value[idx].isLoading = false;
     }
    },
    onContent: async (content) => {
     const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
     if (idx !== -1) {
      messages.value[idx].content += content;
      streamTokenCount += Math.ceil(content.length / 4);
      const chatArea = document.querySelector(".chat-area") as HTMLElement;
      if (chatArea && isNearBottom(chatArea)) {
       await scrollToBottom();
      }
     }
    },
    onEnd: (metrics) => {
     const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
     if (idx !== -1) {
      messages.value[idx].isStreaming = false;
      messages.value[idx].metadata = { metrics };
     }
     isLoading.value = false;
     currentStreamingMessageId = null;
     streamStartTime = null;
     streamTokenCount = 0;
    },
    onError: (error) => {
     const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
     if (idx !== -1) {
      messages.value[idx].content = `**Erreur**: ${error}`;
      messages.value[idx].isLoading = false;
      messages.value[idx].isStreaming = false;
     }
     isLoading.value = false;
     currentStreamingMessageId = null;
     streamStartTime = null;
     streamTokenCount = 0;
    },
   },
  );
 } catch (error) {
  const idx = messages.value.findIndex((m) => m.id === assistantMessage.id);
  if (idx !== -1) {
   messages.value[idx].content =
    `**Erreur**: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
   messages.value[idx].isLoading = false;
   messages.value[idx].isStreaming = false;
  }
  isLoading.value = false;
  currentStreamingMessageId = null;
  streamStartTime = null;
  streamTokenCount = 0;
 }
}

// Continuer un message assistant
async function continueMessage(messageId: number) {
 const message = messages.value.find((m) => m.id === messageId);
 if (!message || message.type !== "assistant") return;

 message.isStreaming = true;
 isLoading.value = true;

 // Scroll initial si nécessaire
 const chatArea = document.querySelector(".chat-area") as HTMLElement;
 if (chatArea && isNearBottom(chatArea)) {
  await scrollToBottom();
 }

 // Initialiser le tracking
 currentStreamingMessageId = message.id;
 streamStartTime = Date.now();
 streamTokenCount = 0;

 try {
  await apiService.sendPromptStream(
   {
    message: "Continue",
    conversationHistory: buildConversationHistory(),
   },
   {
    onContent: async (content) => {
     message.content += content;
     streamTokenCount += Math.ceil(content.length / 4);
     const chatArea = document.querySelector(".chat-area") as HTMLElement;
     if (chatArea && isNearBottom(chatArea)) {
      await scrollToBottom();
     }
    },
    onEnd: (metrics) => {
     message.isStreaming = false;
     message.metadata = { metrics };
     isLoading.value = false;
     currentStreamingMessageId = null;
     streamStartTime = null;
     streamTokenCount = 0;
    },
    onError: (error) => {
     message.content += `\n\n**Erreur**: ${error}`;
     message.isStreaming = false;
     isLoading.value = false;
     currentStreamingMessageId = null;
     streamStartTime = null;
     streamTokenCount = 0;
    },
   },
  );
 } catch (error) {
  message.content += `\n\n**Erreur**: ${error instanceof Error ? error.message : "Erreur inconnue"}`;
  message.isStreaming = false;
  isLoading.value = false;
  currentStreamingMessageId = null;
  streamStartTime = null;
  streamTokenCount = 0;
 }
}

async function fetchRoute(path: string) {
 activeRoute.value = path;
}

function handleKeydown(event: KeyboardEvent) {
 if (event.key === "Enter" && !event.shiftKey) {
  event.preventDefault();
  if (isLoading.value) {
   cancelGeneration();
  } else {
   sendPrompt();
  }
 }
}

function handleFormat(newText: string) {
  prompt.value = newText;
}

// Handle chat selection from side panel
async function handleChatSelected(chatId: string) {
  await selectChat(chatId);
}

// Handle new chat creation from side panel
function handleNewChatCreated(chatId: string) {
  // Messages will be loaded automatically via watch
}

// Start a new conversation
function startNewChat() {
  clearCurrentChat();
  messages.value = [];
}

// Gestion du resize du container
function startResize(event: MouseEvent) {
 event.preventDefault();
 isResizing.value = true;
 const startY = event.clientY;
 const startHeight = containerHeight.value;

 function onMouseMove(e: MouseEvent) {
  const delta = startY - e.clientY;
  const newHeight = Math.max(60, Math.min(500, startHeight + delta));
  containerHeight.value = newHeight;
 }

 function onMouseUp() {
  isResizing.value = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
 }

 document.addEventListener("mousemove", onMouseMove);
 document.addEventListener("mouseup", onMouseUp);
 document.body.style.cursor = "ns-resize";
 document.body.style.userSelect = "none";
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
   <div class="chat-area">
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
       <!-- En-tête du message: nom + actions -->
       <div class="message-header">
        <span class="message-author">
         {{
          message.type === "user"
           ? "Vous"
           : message.metadata?.modelName || currentModelName
         }}
        </span>
       </div>

       <!-- Corps du message -->
       <div class="message-content">
        <div v-if="message.isLoading" class="loading">
         <div class="spinner"></div>
         <span>Le serveur reflechit...</span>
        </div>
        <template v-else-if="message.isEditing">
         <textarea
          v-model="message.editContent"
          class="edit-textarea"
          rows="4"
         ></textarea>
         <div class="edit-actions">
          <button class="edit-btn save" @click="saveEdit(message.id)">
           Sauvegarder
          </button>
          <button class="edit-btn cancel" @click="cancelEdit(message.id)">
           Annuler
          </button>
         </div>
        </template>
        <template v-else>
         <div v-if="message.type === 'user'" class="user-text">
          {{ message.content }}
         </div>
         <template v-else-if="message.metadata?.isDeletedPlaceholder">
          <div class="deleted-placeholder">
           <button
            class="regenerate-placeholder-btn"
            @click="regenerateMessage(message.id)"
            :disabled="isLoading"
           >
            <RefreshCw :size="16" />
            Regenerer le message
           </button>
          </div>
         </template>
         <MarkdownRenderer v-else :content="message.content" />
         <div v-if="message.isStreaming" class="streaming-indicator">
          <div class="streaming-dot"></div>
         </div>
        </template>
       </div>

       <!-- Pied du message: timestamp + métriques -->
       <div
        class="message-footer"
        v-if="!message.metadata?.isDeletedPlaceholder"
       >
        <div class="meta-data">
         <span class="timestamp">
          {{ new Date(message.timestamp).toLocaleTimeString() }}
         </span>
         <MessageMetrics
          v-if="message.type === 'assistant' && message.metadata?.metrics"
          :metrics="message.metadata.metrics"
         />
        </div>

        <MessageActions
         v-if="
          !message.isLoading &&
          !message.isEditing &&
          !message.metadata?.isDeletedPlaceholder
         "
         :message-type="message.type"
         :is-streaming="message.isStreaming"
         :disabled="isLoading"
         @copy="copyMessage(message.id)"
         @edit="startEdit(message.id)"
         @delete="deleteMessage(message.id)"
         @regenerate="regenerateMessage(message.id)"
         @continue="continueMessage(message.id)"
        />
       </div>
      </div>
     </div>
    </div>
   </div>

   <SidePanel
      @chat-selected="handleChatSelected"
      @new-chat-created="handleNewChatCreated"
    />
  </main>

  <footer class="footer">
   <div
    class="resize-handle"
    @mousedown="startResize"
    :class="{ resizing: isResizing }"
   >
    <div class="resize-indicator"></div>
   </div>

   <div class="input-container">
    <div class="input-wrapper" :style="{ height: `${containerHeight}px` }">
     <MarkdownToolbar :textareaRef="textareaRef" @format="handleFormat" />
     <textarea
      ref="textareaRef"
      v-model="prompt"
      placeholder="Tapez votre message..."
      @keydown="handleKeydown"
      :disabled="isLoading"
     ></textarea>
    </div>
    <button v-if="isLoading" class="send-btn stop" @click="cancelGeneration">
     <Square :size="18" />
     Stop
    </button>
    <button
     v-else
     class="send-btn"
     @click="sendPrompt"
     :disabled="!prompt.trim()"
    >
     <Send :size="18" />
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
 display: flex;
 overflow: hidden;
 position: relative;
}

.chat-area {
 flex: 1;
 overflow-y: auto;
 overflow-x: hidden;
 padding: var(--ui-spacing-xl);
}

.content-area {
 max-width: var(--ui-width-content-max);
 margin: 0 auto;
}

.messages-container {
 display: flex;
 flex-direction: column;
 gap: var(--ui-gap-lg, 24px);
}

.message {
 display: flex;
 flex-direction: column;
 width: 100%;
 animation: var(--ui-animation-slide-in);
}

/* En-tête du message */
.message-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: var(--ui-spacing-xs, 4px);
}

.message-author {
 font-size: var(--ui-font-size-sm, 13px);
 font-weight: var(--ui-font-weight-medium, 500);
 color: var(--ui-color-text-secondary, #888);
}

/* Actions visibles au hover du message */
.message :deep(.message-actions) {
 opacity: 0;
 transition: opacity var(--ui-transition-fast, 0.15s);
}

.message:hover :deep(.message-actions) {
 opacity: 1;
}

/* Corps du message */
.message-content {
 padding: var(--ui-spacing-base, 12px) var(--ui-spacing-lg, 16px);
 border-radius: var(--ui-radius-md, 8px);
 word-wrap: break-word;
 position: relative;
 transition: background-color var(--ui-transition-fast, 0.15s);
}

.message.user .message-content {
 background-color: transparent;
 color: var(--ui-color-text-primary);
}

.message.user .message-content:hover {
 background-color: var(--ui-color-background-secondary);
}

.message.assistant .message-content .markdown-body * {
 color: var(--ui-color-agent);
}

.user-text {
 white-space: pre-wrap;
 line-height: var(--ui-line-height-base, 1.6);
}

/* Pied du message */
.message-footer {
 display: flex;
 align-items: center;
 justify-content: space-between;
 margin-top: var(--ui-spacing-xs, 4px);
 padding: 0 var(--ui-spacing-lg, 16px);
}

.meta-data {
 display: flex;
 gap: var(--ui-gap-md, 12px);
}
.timestamp {
 font-size: var(--ui-font-size-xs, 11px);
 color: var(--ui-color-text-tertiary, #666);
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

.streaming-indicator {
 display: inline-flex;
 align-items: center;
 margin-left: 4px;
}

.streaming-dot {
 width: 8px;
 height: 8px;
 background-color: var(--ui-color-primary);
 border-radius: 50%;
 animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
 0%,
 100% {
  opacity: 1;
 }
 50% {
  opacity: 0.3;
 }
}

.edit-textarea {
 width: 100%;
 min-height: 80px;
 padding: var(--ui-spacing-base, 12px);
 border: none;
 border-radius: var(--ui-radius-md, 8px);
 background-color: color-mix(in srgb, var(--ui-color-primary) 15%, transparent);
 color: var(--ui-color-text-primary);
 font-family: inherit;
 font-size: var(--ui-font-size-base);
 line-height: var(--ui-line-height-base, 1.6);
 resize: vertical;
 outline: none;
}

.edit-textarea:focus {
 background-color: color-mix(in srgb, var(--ui-color-primary) 20%, transparent);
}

.edit-actions {
 display: flex;
 gap: var(--ui-gap-sm);
 margin-top: var(--ui-spacing-sm);
}

.edit-btn {
 padding: var(--ui-spacing-xs) var(--ui-spacing-base);
 border: none;
 border-radius: var(--ui-radius-sm);
 font-size: var(--ui-font-size-sm);
 cursor: pointer;
 transition: all var(--ui-transition-fast);
}

.edit-btn.save {
 background-color: var(--ui-color-primary);
 color: var(--ui-color-text-strong);
}

.edit-btn.save:hover {
 background-color: var(--ui-color-primary-hover);
}

.edit-btn.cancel {
 background-color: var(--ui-color-background-elevated);
 color: var(--ui-color-text-primary);
}

.edit-btn.cancel:hover {
 background-color: var(--ui-color-background-tertiary);
}

.placeholder {
 text-align: center;
 padding: var(--ui-spacing-2xl);
 color: var(--ui-color-text-tertiary);
}

.footer {
 background-color: var(--ui-color-background-secondary);
 border-top: 1px solid var(--ui-color-border-default);
}

.input-container {
 padding: var(--ui-spacing-base) var(--ui-spacing-xl);
 display: flex;
 gap: var(--ui-gap-base);
 max-width: var(--ui-width-content-max);
 margin: 0 auto;
}

.input-wrapper {
 flex: 1;
 display: flex;
 flex-direction: column;
 position: relative;
}

.resize-handle {
 height: 8px;
 cursor: ns-resize;
 display: flex;
 align-items: center;
 justify-content: center;
 background-color: var(--ui-color-background-secondary);
 border: 1px solid var(--ui-color-border-subtle);
 border-bottom: none;
 transition: background-color 0.15s ease;
}

.resize-handle:hover,
.resize-handle.resizing {
 background-color: var(--ui-color-background-tertiary);
}

.resize-indicator {
 width: 40px;
 height: 3px;
 background-color: var(--ui-color-border-default);
 border-radius: 2px;
 transition: background-color 0.15s ease;
}

.resize-handle:hover .resize-indicator,
.resize-handle.resizing .resize-indicator {
 background-color: var(--ui-color-primary);
}

textarea {
 flex: 1;
 min-height: 0;
 padding: var(--ui-spacing-md) var(--ui-spacing-base);
 border: 1px solid var(--ui-color-border-subtle);
 border-top: none;
 border-radius: 0 0 var(--ui-radius-md) var(--ui-radius-md);
 background-color: var(--ui-color-background-primary);
 color: var(--ui-color-text-primary);
 font-family: inherit;
 font-size: var(--ui-font-size-base);
 resize: none;
 overflow-y: auto;
}

textarea:focus {
 outline: none;
 border-color: var(--ui-color-primary);
}

textarea:disabled {
 opacity: 0.5;
}

.send-btn {
 display: flex;
 align-items: center;
 gap: var(--ui-gap-xs);
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

.send-btn.stop {
 background-color: #dc2626;
}

.send-btn.stop:hover {
 background-color: #b91c1c;
}

.deleted-placeholder {
 display: flex;
 justify-content: center;
 align-items: center;
 padding: var(--ui-spacing-lg) var(--ui-spacing-base);
}

.regenerate-placeholder-btn {
 display: flex;
 align-items: center;
 gap: var(--ui-gap-sm);
 padding: var(--ui-spacing-sm) var(--ui-spacing-base);
 border: 1px dashed var(--ui-color-border-default);
 border-radius: var(--ui-radius-md);
 background-color: transparent;
 color: var(--ui-color-text-secondary);
 font-size: var(--ui-font-size-sm);
 cursor: pointer;
 transition: all var(--ui-transition-fast);
}

.regenerate-placeholder-btn:hover:not(:disabled) {
 background-color: var(--ui-color-background-elevated);
 border-color: var(--ui-color-primary);
 color: var(--ui-color-primary);
}

.regenerate-placeholder-btn:disabled {
 opacity: 0.5;
 cursor: not-allowed;
}
</style>
