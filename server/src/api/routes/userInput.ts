import { Context } from "hono";
import { llmWithTools } from "../../llm";
import { sendReply } from "../client/sendReply";

export async function handleUserInput(c: Context) {
 try {
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
   return c.json({ success: false, error: "Message is required" }, 400);
  }

  console.log(`Received message: ${message}`);

  // Simuler un délai de traitement (peut aller jusqu'à 1 minute)
  // Pour l'instant, on utilise un délai aléatoire entre 2 et 5 secondes pour tester
  const delay = 2000 + Math.random() * 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const reply = "Roger roger";

  console.log(`Sending reply after ${Math.round(delay / 1000)}s: ${reply}`);

  // Option: Vous pouvez décommenter ce code plus tard pour utiliser le LLM
  // const response = await llmWithTools.invoke(message);
  // console.log("LangChain response:", response);
  // await sendReply({
  //   reply: response.content,
  //   tool_calls: response.tool_calls || [],
  // });

  return c.json({
   success: true,
   reply: reply,
   message: "Requête traitée",
  });
 } catch (error) {
  console.error("Error processing user input:", error);
  return c.json(
   {
    success: false,
    error: "Internal server error",
   },
   500,
  );
 }
}
