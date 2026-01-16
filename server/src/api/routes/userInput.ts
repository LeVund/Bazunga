import { Context } from "hono";
import { llmWithTools, toolsRegistry } from "../../llm/llm";
import { sendReply } from "../client/sendReply";
import { AIMessageResponse, ApiResponse } from "@core/types/langchain";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

export async function handleUserInput(c: Context): Promise<Response> {
 try {
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
   return c.json({ success: false, error: "Message is required" }, 400);
  }

  // Première invocation
  let response = (await llmWithTools.invoke([
   new HumanMessage(message),
  ])) as AIMessageResponse;

  // Boucle d'exécution des tools
  const messages: (HumanMessage | AIMessage | ToolMessage)[] = [
   new HumanMessage(message),
  ];

  while (response.tool_calls && response.tool_calls.length > 0) {
   // Ajouter la réponse du LLM aux messages
   messages.push(new AIMessage(response));

   // Exécuter chaque tool et collecter les résultats
   for (const toolCall of response.tool_calls) {
    const tool = toolsRegistry.get(toolCall.name);
    if (tool) {
     const result = await tool.invoke(toolCall.args);
     messages.push(
      new ToolMessage({
       tool_call_id: toolCall.id,
       content: String(result),
      }),
     );
    } else {
     messages.push(
      new ToolMessage({
       tool_call_id: toolCall.id,
       content: `Tool "${toolCall.name}" not found`,
      }),
     );
    }
   }

   // Réinvoquer le LLM avec les résultats des tools
   response = (await llmWithTools.invoke(messages)) as AIMessageResponse;
  }

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
