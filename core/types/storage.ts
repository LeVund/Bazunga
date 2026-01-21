import type { GenerationMetrics } from "./langchain";
import type { ResolvedShellCommand } from "./shell";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  isExpanded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Chat {
  id: string;
  title: string;
  folderId: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview: string;
}

export interface StoredMessage {
  id: string;
  chatId: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: {
    metrics?: GenerationMetrics;
    modelName?: string;
    shellCommands?: ResolvedShellCommand[];  // Commandes shell utilisées dans ce message
  };
}

export interface ChatDatabase {
  folders: Folder[];
  chats: Chat[];
  messages: StoredMessage[];
}

export interface TreeNode {
  type: "folder" | "chat";
  data: Folder | Chat;
  children: TreeNode[];
}
