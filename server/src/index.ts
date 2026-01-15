import { ChatOpenAI, tools } from "@langchain/openai";
import {
 GetPopulation,
 GetPopulation_legacy,
 GetWeather,
 AddNumbers,
} from "./tools/randomTools";
import ora from "ora";
import minimist from "minimist";

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
const llmWithTools = llm.bindTools([AddNumbers, GetWeather, GetPopulation]);

async function callMyBot() {
 const spinner = ora("En attente de la réponse de l'agent...").start();

 const res = await llmWithTools.invoke("coucou");

 spinner.succeed("Réponse reçue!");
 console.log(res);
}

callMyBot();
// callMyBot(args.prompt);
