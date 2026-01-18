import type { Folder, Chat, StoredMessage, TreeNode } from "@core/types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ChatStorageApi {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:8080") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Request failed");
    }

    return result.data as T;
  }

  // === TREE ===

  async getTree(): Promise<TreeNode[]> {
    return this.request<TreeNode[]>("/folders/tree");
  }

  // === FOLDERS ===

  async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    return this.request<Folder>("/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
  }

  async updateFolder(
    id: string,
    updates: Partial<Pick<Folder, "name" | "parentId" | "order" | "isExpanded">>
  ): Promise<Folder> {
    return this.request<Folder>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteFolder(id: string): Promise<void> {
    await this.request<void>(`/folders/${id}`, {
      method: "DELETE",
    });
  }

  async toggleFolderExpand(id: string): Promise<Folder> {
    return this.request<Folder>(`/folders/${id}/toggle`, {
      method: "PATCH",
    });
  }

  // === CHATS ===

  async getChats(): Promise<Chat[]> {
    return this.request<Chat[]>("/chats");
  }

  async getChatMessages(chatId: string): Promise<StoredMessage[]> {
    return this.request<StoredMessage[]>(`/chats/${chatId}/messages`);
  }

  async createChat(title: string, folderId: string | null = null): Promise<Chat> {
    return this.request<Chat>("/chats", {
      method: "POST",
      body: JSON.stringify({ title, folderId }),
    });
  }

  async updateChat(
    id: string,
    updates: Partial<Pick<Chat, "title" | "folderId" | "order">>
  ): Promise<Chat> {
    return this.request<Chat>(`/chats/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteChat(id: string): Promise<void> {
    await this.request<void>(`/chats/${id}`, {
      method: "DELETE",
    });
  }

  async moveChat(id: string, folderId: string | null, order?: number): Promise<Chat> {
    return this.request<Chat>(`/chats/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ folderId, order }),
    });
  }

  async duplicateChat(id: string): Promise<Chat> {
    return this.request<Chat>(`/chats/${id}/duplicate`, {
      method: "POST",
    });
  }

  // === MESSAGES ===

  async addMessage(
    chatId: string,
    message: Omit<StoredMessage, "id" | "chatId">
  ): Promise<StoredMessage> {
    return this.request<StoredMessage>(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  }
}

export const chatStorageApi = new ChatStorageApi();
