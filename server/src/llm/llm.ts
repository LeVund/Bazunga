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
  AddNumbers,
  Calculate,
  GetWeather,
  GetPopulation,
  GetCurrentDateTime,
  RandomNumber,
  TransformText,
  CountText,
];

export const llmWithTools = llm.bindTools(tools);

// Registry pour exécuter les tools par leur nom
export const toolsRegistry = new Map(tools.map((t) => [t.name, t]));
