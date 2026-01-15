import { Context } from "hono";
import { llmWithTools } from "../../llm/llm";
import { sendReply } from "../client/sendReply";

export async function handleUserInput(c: Context) {
 try {
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
   return c.json({ success: false, error: "Message is required" }, 400);
  }

  const response = await llmWithTools.invoke(message);
  // await sendReply({
  //  reply: response.content,
  //  tool_calls: response.tool_calls || [],
  // });

  return c.json({
   success: true,
   reply: response.content,
   message: "Requête traitée",
  });
 } catch (error) {
  console.error("Error processing user input:", error);
  return c.json(
   {
    success: false,
    error: "Internal server error",
   },
   500,
  );
 }
}
