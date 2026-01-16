import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Simule la récupération de la météo pour une ville donnée.
 * Retourne des données fictives réalistes.
 */
export const GetWeather = tool(
 ({ location }) => {
  const conditions = ["ensoleillé ☀️", "nuageux ☁️", "pluvieux 🌧️", "orageux ⛈️", "neigeux ❄️"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temperature = Math.floor(Math.random() * 35) - 5; // -5 à 30°C

  return `Météo à ${location}: ${temperature}°C, ${condition}`;
 },
 {
  name: "get_weather",
  description: "Get the current weather in a given location",
  schema: z.object({
   location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
 },
);

/**
 * Simule la récupération de la population d'une ville.
 * Retourne une estimation fictive basée sur le nom de la ville.
 */
export const GetPopulation = tool(
 ({ location }) => {
  // Génère un nombre pseudo-aléatoire basé sur le nom de la ville
  const hash = location.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const population = (hash * 12345) % 10000000 + 50000;
  const formatted = new Intl.NumberFormat("fr-FR").format(population);

  return `Population estimée de ${location}: ${formatted} habitants`;
 },
 {
  name: "get_population",
  description: "Get the estimated population of a given city",
  schema: z.object({
   location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
 },
);

/**
 * Additionne deux nombres.
 */
export const AddNumbers = tool(
 ({ a, b }) => {
  return `${a} + ${b} = ${a + b}`;
 },
 {
  name: "add_numbers",
  description: "Add two numbers together",
  schema: z.object({
   a: z.number().describe("The first number"),
   b: z.number().describe("The second number"),
  }),
 },
);

/**
 * Effectue des opérations mathématiques de base.
 */
export const Calculate = tool(
 ({ expression }) => {
  try {
   // Sécurise l'expression en n'autorisant que les caractères mathématiques
   const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
   if (sanitized !== expression) {
    return "Erreur: L'expression contient des caractères non autorisés";
   }
   const result = Function(`"use strict"; return (${sanitized})`)();
   return `${expression} = ${result}`;
  } catch {
   return `Erreur: Impossible d'évaluer l'expression "${expression}"`;
  }
 },
 {
  name: "calculate",
  description: "Evaluate a mathematical expression (supports +, -, *, /, %, parentheses)",
  schema: z.object({
   expression: z.string().describe("The mathematical expression to evaluate, e.g. '2 + 2' or '(10 * 5) / 2'"),
  }),
 },
);

/**
 * Retourne la date et l'heure actuelles.
 */
export const GetCurrentDateTime = tool(
 ({ timezone, format }) => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
   timeZone: timezone || "Europe/Paris",
   dateStyle: format === "date" ? "full" : undefined,
   timeStyle: format === "time" ? "medium" : undefined,
  };

  if (format === "both" || !format) {
   options.dateStyle = "full";
   options.timeStyle = "medium";
  }

  return new Intl.DateTimeFormat("fr-FR", options).format(date);
 },
 {
  name: "get_current_datetime",
  description: "Get the current date and/or time",
  schema: z.object({
   timezone: z.string().optional().describe("The timezone, e.g. 'Europe/Paris', 'America/New_York'. Defaults to Europe/Paris"),
   format: z.enum(["date", "time", "both"]).optional().describe("What to return: 'date', 'time', or 'both'. Defaults to 'both'"),
  }),
 },
);

/**
 * Génère un nombre aléatoire dans une plage donnée.
 */
export const RandomNumber = tool(
 ({ min, max }) => {
  const minVal = min ?? 0;
  const maxVal = max ?? 100;
  const result = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  return `Nombre aléatoire entre ${minVal} et ${maxVal}: ${result}`;
 },
 {
  name: "random_number",
  description: "Generate a random integer between min and max (inclusive)",
  schema: z.object({
   min: z.number().optional().describe("Minimum value (default: 0)"),
   max: z.number().optional().describe("Maximum value (default: 100)"),
  }),
 },
);

/**
 * Convertit du texte en majuscules, minuscules ou capitalise.
 */
export const TransformText = tool(
 ({ text, transformation }) => {
  switch (transformation) {
   case "uppercase":
    return text.toUpperCase();
   case "lowercase":
    return text.toLowerCase();
   case "capitalize":
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
   case "reverse":
    return text.split("").reverse().join("");
   default:
    return text;
  }
 },
 {
  name: "transform_text",
  description: "Transform text: uppercase, lowercase, capitalize each word, or reverse",
  schema: z.object({
   text: z.string().describe("The text to transform"),
   transformation: z.enum(["uppercase", "lowercase", "capitalize", "reverse"]).describe("The type of transformation"),
  }),
 },
);

/**
 * Compte les caractères, mots et lignes d'un texte.
 */
export const CountText = tool(
 ({ text }) => {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split(/\n/).length;

  return `Caractères: ${chars}, Mots: ${words}, Lignes: ${lines}`;
 },
 {
  name: "count_text",
  description: "Count characters, words, and lines in a text",
  schema: z.object({
   text: z.string().describe("The text to analyze"),
  }),
 },
);
