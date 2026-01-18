<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus, FolderPlus, MessageSquarePlus } from "lucide-vue-next";
import TreeItem from "./TreeItem.vue";
import CreateInput from "./CreateInput.vue";
import { useChatStorage } from "../../composables/useChatStorage";

const emit = defineEmits<{
  chatSelected: [chatId: string];
  newChatCreated: [chatId: string];
}>();

const {
  tree,
  currentChatId,
  isLoading,
  loadTree,
  selectChat,
  createFolder,
  createChat,
  renameFolder,
  renameChat,
  deleteFolder,
  deleteChat,
  duplicateChat,
  toggleFolderExpand,
  moveChat,
  moveFolder,
} = useChatStorage();

const showNewMenu = ref(false);
const isDragOverRoot = ref(false);
const creatingItem = ref<"folder" | "chat" | null>(null);

function handleCreateFolder() {
  showNewMenu.value = false;
  creatingItem.value = "folder";
}

function handleCreateChat() {
  showNewMenu.value = false;
  creatingItem.value = "chat";
}

async function handleSaveNewItem(name: string) {
  if (creatingItem.value === "folder") {
    await createFolder(name);
  } else if (creatingItem.value === "chat") {
    const chat = await createChat(name);
    await selectChat(chat.id);
    emit("newChatCreated", chat.id);
  }
  creatingItem.value = null;
}

function handleCancelNewItem() {
  creatingItem.value = null;
}

async function handleSelectChat(chatId: string) {
  await selectChat(chatId);
  emit("chatSelected", chatId);
}

async function handleToggleFolder(folderId: string) {
  await toggleFolderExpand(folderId);
}

async function handleRenameFolder(folderId: string, name: string) {
  await renameFolder(folderId, name);
}

async function handleRenameChat(chatId: string, title: string) {
  await renameChat(chatId, title);
}

async function handleDeleteFolder(folderId: string) {
  if (confirm("Supprimer ce dossier et tout son contenu?")) {
    await deleteFolder(folderId);
  }
}

async function handleDeleteChat(chatId: string) {
  if (confirm("Supprimer cette conversation?")) {
    await deleteChat(chatId);
  }
}

async function handleDuplicateChat(chatId: string) {
  await duplicateChat(chatId);
}

async function handleMoveItem(
  itemId: string,
  itemType: "folder" | "chat",
  targetFolderId: string | null
) {
  if (itemType === "chat") {
    await moveChat(itemId, targetFolderId);
  } else {
    await moveFolder(itemId, targetFolderId);
  }
}

// Root drop zone
function handleRootDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  isDragOverRoot.value = true;
}

function handleRootDragLeave() {
  isDragOverRoot.value = false;
}

async function handleRootDrop(event: DragEvent) {
  event.preventDefault();
  isDragOverRoot.value = false;

  if (!event.dataTransfer) return;

  try {
    const data = JSON.parse(event.dataTransfer.getData("application/json"));
    await handleMoveItem(data.id, data.type, null);
  } catch (e) {
    console.error("Failed to parse drag data:", e);
  }
}

onMounted(() => {
  loadTree();
});
</script>

<template>
  <div class="chat-tree">
    <!-- Header -->
    <div class="tree-header">
      <span class="title">Conversations</span>
      <div class="header-actions">
        <button
          class="action-btn"
          title="Nouveau"
          @click="showNewMenu = !showNewMenu"
        >
          <Plus :size="16" />
        </button>

        <!-- Dropdown menu -->
        <div v-if="showNewMenu" class="new-menu">
          <button class="menu-item" @click="handleCreateChat">
            <MessageSquarePlus :size="14" />
            <span>Nouveau chat</span>
          </button>
          <button class="menu-item" @click="handleCreateFolder">
            <FolderPlus :size="14" />
            <span>Nouveau dossier</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tree content -->
    <div
      class="tree-content"
      :class="{ 'drag-over-root': isDragOverRoot }"
      @dragover="handleRootDragOver"
      @dragleave="handleRootDragLeave"
      @drop="handleRootDrop"
    >
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>Chargement...</span>
      </div>

      <div v-else-if="tree.length === 0 && !creatingItem" class="empty-state">
        <p>Aucune conversation</p>
        <button class="create-btn" @click="handleCreateChat">
          <MessageSquarePlus :size="16" />
          Nouveau chat
        </button>
      </div>

      <template v-else>
        <CreateInput
          v-if="creatingItem"
          :type="creatingItem"
          @save="handleSaveNewItem"
          @cancel="handleCancelNewItem"
        />
        <TreeItem
          v-for="node in tree"
          :key="node.type + '-' + (node.data as any).id"
          :node="node"
          :selected-chat-id="currentChatId"
          @select-chat="handleSelectChat"
          @toggle-folder="handleToggleFolder"
          @rename-folder="handleRenameFolder"
          @rename-chat="handleRenameChat"
          @delete-folder="handleDeleteFolder"
          @delete-chat="handleDeleteChat"
          @duplicate-chat="handleDuplicateChat"
          @move-item="handleMoveItem"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ui-spacing-sm) var(--ui-spacing-base);
  border-bottom: 1px solid var(--ui-color-border-subtle);
}

.title {
  font-size: var(--ui-font-size-sm);
  font-weight: var(--ui-font-weight-medium);
  color: var(--ui-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-actions {
  position: relative;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ui-radius-sm);
  background: transparent;
  color: var(--ui-color-text-secondary);
  cursor: pointer;
  transition: all var(--ui-transition-fast);
}

.action-btn:hover {
  background-color: var(--ui-color-background-tertiary);
  color: var(--ui-color-text-primary);
}

.new-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 160px;
  background-color: var(--ui-color-background-elevated);
  border: 1px solid var(--ui-color-border-default);
  border-radius: var(--ui-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: var(--ui-spacing-xs);
  z-index: 100;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-sm);
  width: 100%;
  padding: var(--ui-spacing-sm) var(--ui-spacing-base);
  border: none;
  border-radius: var(--ui-radius-sm);
  background: transparent;
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ui-transition-fast);
}

.menu-item:hover {
  background-color: var(--ui-color-background-tertiary);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--ui-spacing-sm);
}

.tree-content.drag-over-root {
  background-color: rgba(var(--ui-color-primary-rgb, 59, 130, 246), 0.05);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-sm);
  padding: var(--ui-spacing-xl);
  color: var(--ui-color-text-tertiary);
  font-size: var(--ui-font-size-sm);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--ui-color-background-elevated);
  border-top-color: var(--ui-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-base);
  padding: var(--ui-spacing-xl);
  text-align: center;
}

.empty-state p {
  color: var(--ui-color-text-tertiary);
  font-size: var(--ui-font-size-sm);
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-sm);
  padding: var(--ui-spacing-sm) var(--ui-spacing-base);
  border: 1px dashed var(--ui-color-border-default);
  border-radius: var(--ui-radius-md);
  background: transparent;
  color: var(--ui-color-text-secondary);
  font-size: var(--ui-font-size-sm);
  cursor: pointer;
  transition: all var(--ui-transition-fast);
}

.create-btn:hover {
  background-color: var(--ui-color-background-tertiary);
  border-color: var(--ui-color-primary);
  color: var(--ui-color-primary);
}

/* Scrollbar */
.tree-content::-webkit-scrollbar {
  width: 6px;
}

.tree-content::-webkit-scrollbar-track {
  background: transparent;
}

.tree-content::-webkit-scrollbar-thumb {
  background: var(--ui-color-scrollbar-thumb);
  border-radius: 3px;
}

.tree-content::-webkit-scrollbar-thumb:hover {
  background: var(--ui-color-scrollbar-thumb-hover);
}
</style>
