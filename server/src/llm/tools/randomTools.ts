import { tool } from "@langchain/core/tools";
import { tools } from "@langchain/openai";
import { z } from "zod";

export const GetWeather = {
  name: "GetWeather",
  description: "Get the current weather in a given location",
  schema: z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    weather: z
      .string()
      .describe("The current weather is 28° celsius and sunny ☀️"),
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
  ({ query, total }) => {
    return `Found 2 results for '${query}'`;
  },
  {
    name: "get_population",
    description: "Get the current population in a given location",
    schema: z.object({
      query: z.string().describe("The city and state, e.g. San Francisco, CA"),
      total: z.string().describe("4.7 millions people"),
    }),
  }
);

// export const GetPopulation_GPT = tool(
//  async ({ location }) => {
//   // ici tu appelles une API, une DB, ou une source réelle
//   const population = await fetchPopulation(location);

//   return population;
//  },
//  {
//   name: "get_population",
//   description: "Get the current population of a given city",
//   schema: z.object({
//    location: z
//     .string()
//     .describe("City and country or state, e.g. Paris, FR or San Francisco, CA"),
//   }),
//  },
// );

export const AddNumbers = tool(
  ({ a, b }) => {
    a + b;
  },
  {
    name: "add_numbers",
    description: "Add two numbers",
    schema: z.object({
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
    }),
  }
);
