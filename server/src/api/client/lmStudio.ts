const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://localhost:1234";

// Types pour les requêtes et réponses (compatibles OpenAI)

export interface Model {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

export interface ListModelsResponse {
  object: "list";
  data: Model[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: Usage;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: "float" | "base64";
}

export interface Embedding {
  object: "embedding";
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  object: "list";
  data: Embedding[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface CompletionRequest {
  model: string;
  prompt: string | string[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
}

export interface CompletionChoice {
  text: string;
  index: number;
  finish_reason: "stop" | "length" | null;
}

export interface CompletionResponse {
  id: string;
  object: "text_completion";
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage: Usage;
}

// API Functions

/**
 * Récupère la liste des modèles disponibles sur le serveur LM Studio.
 * @returns Liste des modèles avec leurs métadonnées (id, propriétaire, date de création)
 */
export async function listModels(): Promise<ListModelsResponse> {
  const response = await fetch(`${LM_STUDIO_URL}/v1/models`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Génère une réponse de chat à partir d'une conversation.
 * Envoie une liste de messages (système, utilisateur, assistant) et reçoit une complétion.
 * @param request - Configuration de la requête (modèle, messages, température, etc.)
 * @returns Réponse générée avec les choix et statistiques d'utilisation des tokens
 */
export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat completion: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Génère des vecteurs d'embedding pour un ou plusieurs textes.
 * Utile pour la recherche sémantique, le clustering ou la classification.
 * @param request - Texte(s) à encoder et modèle d'embedding à utiliser
 * @returns Vecteurs d'embedding pour chaque texte fourni
 */
export async function createEmbedding(
  request: EmbeddingRequest
): Promise<EmbeddingResponse> {
  const response = await fetch(`${LM_STUDIO_URL}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create embedding: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Génère une complétion de texte à partir d'un prompt (API legacy).
 * Préférer createChatCompletion pour les nouvelles implémentations.
 * @param request - Prompt et paramètres de génération (modèle, température, etc.)
 * @returns Texte généré en continuation du prompt
 * @deprecated Utiliser createChatCompletion pour les nouveaux développements
 */
export async function createCompletion(
  request: CompletionRequest
): Promise<CompletionResponse> {
  const response = await fetch(`${LM_STUDIO_URL}/v1/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create completion: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
