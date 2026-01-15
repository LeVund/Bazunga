export interface ApiResponse {
  content: string
  status: 'success' | 'error'
  timestamp: number
}

// Données mockées pour le développement
const mockResponses: Record<string, string> = {
  '/chat': `# Réponse de l'IA

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

  '/help': `# Aide

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

  '/status': `# Status du serveur

- **État**: En ligne
- **Version**: 1.0.0
- **Uptime**: 24h 35m

## Métriques

- Requêtes traitées: **1,234**
- Temps de réponse moyen: **120ms**
`
}

// Simule un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class ApiService {
  private baseUrl: string
  private useMock: boolean

  constructor(baseUrl = 'http://localhost:3000', useMock = true) {
    this.baseUrl = baseUrl
    this.useMock = useMock
  }

  async fetchMarkdown(endpoint: string): Promise<ApiResponse> {
    if (this.useMock) {
      return this.mockFetch(endpoint)
    }
    return this.realFetch(endpoint)
  }

  private async mockFetch(endpoint: string): Promise<ApiResponse> {
    // Simule un délai réseau de 300-800ms
    await delay(300 + Math.random() * 500)

    const content = mockResponses[endpoint] || `# Erreur 404

L'endpoint \`${endpoint}\` n'existe pas.

## Endpoints disponibles

- \`/chat\` - Conversation avec l'IA
- \`/help\` - Aide
- \`/status\` - Status du serveur
`

    return {
      content,
      status: mockResponses[endpoint] ? 'success' : 'error',
      timestamp: Date.now()
    }
  }

  private async realFetch(endpoint: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)

    if (!response.ok) {
      return {
        content: `# Erreur ${response.status}\n\n${response.statusText}`,
        status: 'error',
        timestamp: Date.now()
      }
    }

    const data = await response.json()
    return {
      content: data.content || data.markdown || JSON.stringify(data, null, 2),
      status: 'success',
      timestamp: Date.now()
    }
  }

  async sendPrompt(prompt: string): Promise<ApiResponse> {
    if (this.useMock) {
      await delay(500 + Math.random() * 1000)

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
        status: 'success',
        timestamp: Date.now()
      }
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })

    const data = await response.json()
    return {
      content: data.content || data.response,
      status: response.ok ? 'success' : 'error',
      timestamp: Date.now()
    }
  }
}

// Instance singleton
export const apiService = new ApiService()
