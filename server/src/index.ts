import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  handleUserInput,
  handleUserInputStream,
  handleCancelStream,
} from "./api/routes/userInput";

const app = new Hono();

const PORT = process.env.SERVER_PORT || 8080;

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

app.get("/", (c) => {
  return c.json({
    message: "LangChain API Server",
    routes: {
      "POST /user-input": "Send a message to the LangChain agent (legacy)",
      "POST /user-input/stream": "Stream a message response via SSE",
      "POST /user-input/cancel": "Cancel an active stream",
    },
  });
});

console.log(`Server starting on port ${PORT}...`);
console.log(`Available routes:`);
console.log(`  GET  / - Server info`);
console.log(`  POST /user-input - Process user messages (legacy)`);
console.log(`  POST /user-input/stream - Stream messages via SSE`);
console.log(`  POST /user-input/cancel - Cancel active stream`);

export default {
  port: PORT,
  fetch: app.fetch,
};
