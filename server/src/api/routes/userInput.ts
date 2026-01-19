import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { llmWithTools, llm, toolsRegistry } from "../../llm/llm";
import { sendReply } from "../client/sendReply";
import {
  AIMessageResponse,
  ApiResponse,
  SSEEvent,
  GenerationMetrics,
  StreamPromptRequest,
} from "@core/types/langchain";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

// Map pour tracker les streams actifs
const activeStreams = new Map<string, AbortController>();

// Estimation simple des tokens (approximation ~4 chars/token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Générer un ID unique
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Handler pour le streaming SSE
export async function handleUserInputStream(c: Context): Promise<Response> {
  const body = await c.req.json<StreamPromptRequest>();
  const { message, conversationHistory = [] } = body;

  if (!message) {
    return c.json({ success: false, error: "Message is required" }, 400);
  }

  const messageId = generateMessageId();
  const abortController = new AbortController();
  activeStreams.set(messageId, abortController);

  return streamSSE(c, async (stream) => {
    const startTime = Date.now();
    let totalCompletionTokens = 0;
    let totalPromptTokens = estimateTokens(message);
    let finishReason: GenerationMetrics["finishReason"] = "stop";
    let fullContent = "";

    try {
      // 1. Envoyer stream_start
      const startEvent: SSEEvent = { type: "stream_start", messageId };
      await stream.writeSSE({ data: JSON.stringify(startEvent) });

      // Construire les messages pour le LLM
      const messages: (HumanMessage | AIMessage)[] = [];

      // Ajouter l'historique de conversation
      for (const msg of conversationHistory) {
        if (msg.role === "user") {
          messages.push(new HumanMessage(msg.content));
          totalPromptTokens += estimateTokens(msg.content);
        } else {
          messages.push(new AIMessage(msg.content));
          totalPromptTokens += estimateTokens(msg.content);
        }
      }

      // Ajouter le message actuel
      messages.push(new HumanMessage(message));

      // 2. Streamer avec LangChain
      const streamResult = await llmWithTools.stream(messages, {
        signal: abortController.signal,
      });

      // Variables pour détecter les tool calls (accumuler par index)
      const toolCallsMap = new Map<number, {
        id: string;
        name: string;
        args: string; // Arguments JSON en string, à parser à la fin
      }>();

      for await (const chunk of streamResult) {
        if (abortController.signal.aborted) {
          finishReason = "cancelled";
          break;
        }

        // Gérer le contenu texte
        if (chunk.content && typeof chunk.content === "string") {
          fullContent += chunk.content;
          totalCompletionTokens += estimateTokens(chunk.content);

          const contentEvent: SSEEvent = {
            type: "content_delta",
            content: chunk.content,
          };
          await stream.writeSSE({ data: JSON.stringify(contentEvent) });
        }

        // Accumuler les tool_call_chunks (streaming des arguments)
        const chunkAny = chunk as any;
        if (chunkAny.tool_call_chunks && chunkAny.tool_call_chunks.length > 0) {
          for (const toolChunk of chunkAny.tool_call_chunks) {
            const index = toolChunk.index ?? 0;
            const existing = toolCallsMap.get(index);

            if (existing) {
              // Accumuler les arguments
              if (toolChunk.args) {
                existing.args += toolChunk.args;
              }
            } else {
              // Nouveau tool call
              toolCallsMap.set(index, {
                id: toolChunk.id || "",
                name: toolChunk.name || "",
                args: toolChunk.args || "",
              });
            }
          }
        }
      }

      // Convertir la map en array et parser les arguments JSON
      const pendingToolCalls = Array.from(toolCallsMap.values())
        .filter(tc => tc.name) // Filtrer les entrées vides
        .map(tc => ({
          id: tc.id,
          name: tc.name,
          args: tc.args ? JSON.parse(tc.args) : {},
        }));

      // 3. Gérer les tool_calls si présents
      if (pendingToolCalls.length > 0 && !abortController.signal.aborted) {
        const allMessages: (HumanMessage | AIMessage | ToolMessage)[] = [
          ...messages,
          new AIMessage({ content: fullContent, tool_calls: pendingToolCalls }),
        ];

        for (const toolCall of pendingToolCalls) {
          // Envoyer tool_call_start
          const toolStartEvent: SSEEvent = {
            type: "tool_call_start",
            toolCall: {
              id: toolCall.id,
              name: toolCall.name,
              args: toolCall.args,
            },
          };
          await stream.writeSSE({ data: JSON.stringify(toolStartEvent) });

          // Exécuter le tool
          const tool = toolsRegistry.get(toolCall.name);
          let result: string;
          if (tool) {
            try {
              result = String(await tool.invoke(toolCall.args));
            } catch (e) {
              result = `Error: ${e instanceof Error ? e.message : "Unknown error"}`;
            }
          } else {
            result = `Tool "${toolCall.name}" not found`;
          }

          // Ajouter le résultat aux messages
          allMessages.push(
            new ToolMessage({
              tool_call_id: toolCall.id,
              content: result,
            }),
          );

          // Envoyer tool_call_result
          const toolResultEvent: SSEEvent = {
            type: "tool_call_result",
            toolResult: { id: toolCall.id, result },
          };
          await stream.writeSSE({ data: JSON.stringify(toolResultEvent) });
        }

        // Continuer la génération après les tools
        if (!abortController.signal.aborted) {
          const continueStream = await llmWithTools.stream(allMessages, {
            signal: abortController.signal,
          });

          for await (const chunk of continueStream) {
            if (abortController.signal.aborted) {
              finishReason = "cancelled";
              break;
            }

            if (chunk.content && typeof chunk.content === "string") {
              fullContent += chunk.content;
              totalCompletionTokens += estimateTokens(chunk.content);

              const contentEvent: SSEEvent = {
                type: "content_delta",
                content: chunk.content,
              };
              await stream.writeSSE({ data: JSON.stringify(contentEvent) });
            }
          }
        }
      }

      // 4. Calculer et envoyer stream_end avec métriques
      const durationMs = Date.now() - startTime;
      const tokensPerSecond =
        durationMs > 0 ? (totalCompletionTokens / durationMs) * 1000 : 0;

      const metrics: GenerationMetrics = {
        tokensPerSecond,
        completionTokens: totalCompletionTokens,
        promptTokens: totalPromptTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        durationMs,
        finishReason,
      };

      const endEvent: SSEEvent = { type: "stream_end", metrics };
      await stream.writeSSE({ data: JSON.stringify(endEvent) });
    } catch (error) {
      if (abortController.signal.aborted) {
        // Cancelled by user
        const durationMs = Date.now() - startTime;
        const metrics: GenerationMetrics = {
          tokensPerSecond:
            durationMs > 0 ? (totalCompletionTokens / durationMs) * 1000 : 0,
          completionTokens: totalCompletionTokens,
          promptTokens: totalPromptTokens,
          totalTokens: totalPromptTokens + totalCompletionTokens,
          durationMs,
          finishReason: "cancelled",
        };
        const endEvent: SSEEvent = { type: "stream_end", metrics };
        await stream.writeSSE({ data: JSON.stringify(endEvent) });
      } else {
        const errorEvent: SSEEvent = {
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
        await stream.writeSSE({ data: JSON.stringify(errorEvent) });
      }
    } finally {
      activeStreams.delete(messageId);
    }
  });
}

// Handler pour annuler un stream
export async function handleCancelStream(c: Context): Promise<Response> {
  try {
    const body = await c.req.json<{ messageId?: string }>();
    const { messageId } = body;

    if (messageId && activeStreams.has(messageId)) {
      const controller = activeStreams.get(messageId);
      controller?.abort();
      activeStreams.delete(messageId);
      return c.json({ success: true, message: "Stream cancelled" });
    }

    // Si pas de messageId spécifique, annuler tous les streams actifs
    if (!messageId) {
      for (const [id, controller] of activeStreams) {
        controller.abort();
        activeStreams.delete(id);
      }
      return c.json({
        success: true,
        message: "All streams cancelled",
        count: activeStreams.size,
      });
    }

    return c.json({ success: false, error: "Stream not found" }, 404);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
}

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
