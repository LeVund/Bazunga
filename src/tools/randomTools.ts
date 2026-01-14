import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const GetWeather = {
 name: "GetWeather",
 description: "Get the current weather in a given location",
 schema: z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA"),
 }),
};

export const GetPopulation_legacy = {
 name: "GetPopulation",
 description: "Get the current population in a given location",
 schema: z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA"),
 }),
};

export const GetPopulation = tool(
 ({ query, total }) => `Found ${total} results for '${query}'`,
 {
  name: "get_population",
  description: "Get the current population in a given location",
  schema: z.object({
   query: z.string().describe("The city and state, e.g. San Francisco, CA"),
   total: z.string().describe("4.7 millions people"),
  }),
 },
);
