import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  handleUserInput,
  handleUserInputStream,
  handleCancelStream,
} from "./api/routes/userInput";
import {
  handleGetTree,
  handleCreateFolder,
  handleUpdateFolder,
  handleDeleteFolder,
  handleToggleFolderExpand,
  handleGetChats,
  handleGetChatMessages,
  handleCreateChat,
  handleUpdateChat,
  handleDeleteChat,
  handleMoveChat,
  handleDuplicateChat,
  handleAddMessage,
} from "./api/routes/storage";
import {
  handleCheckPermission,
  handleExecuteCommand,
  handleApproveCommand,
  handleGetPermissions,
  handleAddPermission,
  handleDeletePermission,
  handleClearDirectoryPermissions,
} from "./api/routes/shell";
import { initDatabase } from "./services/database";
import { initShellPermissions } from "./services/shellPermissions";

const app = new Hono();

const PORT = process.env.SERVER_PORT || 8080;

// Initialize database and shell permissions
Promise.all([initDatabase(), initShellPermissions()]).then(() => {
  console.log("Database and shell permissions initialized");
});

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Routes streaming
app.post("/user-input/stream", handleUserInputStream);
app.post("/user-input/cancel", handleCancelStream);

// Route legacy (non-streaming)
app.post("/user-input", handleUserInput);

// Storage routes - Folders
app.get("/folders/tree", handleGetTree);
app.post("/folders", handleCreateFolder);
app.put("/folders/:id", handleUpdateFolder);
app.delete("/folders/:id", handleDeleteFolder);
app.patch("/folders/:id/toggle", handleToggleFolderExpand);

// Storage routes - Chats
app.get("/chats", handleGetChats);
app.get("/chats/:id/messages", handleGetChatMessages);
app.post("/chats", handleCreateChat);
app.put("/chats/:id", handleUpdateChat);
app.delete("/chats/:id", handleDeleteChat);
app.patch("/chats/:id/move", handleMoveChat);
app.post("/chats/:id/duplicate", handleDuplicateChat);

// Storage routes - Messages
app.post("/chats/:chatId/messages", handleAddMessage);

// Shell routes
app.get("/shell/check", handleCheckPermission);
app.post("/shell/execute", handleExecuteCommand);
app.post("/shell/approve", handleApproveCommand);
app.get("/shell/permissions", handleGetPermissions);
app.post("/shell/permissions", handleAddPermission);
app.delete("/shell/permissions/:id", handleDeletePermission);
app.delete("/shell/permissions/directory", handleClearDirectoryPermissions);

app.get("/", (c) => {
  return c.json({
    message: "LangChain API Server",
    routes: {
      "POST /user-input": "Send a message to the LangChain agent (legacy)",
      "POST /user-input/stream": "Stream a message response via SSE",
      "POST /user-input/cancel": "Cancel an active stream",
      "GET /folders/tree": "Get folder/chat tree",
      "POST /folders": "Create folder",
      "PUT /folders/:id": "Update folder",
      "DELETE /folders/:id": "Delete folder (cascade)",
      "PATCH /folders/:id/toggle": "Toggle folder expand",
      "GET /chats": "Get all chats",
      "GET /chats/:id/messages": "Get chat messages",
      "POST /chats": "Create chat",
      "PUT /chats/:id": "Update chat",
      "DELETE /chats/:id": "Delete chat",
      "PATCH /chats/:id/move": "Move chat to folder",
      "POST /chats/:id/duplicate": "Duplicate chat",
      "POST /chats/:chatId/messages": "Add message to chat",
      "GET /shell/check": "Check if a command is allowed",
      "POST /shell/execute": "Execute an approved command",
      "POST /shell/approve": "Approve and execute a command",
      "GET /shell/permissions": "Get all shell permissions",
      "POST /shell/permissions": "Add a shell permission",
      "DELETE /shell/permissions/:id": "Delete a shell permission",
      "DELETE /shell/permissions/directory": "Clear permissions for a directory",
    },
  });
});

console.log(`Server starting on port ${PORT}...`);
console.log(`Available routes:`);
console.log(`  GET  / - Server info`);
console.log(`  POST /user-input - Process user messages (legacy)`);
console.log(`  POST /user-input/stream - Stream messages via SSE`);
console.log(`  POST /user-input/cancel - Cancel active stream`);
console.log(`  Storage API - /folders/*, /chats/*`);

export default {
  port: PORT,
  fetch: app.fetch,
};
