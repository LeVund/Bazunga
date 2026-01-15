import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleUserInput } from "./api/routes/userInput";

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
  })
);

app.post("/user-input", handleUserInput);

app.get("/", (c) => {
  return c.json({
    message: "LangChain API Server",
    routes: {
      "POST /user-input": "Send a message to the LangChain agent",
    },
  });
});

console.log(`Server starting on port ${PORT}...`);
console.log(`Available routes:`);
console.log(`  GET  / - Server info`);
console.log(`  POST /user-input - Process user messages`);

export default {
  port: PORT,
  fetch: app.fetch,
};
