import { ChatOpenAI } from "@langchain/openai";
import {
  GetPopulation,
  GetWeather,
  AddNumbers,
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

export const llmWithTools = llm.bindTools([AddNumbers, GetWeather, GetPopulation]);
