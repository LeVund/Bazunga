import {
  ApiResponse as ServerApiResponse,
  SSEEvent,
  GenerationMetrics,
  StreamPromptRequest,
  StreamCallbacks,
  ToolCall,
} from "@core/types";

export interface ClientApiResponse {
  content: string;
  status: "success" | "error";
  timestamp: number;
}

// Données mockées pour le développement
const mockResponses: Record<string, string> = {
 "/chat": `# Réponse de l'IA

Voici une **réponse formatée** en markdown.

## Points clés

- Premier point important
- Deuxième point avec du \`code inline\`
- Troisième point

### Exemple de code

\`\`\`typescript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

> Ceci est une citation importante.
`,

 "/help": `# Aide

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| /chat    | Démarrer une conversation |
| /help    | Afficher l'aide |
| /clear   | Effacer l'historique |

### Utilisation

1. Tapez votre question dans le champ de texte
2. Appuyez sur **Entrée** pour envoyer
3. Attendez la réponse de l'IA
`,

 "/status": `# Status du serveur

- **État**: En ligne
- **Version**: 1.0.0
- **Uptime**: 24h 35m

## Métriques

- Requêtes traitées: **1,234**
- Temps de réponse moyen: **120ms**
`,
};

// Simule un délai réseau
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiService {
  private baseUrl: string;
  private useMock: boolean;
  private abortController: AbortController | null = null;
  private currentMessageId: string | null = null;

  constructor(baseUrl = "http://localhost:8080", useMock = false) {
    this.baseUrl = baseUrl;
    this.useMock = useMock;
  }

 async fetchMarkdown(endpoint: string): Promise<ClientApiResponse> {
  if (this.useMock) {
   return this.mockFetch(endpoint);
  }
  return this.realFetch(endpoint);
 }

 private async mockFetch(endpoint: string): Promise<ClientApiResponse> {
  // Simule un délai réseau de 300-800ms
  await delay(300 + Math.random() * 500);

  const content =
   mockResponses[endpoint] ||
   `# Erreur 404

L'endpoint \`${endpoint}\` n'existe pas.

## Endpoints disponibles

- \`/chat\` - Conversation avec l'IA
- \`/help\` - Aide
- \`/status\` - Status du serveur
`;

  return {
   content,
   status: mockResponses[endpoint] ? "success" : "error",
   timestamp: Date.now(),
  };
 }

 private async realFetch(endpoint: string): Promise<ClientApiResponse> {
  const response = await fetch(`${this.baseUrl}${endpoint}`);

  if (!response.ok) {
   return {
    content: `# Erreur ${response.status}\n\n${response.statusText}`,
    status: "error",
    timestamp: Date.now(),
   };
  }

  const data = await response.json();
  return {
   content: data.content || data.markdown || JSON.stringify(data, null, 2),
   status: "success",
   timestamp: Date.now(),
  };
 }

 async sendPrompt(prompt: string): Promise<ClientApiResponse> {
  if (this.useMock) {
   await delay(500 + Math.random() * 1000);

   return {
    content: `# Réponse à votre question

Vous avez demandé: **"${prompt}"**

## Analyse

Voici une réponse mockée à votre question. En production, cette réponse viendrait du serveur LangChain.

### Détails

- Prompt reçu: \`${prompt}\`
- Longueur: ${prompt.length} caractères
- Timestamp: ${new Date().toISOString()}

\`\`\`json
{
  "prompt": "${prompt}",
  "processed": true,
  "mock": true
}
\`\`\`
`,
    status: "success",
    timestamp: Date.now(),
   };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 secondes timeout

  try {
   const response = await fetch(`${this.baseUrl}/user-input`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt }),
    signal: controller.signal,
   });

   clearTimeout(timeoutId);

   const data: ServerApiResponse = await response.json();

   if (data.success) {
    return {
     content: data.reply,
     status: "success",
     timestamp: Date.now(),
    };
   } else {
    return {
     content: `# Erreur\n\n${data.error}`,
     status: "error",
     timestamp: Date.now(),
    };
   }
  } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async sendPromptStream(
    request: StreamPromptRequest,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/user-input/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parser les events SSE ligne par ligne
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Garder la dernière ligne incomplète

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case "stream_start":
                  this.currentMessageId = event.messageId || null;
                  callbacks.onStart?.(event.messageId || "");
                  break;

                case "content_delta":
                  callbacks.onContent?.(event.content || "");
                  break;

                case "tool_call_start":
                  if (event.toolCall) {
                    callbacks.onToolCallStart?.(event.toolCall as ToolCall);
                  }
                  break;

                case "tool_call_result":
                  if (event.toolResult) {
                    callbacks.onToolCallResult?.(
                      event.toolResult.id,
                      event.toolResult.result,
                    );
                  }
                  break;

                case "stream_end":
                  if (event.metrics) {
                    callbacks.onEnd?.(event.metrics);
                  }
                  this.currentMessageId = null;
                  break;

                case "error":
                  callbacks.onError?.(event.error || "Unknown error");
                  this.currentMessageId = null;
                  break;
              }
            } catch (parseError) {
              console.error("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Stream was cancelled by user
        return;
      }
      callbacks.onError?.(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      this.abortController = null;
    }
  }

  async cancelStream(): Promise<void> {
    // Abort the fetch request
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Notify server to cancel the stream
    if (this.currentMessageId) {
      try {
        await fetch(`${this.baseUrl}/user-input/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: this.currentMessageId }),
        });
      } catch (error) {
        console.error("Failed to notify server of stream cancellation:", error);
      }
      this.currentMessageId = null;
    } else {
      // Cancel all streams if no specific messageId
      try {
        await fetch(`${this.baseUrl}/user-input/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error("Failed to cancel streams:", error);
      }
    }
  }

  isStreaming(): boolean {
    return this.abortController !== null;
  }
}

// Instance singleton
export const apiService = new ApiService();
