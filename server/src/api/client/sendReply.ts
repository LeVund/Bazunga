import { SendReplyData } from "@core/types/langchain";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export async function sendReply(data: SendReplyData): Promise<void> {
  try {
    const response = await fetch(`${CLIENT_URL}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`Failed to send reply: ${response.status} ${response.statusText}`);
    } else {
      console.log("Reply sent successfully to client");
    }
  } catch (error) {
    console.error("Error sending reply to client:", error);
  }
}
