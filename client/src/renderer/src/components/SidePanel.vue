<script setup lang="ts">
import { ref } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import ChatTree from "./chat-tree/ChatTree.vue";

const emit = defineEmits<{
  chatSelected: [chatId: string];
  newChatCreated: [chatId: string];
}>();

const isOpen = ref(true);

function togglePanel() {
  isOpen.value = !isOpen.value;
}

function handleChatSelected(chatId: string) {
  emit("chatSelected", chatId);
}

function handleNewChatCreated(chatId: string) {
  emit("newChatCreated", chatId);
}
</script>

<template>
  <div :class="['side-panel', { open: isOpen }]">
    <button
      class="toggle-button"
      @click="togglePanel"
      :aria-label="isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'"
      :aria-expanded="isOpen"
    >
      <ChevronLeft v-if="isOpen" :size="20" />
      <ChevronRight v-else :size="20" />
    </button>

    <div class="panel-content">
      <ChatTree
        @chat-selected="handleChatSelected"
        @new-chat-created="handleNewChatCreated"
      />
    </div>
  </div>
</template>

<style scoped>
.side-panel {
 position: absolute;
 right: 0;
 top: 0;
 height: 100%;
 background-color: var(--ui-color-background-secondary);
 border-left: 1px solid var(--ui-color-border-default);
 display: flex;
 transition: transform var(--ui-transition-smooth);
 z-index: var(--ui-z-index-sidebar);
 width: var(--ui-width-sidebar-panel);
 transform: translateX(calc(100% - var(--ui-width-sidebar-toggle)));
}

.side-panel.open {
 transform: translateX(0);
}

.toggle-button {
 /*position: absolute;*/
 left: 0;
 top: 50%;
 /*transform: translateY(-50%) translateX(-100%);*/
 width: var(--ui-width-sidebar-toggle);
 height: 100%;
 background-color: var(--ui-color-background-secondary);
 border: 1px solid var(--ui-color-border-default);
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 color: var(--ui-color-text-secondary);
 transition: all var(--ui-transition-fast);
 padding: 0;
 z-index: var(--ui-z-index-base);
}

.toggle-button:hover {
 background-color: var(--ui-color-background-tertiary);
 color: var(--ui-color-primary);
 border-color: var(--ui-color-border-subtle);
}

.toggle-button:focus {
 outline: none;
 border-color: var(--ui-color-primary);
 color: var(--ui-color-primary);
}

.toggle-button:active {
 background-color: var(--ui-color-border-default);
 color: var(--ui-color-primary-active);
}

.panel-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
