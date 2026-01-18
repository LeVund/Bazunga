import { ref, computed, readonly } from "vue";
import type { Folder, Chat, StoredMessage, TreeNode } from "@core/types";
import { chatStorageApi } from "../services/chatStorageApi";

// Singleton state
const tree = ref<TreeNode[]>([]);
const currentChatId = ref<string | null>(null);
const currentMessages = ref<StoredMessage[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed
const currentChat = computed(() => {
  if (!currentChatId.value) return null;

  function findChat(nodes: TreeNode[]): Chat | null {
    for (const node of nodes) {
      if (node.type === "chat" && (node.data as Chat).id === currentChatId.value) {
        return node.data as Chat;
      }
      if (node.children.length > 0) {
        const found = findChat(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return findChat(tree.value);
});

// Actions
async function loadTree() {
  try {
    isLoading.value = true;
    error.value = null;
    tree.value = await chatStorageApi.getTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load tree";
    console.error("Failed to load tree:", e);
  } finally {
    isLoading.value = false;
  }
}

async function selectChat(chatId: string | null) {
  currentChatId.value = chatId;

  if (chatId) {
    try {
      isLoading.value = true;
      currentMessages.value = await chatStorageApi.getChatMessages(chatId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to load messages";
      console.error("Failed to load messages:", e);
      currentMessages.value = [];
    } finally {
      isLoading.value = false;
    }
  } else {
    currentMessages.value = [];
  }
}

async function createFolder(name: string, parentId: string | null = null) {
  try {
    await chatStorageApi.createFolder(name, parentId);
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to create folder";
    throw e;
  }
}

async function createChat(title: string, folderId: string | null = null): Promise<Chat> {
  try {
    const chat = await chatStorageApi.createChat(title, folderId);
    await loadTree();
    return chat;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to create chat";
    throw e;
  }
}

async function renameFolder(id: string, name: string) {
  try {
    await chatStorageApi.updateFolder(id, { name });
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to rename folder";
    throw e;
  }
}

async function renameChat(id: string, title: string) {
  try {
    await chatStorageApi.updateChat(id, { title });
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to rename chat";
    throw e;
  }
}

async function deleteFolder(id: string) {
  try {
    await chatStorageApi.deleteFolder(id);
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to delete folder";
    throw e;
  }
}

async function deleteChat(id: string) {
  try {
    await chatStorageApi.deleteChat(id);
    if (currentChatId.value === id) {
      currentChatId.value = null;
      currentMessages.value = [];
    }
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to delete chat";
    throw e;
  }
}

async function moveChat(chatId: string, folderId: string | null) {
  try {
    await chatStorageApi.moveChat(chatId, folderId);
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to move chat";
    throw e;
  }
}

async function moveFolder(folderId: string, parentId: string | null) {
  try {
    await chatStorageApi.updateFolder(folderId, { parentId });
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to move folder";
    throw e;
  }
}

async function duplicateChat(id: string) {
  try {
    const newChat = await chatStorageApi.duplicateChat(id);
    await loadTree();
    return newChat;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to duplicate chat";
    throw e;
  }
}

async function toggleFolderExpand(id: string) {
  try {
    await chatStorageApi.toggleFolderExpand(id);
    await loadTree();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to toggle folder";
    throw e;
  }
}

async function addMessage(message: Omit<StoredMessage, "id" | "chatId">): Promise<StoredMessage | null> {
  if (!currentChatId.value) return null;

  try {
    const storedMessage = await chatStorageApi.addMessage(currentChatId.value, message);
    currentMessages.value.push(storedMessage);
    await loadTree(); // Refresh to update lastMessagePreview
    return storedMessage;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to add message";
    throw e;
  }
}

function clearCurrentChat() {
  currentChatId.value = null;
  currentMessages.value = [];
}

export function useChatStorage() {
  return {
    // State (readonly)
    tree: readonly(tree),
    currentChatId: readonly(currentChatId),
    currentMessages: readonly(currentMessages),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    currentChat,

    // Actions
    loadTree,
    selectChat,
    createFolder,
    createChat,
    renameFolder,
    renameChat,
    deleteFolder,
    deleteChat,
    moveChat,
    moveFolder,
    duplicateChat,
    toggleFolderExpand,
    addMessage,
    clearCurrentChat,
  };
}
