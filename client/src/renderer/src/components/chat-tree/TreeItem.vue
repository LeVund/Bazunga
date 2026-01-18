<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  MessageSquare,
  MoreHorizontal,
} from "lucide-vue-next";
import type { TreeNode, Folder as FolderType, Chat } from "@core/types";
import ContextMenu from "./ContextMenu.vue";
import RenameInput from "./RenameInput.vue";

interface Props {
  node: TreeNode;
  selectedChatId: string | null;
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
});

const emit = defineEmits<{
  selectChat: [chatId: string];
  toggleFolder: [folderId: string];
  renameFolder: [folderId: string, name: string];
  renameChat: [chatId: string, title: string];
  deleteFolder: [folderId: string];
  deleteChat: [chatId: string];
  duplicateChat: [chatId: string];
  moveItem: [
    itemId: string,
    itemType: "folder" | "chat",
    targetFolderId: string | null
  ];
}>();

const isRenaming = ref(false);
const contextMenu = ref<{ x: number; y: number } | null>(null);
const isDragOver = ref(false);

const isFolder = computed(() => props.node.type === "folder");
const folder = computed(() => (isFolder.value ? (props.node.data as FolderType) : null));
const chat = computed(() => (!isFolder.value ? (props.node.data as Chat) : null));

const isSelected = computed(
  () => !isFolder.value && chat.value?.id === props.selectedChatId
);

const itemName = computed(() =>
  isFolder.value ? folder.value!.name : chat.value!.title
);

function handleClick() {
  if (isFolder.value) {
    emit("toggleFolder", folder.value!.id);
  } else {
    emit("selectChat", chat.value!.id);
  }
}

function handleDoubleClick(event: MouseEvent) {
  event.stopPropagation();
  isRenaming.value = true;
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  contextMenu.value = { x: event.clientX, y: event.clientY };
}

function handleMoreClick(event: MouseEvent) {
  event.stopPropagation();
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  contextMenu.value = { x: rect.left, y: rect.bottom + 4 };
}

function handleRename(newName: string) {
  if (isFolder.value) {
    emit("renameFolder", folder.value!.id, newName);
  } else {
    emit("renameChat", chat.value!.id, newName);
  }
  isRenaming.value = false;
}

function handleContextAction(action: "rename" | "duplicate" | "delete") {
  if (action === "rename") {
    isRenaming.value = true;
  } else if (action === "duplicate" && !isFolder.value) {
    emit("duplicateChat", chat.value!.id);
  } else if (action === "delete") {
    if (isFolder.value) {
      emit("deleteFolder", folder.value!.id);
    } else {
      emit("deleteChat", chat.value!.id);
    }
  }
  contextMenu.value = null;
}

// Drag & Drop
function handleDragStart(event: DragEvent) {
  if (!event.dataTransfer) return;

  const itemId = isFolder.value ? folder.value!.id : chat.value!.id;
  event.dataTransfer.setData(
    "application/json",
    JSON.stringify({
      id: itemId,
      type: props.node.type,
    })
  );
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event: DragEvent) {
  if (!isFolder.value) return;

  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(event: DragEvent) {
  if (!isFolder.value || !event.dataTransfer) return;

  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;

  try {
    const data = JSON.parse(event.dataTransfer.getData("application/json"));

    // Prevent dropping folder into itself or its descendants
    if (data.type === "folder" && data.id === folder.value!.id) {
      return;
    }

    emit("moveItem", data.id, data.type, folder.value!.id);
  } catch (e) {
    console.error("Failed to parse drag data:", e);
  }
}

// Forward events from children
function forwardSelectChat(chatId: string) {
  emit("selectChat", chatId);
}
function forwardToggleFolder(folderId: string) {
  emit("toggleFolder", folderId);
}
function forwardRenameFolder(folderId: string, name: string) {
  emit("renameFolder", folderId, name);
}
function forwardRenameChat(chatId: string, title: string) {
  emit("renameChat", chatId, title);
}
function forwardDeleteFolder(folderId: string) {
  emit("deleteFolder", folderId);
}
function forwardDeleteChat(chatId: string) {
  emit("deleteChat", chatId);
}
function forwardDuplicateChat(chatId: string) {
  emit("duplicateChat", chatId);
}
function forwardMoveItem(
  itemId: string,
  itemType: "folder" | "chat",
  targetFolderId: string | null
) {
  emit("moveItem", itemId, itemType, targetFolderId);
}
</script>

<template>
  <div class="tree-item-container">
    <div
      :class="[
        'tree-item',
        {
          folder: isFolder,
          chat: !isFolder,
          selected: isSelected,
          'drag-over': isDragOver,
        },
      ]"
      :style="{ paddingLeft: `${props.depth * 16 + 8}px` }"
      draggable="true"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu="handleContextMenu"
      @dragstart="handleDragStart"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Icon -->
      <span class="icon">
        <template v-if="isFolder">
          <ChevronDown v-if="folder!.isExpanded" :size="14" class="chevron" />
          <ChevronRight v-else :size="14" class="chevron" />
          <FolderOpen v-if="folder!.isExpanded" :size="16" class="folder-icon" />
          <Folder v-else :size="16" class="folder-icon" />
        </template>
        <MessageSquare v-else :size="16" class="chat-icon" />
      </span>

      <!-- Name -->
      <span class="name" v-if="!isRenaming">
        {{ itemName }}
      </span>
      <RenameInput
        v-else
        :initial-value="itemName"
        @save="handleRename"
        @cancel="isRenaming = false"
      />

      <!-- More button -->
      <button
        v-if="!isRenaming"
        class="more-btn"
        @click="handleMoreClick"
        @dblclick.stop
      >
        <MoreHorizontal :size="14" />
      </button>
    </div>

    <!-- Children (for folders) -->
    <div v-if="isFolder && folder!.isExpanded && node.children.length > 0" class="children">
      <TreeItem
        v-for="child in node.children"
        :key="child.type + '-' + (child.data as any).id"
        :node="child"
        :selected-chat-id="selectedChatId"
        :depth="depth + 1"
        @select-chat="forwardSelectChat"
        @toggle-folder="forwardToggleFolder"
        @rename-folder="forwardRenameFolder"
        @rename-chat="forwardRenameChat"
        @delete-folder="forwardDeleteFolder"
        @delete-chat="forwardDeleteChat"
        @duplicate-chat="forwardDuplicateChat"
        @move-item="forwardMoveItem"
      />
    </div>

    <!-- Context menu -->
    <ContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :show-duplicate="!isFolder"
      @rename="handleContextAction('rename')"
      @duplicate="handleContextAction('duplicate')"
      @delete="handleContextAction('delete')"
      @close="contextMenu = null"
    />
  </div>
</template>

<style scoped>
.tree-item-container {
  position: relative;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs);
  padding: 6px 8px;
  padding-right: 4px;
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  user-select: none;
  transition: background-color var(--ui-transition-fast);
}

.tree-item:hover {
  background-color: var(--ui-color-background-tertiary);
}

.tree-item.selected {
  background-color: var(--ui-color-primary);
  color: var(--ui-color-text-strong);
}

.tree-item.drag-over {
  background-color: rgba(var(--ui-color-primary-rgb, 59, 130, 246), 0.2);
  outline: 2px dashed var(--ui-color-primary);
}

.icon {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.chevron {
  color: var(--ui-color-text-tertiary);
}

.folder-icon {
  color: var(--ui-color-text-secondary);
}

.chat-icon {
  color: var(--ui-color-text-tertiary);
  margin-left: 16px;
}

.tree-item.selected .chevron,
.tree-item.selected .folder-icon,
.tree-item.selected .chat-icon {
  color: inherit;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ui-font-size-sm);
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--ui-radius-sm);
  background: transparent;
  color: var(--ui-color-text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--ui-transition-fast), background-color var(--ui-transition-fast);
}

.tree-item:hover .more-btn {
  opacity: 1;
}

.more-btn:hover {
  background-color: var(--ui-color-background-elevated);
  color: var(--ui-color-text-primary);
}

.tree-item.selected .more-btn {
  color: inherit;
}

.tree-item.selected .more-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.children {
  /* No additional styles needed */
}
</style>
