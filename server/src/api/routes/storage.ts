import { Context } from "hono";
import {
  getAllFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  toggleFolderExpand,
  getAllChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  duplicateChat,
  getChatMessages,
  addMessage,
  getTree,
} from "../../services/database";
import type { StoredMessage } from "@core/types";

// === FOLDERS ===

export async function handleGetTree(c: Context): Promise<Response> {
  try {
    const tree = await getTree();
    return c.json({ success: true, data: tree });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleCreateFolder(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<{ name: string; parentId?: string | null }>();
    const { name, parentId = null } = body;

    if (!name?.trim()) {
      return c.json({ success: false, error: "Name is required" }, 400);
    }

    const folder = await createFolder(name.trim(), parentId);
    return c.json({ success: true, data: folder });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleUpdateFolder(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{
      name?: string;
      parentId?: string | null;
      order?: number;
      isExpanded?: boolean;
    }>();

    const folder = await updateFolder(id, body);
    if (!folder) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({ success: true, data: folder });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleDeleteFolder(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const deleted = await deleteFolder(id);

    if (!deleted) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleToggleFolderExpand(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const folder = await toggleFolderExpand(id);

    if (!folder) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({ success: true, data: folder });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

// === CHATS ===

export async function handleGetChats(c: Context): Promise<Response> {
  try {
    const chats = await getAllChats();
    return c.json({ success: true, data: chats });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleGetChatMessages(c: Context): Promise<Response> {
  try {
    const chatId = c.req.param("id");
    const messages = await getChatMessages(chatId);
    return c.json({ success: true, data: messages });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleCreateChat(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<{ title: string; folderId?: string | null }>();
    const { title, folderId = null } = body;

    if (!title?.trim()) {
      return c.json({ success: false, error: "Title is required" }, 400);
    }

    const chat = await createChat(title.trim(), folderId);
    return c.json({ success: true, data: chat });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleUpdateChat(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ title?: string; folderId?: string | null; order?: number }>();

    const chat = await updateChat(id, body);
    if (!chat) {
      return c.json({ success: false, error: "Chat not found" }, 404);
    }

    return c.json({ success: true, data: chat });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleDeleteChat(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const deleted = await deleteChat(id);

    if (!deleted) {
      return c.json({ success: false, error: "Chat not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleMoveChat(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ folderId: string | null; order?: number }>();
    const { folderId, order } = body;

    const updates: { folderId?: string | null; order?: number } = { folderId };
    if (typeof order === "number") {
      updates.order = order;
    }

    const chat = await updateChat(id, updates);
    if (!chat) {
      return c.json({ success: false, error: "Chat not found" }, 404);
    }

    return c.json({ success: true, data: chat });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

export async function handleDuplicateChat(c: Context): Promise<Response> {
  try {
    const id = c.req.param("id");
    const chat = await duplicateChat(id);

    if (!chat) {
      return c.json({ success: false, error: "Chat not found" }, 404);
    }

    return c.json({ success: true, data: chat });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}

// === MESSAGES ===

export async function handleAddMessage(c: Context): Promise<Response> {
  try {
    const chatId = c.req.param("chatId");
    const body = await c.req.json<Omit<StoredMessage, "id" | "chatId">>();

    const message = await addMessage(chatId, body);
    return c.json({ success: true, data: message });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
}
