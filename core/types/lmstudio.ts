export interface LMStudioMessage {
  role: "assistant" | "user" | "system";
  content: string;
  tool_calls: any[];
}

export interface LMStudioChoice {
  index: number;
  message: LMStudioMessage;
  logprobs: null | any;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

export interface LMStudioUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LMStudioResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: LMStudioChoice[];
  usage: LMStudioUsage;
  stats: Record<string, any>;
  system_fingerprint: string;
}
