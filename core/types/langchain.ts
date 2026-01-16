import { LMStudioResponse } from "./lmstudio";

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  type?: "tool_call";
}

export interface AIMessageResponse {
  content: string;
  tool_calls?: ToolCall[];
  additional_kwargs?: Record<string, any>;
  response_metadata?: {
    tokenUsage?: {
      completionTokens: number;
      promptTokens: number;
      totalTokens: number;
    };
    finish_reason?: string;
  };
  id?: string;
}

export interface SendReplyData {
  reply: string;
  tool_calls: ToolCall[];
}

export interface ApiSuccessResponse {
  success: true;
  reply: string;
  message: string;
  tool_calls?: ToolCall[];
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// SSE Streaming Types
export type SSEEventType =
  | "stream_start"
  | "content_delta"
  | "tool_call_start"
  | "tool_call_result"
  | "stream_end"
  | "error";

export interface SSEEvent {
  type: SSEEventType;
  messageId?: string;
  content?: string;
  toolCall?: { id: string; name: string; args: Record<string, any> };
  toolResult?: { id: string; result: string };
  metrics?: GenerationMetrics;
  error?: string;
}

export interface GenerationMetrics {
  tokensPerSecond: number;
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
  durationMs: number;
  finishReason: "stop" | "length" | "cancelled" | "error";
}

export interface StreamPromptRequest {
  message: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  regenerateMessageId?: string;
  continueFromMessageId?: string;
}

export interface StreamCallbacks {
  onStart?: (messageId: string) => void;
  onContent?: (content: string) => void;
  onToolCallStart?: (toolCall: ToolCall) => void;
  onToolCallResult?: (id: string, result: string) => void;
  onEnd?: (metrics: GenerationMetrics) => void;
  onError?: (error: string) => void;
}
