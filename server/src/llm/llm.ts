import { ChatOpenAI } from "@langchain/openai";
import {
  GetPopulation,
  GetWeather,
  AddNumbers,
  Calculate,
  GetCurrentDateTime,
  RandomNumber,
  TransformText,
  CountText,
} from "./tools/randomTools";
import { ExecuteShellCommand } from "./tools/shellTools";

// Doc found here : https://v03.api.js.langchain.com/classes/_langchain_openai.ChatOpenAI.html
export const llm = new ChatOpenAI({
  model: "Ministral-3-8B-Instruct-2512-4bit",
  temperature: 0,
  maxTokens: undefined,
  timeout: undefined,
  maxRetries: 2,
  apiKey: "local_env",
  configuration: {
    baseURL: "http://127.0.0.1:1234/v1",
  },
});

const tools = [
  // AddNumbers,
  // Calculate,
  // GetWeather,
  // GetPopulation,
  // GetCurrentDateTime,
  // RandomNumber,
  // TransformText,
  // CountText,
  ExecuteShellCommand,
];

export const llmWithTools = llm.bindTools(tools);

// Registry pour exécuter les tools par leur nom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toolsRegistry = new Map<string, { invoke: (args: any) => Promise<any> }>(
  tools.map((t) => [t.name, t as any])
);
