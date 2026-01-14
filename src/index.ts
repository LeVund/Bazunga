import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

const getWeather = tool((input) => `It's always sunny in ${input.city}!`, {
 name: "get_weather",
 description: "Get the weather for a given city",
 schema: z.object({
  city: z.string().describe("The city to get the weather for"),
 }),
});

// Doc found here : https://v03.api.js.langchain.com/classes/_langchain_openai.ChatOpenAI.html
const llm = new ChatOpenAI({
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

async function callMyBot() {
 const res = await llm.invoke("Comment tu vas ?");

 console.log(res);
}

callMyBot();
