import { Context } from "hono";
import { llmWithTools } from "../../llm/llm";
import { sendReply } from "../client/sendReply";
import { AIMessageResponse, ApiResponse } from "@core/types/langchain";

export async function handleUserInput(c: Context): Promise<Response> {
 try {
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
   return c.json({ success: false, error: "Message is required" }, 400);
  }

  const response = await llmWithTools.invoke(message) as AIMessageResponse;
  // await sendReply({
  //  reply: response.content,
  //  tool_calls: response.tool_calls || [],
  // });

  const apiResponse: ApiResponse = {
   success: true,
   reply: response.content,
   message: "Requête traitée",
   tool_calls: response.tool_calls,
  };

  return c.json(apiResponse);
 } catch (error) {
  console.error("Error processing user input:", error);
  const errorResponse: ApiResponse = {
   success: false,
   error: "Internal server error",
  };
  return c.json(errorResponse, 500);
 }
}
