import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join } from "path";
import type {
  ChatDatabase,
  Folder,
  Chat,
  StoredMessage,
  TreeNode,
} from "@core/types";

const defaultData: ChatDatabase = {
  folders: [],
  chats: [],
  messages: [],
};

const file = join(process.cwd(), "data", "chat-data.json");
const adapter = new JSONFile<ChatDatabase>(file);
const db = new Low<ChatDatabase>(adapter, defaultData);

export async function initDatabase(): Promise<void> {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// === FOLDERS ===

export async function getAllFolders(): Promise<Folder[]> {
  await db.read();
  return db.data.folders;
}

export async function createFolder(
  name: string,
  parentId: string | null = null
): Promise<Folder> {
  await db.read();

  const siblings = db.data.folders.filter((f) => f.parentId === parentId);
  const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order), -1);

  const folder: Folder = {
    id: generateId(),
    name,
    parentId,
    order: maxOrder + 1,
    isExpanded: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.data.folders.push(folder);
  await db.write();
  return folder;
}

export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, "name" | "parentId" | "order" | "isExpanded">>
): Promise<Folder | null> {
  await db.read();

  const folder = db.data.folders.find((f) => f.id === id);
  if (!folder) return null;

  Object.assign(folder, updates, { updatedAt: Date.now() });
  await db.write();
  return folder;
}

export async function toggleFolderExpand(id: string): Promise<Folder | null> {
  await db.read();

  const folder = db.data.folders.find((f) => f.id === id);
  if (!folder) return null;

  folder.isExpanded = !folder.isExpanded;
  folder.updatedAt = Date.now();
  await db.write();
  return folder;
}

function getDescendantFolderIds(folderId: string, folders: Folder[]): string[] {
  const descendants: string[] = [];
  const childFolders = folders.filter((f) => f.parentId === folderId);

  for (const child of childFolders) {
    descendants.push(child.id);
    descendants.push(...getDescendantFolderIds(child.id, folders));
  }

  return descendants;
}

export async function deleteFolder(id: string): Promise<boolean> {
  await db.read();

  const folderIndex = db.data.folders.findIndex((f) => f.id === id);
  if (folderIndex === -1) return false;

  const descendantIds = getDescendantFolderIds(id, db.data.folders);
  const allFolderIds = [id, ...descendantIds];

  // Delete all chats in these folders
  const chatIdsToDelete = db.data.chats
    .filter((c) => c.folderId && allFolderIds.includes(c.folderId))
    .map((c) => c.id);

  // Delete messages of those chats
  db.data.messages = db.data.messages.filter(
    (m) => !chatIdsToDelete.includes(m.chatId)
  );

  // Delete chats
  db.data.chats = db.data.chats.filter(
    (c) => !c.folderId || !allFolderIds.includes(c.folderId)
  );

  // Delete folders
  db.data.folders = db.data.folders.filter(
    (f) => !allFolderIds.includes(f.id)
  );

  await db.write();
  return true;
}

// === CHATS ===

export async function getAllChats(): Promise<Chat[]> {
  await db.read();
  return db.data.chats;
}

export async function getChat(id: string): Promise<Chat | null> {
  await db.read();
  return db.data.chats.find((c) => c.id === id) || null;
}

export async function createChat(
  title: string,
  folderId: string | null = null
): Promise<Chat> {
  await db.read();

  const siblings = db.data.chats.filter((c) => c.folderId === folderId);
  const maxOrder = siblings.reduce((max, c) => Math.max(max, c.order), -1);

  const chat: Chat = {
    id: generateId(),
    title,
    folderId,
    order: maxOrder + 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
    lastMessagePreview: "",
  };

  db.data.chats.push(chat);
  await db.write();
  return chat;
}

export async function updateChat(
  id: string,
  updates: Partial<Pick<Chat, "title" | "folderId" | "order">>
): Promise<Chat | null> {
  await db.read();

  const chat = db.data.chats.find((c) => c.id === id);
  if (!chat) return null;

  Object.assign(chat, updates, { updatedAt: Date.now() });
  await db.write();
  return chat;
}

export async function deleteChat(id: string): Promise<boolean> {
  await db.read();

  const chatIndex = db.data.chats.findIndex((c) => c.id === id);
  if (chatIndex === -1) return false;

  // Delete all messages of this chat
  db.data.messages = db.data.messages.filter((m) => m.chatId !== id);

  // Delete the chat
  db.data.chats.splice(chatIndex, 1);

  await db.write();
  return true;
}

export async function duplicateChat(id: string): Promise<Chat | null> {
  await db.read();

  const originalChat = db.data.chats.find((c) => c.id === id);
  if (!originalChat) return null;

  const originalMessages = db.data.messages.filter((m) => m.chatId === id);

  // Create new chat
  const newChat: Chat = {
    ...originalChat,
    id: generateId(),
    title: `${originalChat.title} (copie)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Duplicate messages
  const newMessages: StoredMessage[] = originalMessages.map((m) => ({
    ...m,
    id: generateId(),
    chatId: newChat.id,
  }));

  db.data.chats.push(newChat);
  db.data.messages.push(...newMessages);
  await db.write();

  return newChat;
}

// === MESSAGES ===

export async function getChatMessages(chatId: string): Promise<StoredMessage[]> {
  await db.read();
  return db.data.messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function addMessage(
  chatId: string,
  message: Omit<StoredMessage, "id" | "chatId">
): Promise<StoredMessage> {
  await db.read();

  const chat = db.data.chats.find((c) => c.id === chatId);
  if (!chat) {
    throw new Error(`Chat ${chatId} not found`);
  }

  const storedMessage: StoredMessage = {
    id: generateId(),
    chatId,
    ...message,
  };

  db.data.messages.push(storedMessage);

  // Update chat metadata
  chat.messageCount = db.data.messages.filter((m) => m.chatId === chatId).length;
  chat.lastMessagePreview = message.content.substring(0, 100);
  chat.updatedAt = Date.now();

  await db.write();
  return storedMessage;
}

export async function updateMessage(
  id: string,
  content: string
): Promise<StoredMessage | null> {
  await db.read();

  const message = db.data.messages.find((m) => m.id === id);
  if (!message) return null;

  message.content = content;

  // Update chat preview if this is the last message
  const chatMessages = db.data.messages
    .filter((m) => m.chatId === message.chatId)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (chatMessages[0]?.id === id) {
    const chat = db.data.chats.find((c) => c.id === message.chatId);
    if (chat) {
      chat.lastMessagePreview = content.substring(0, 100);
      chat.updatedAt = Date.now();
    }
  }

  await db.write();
  return message;
}

export async function deleteMessage(id: string): Promise<boolean> {
  await db.read();

  const messageIndex = db.data.messages.findIndex((m) => m.id === id);
  if (messageIndex === -1) return false;

  const message = db.data.messages[messageIndex];
  db.data.messages.splice(messageIndex, 1);

  // Update chat metadata
  const chat = db.data.chats.find((c) => c.id === message.chatId);
  if (chat) {
    const remainingMessages = db.data.messages
      .filter((m) => m.chatId === message.chatId)
      .sort((a, b) => b.timestamp - a.timestamp);

    chat.messageCount = remainingMessages.length;
    chat.lastMessagePreview = remainingMessages[0]?.content.substring(0, 100) || "";
    chat.updatedAt = Date.now();
  }

  await db.write();
  return true;
}

// === TREE ===

export async function getTree(): Promise<TreeNode[]> {
  await db.read();

  const { folders, chats } = db.data;

  function buildNode(parentId: string | null): TreeNode[] {
    const folderNodes: TreeNode[] = folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((folder) => ({
        type: "folder" as const,
        data: folder,
        children: buildNode(folder.id),
      }));

    const chatNodes: TreeNode[] = chats
      .filter((c) => c.folderId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((chat) => ({
        type: "chat" as const,
        data: chat,
        children: [],
      }));

    // Folders first, then chats
    return [...folderNodes, ...chatNodes];
  }

  return buildNode(null);
}
