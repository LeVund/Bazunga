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
