# LangChain Client

Application Electron avec Vue3 + TypeScript pour interagir avec l'API LangChain.

## Stack Technique

- **Electron** - Framework pour applications desktop
- **Vue 3** - Framework JavaScript progressif
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **electron-vite** - Tooling optimisé pour Electron
- **marked** - Parser Markdown
- **DOMPurify** - Sanitization HTML

## Structure du Projet

```
client/
├── src/
│   ├── main/              # Process principal Electron
│   │   └── index.ts
│   ├── preload/           # Bridge sécurisé renderer/main
│   │   └── index.ts
│   └── renderer/          # Application Vue
│       ├── index.html
│       └── src/
│           ├── App.vue                    # Composant principal
│           ├── main.ts                    # Point d'entrée Vue
│           ├── components/
│           │   └── MarkdownRenderer.vue   # Rendu markdown
│           ├── services/
│           │   └── api.ts                 # Service API mocké
│           └── assets/
│               └── main.css               # Styles globaux
├── electron.vite.config.ts
├── tsconfig.json
└── package.json
```

## Installation

```bash
bun install
```

## Scripts Disponibles

```bash
# Démarrer en mode développement
bun run dev

# Build de production
bun run build

# Preview du build
bun run preview

# Vérification TypeScript
bun run typecheck
```

## Fonctionnalités

### Routes Mockées

L'application dispose de 3 routes mockées pour le développement :

- **`/chat`** - Réponse de chat avec formatage markdown
- **`/help`** - Page d'aide avec tableaux et listes
- **`/status`** - Status du serveur avec métriques

### Service API

Le service API (`src/renderer/src/services/api.ts`) fonctionne en mode mock par défaut :

```typescript
import { apiService } from '@/services/api'

// Fetch une route
const response = await apiService.fetchMarkdown('/chat')

// Envoyer un prompt
const response = await apiService.sendPrompt('Votre question')
```

Pour utiliser l'API réelle au lieu des mocks :

```typescript
const apiService = new ApiService('http://localhost:8080', false)
```

### Composant MarkdownRenderer

Affiche du markdown avec syntaxe coloring et sanitization :

```vue
<MarkdownRenderer :content="markdownString" />
```

## Sécurité

- **Context Isolation** - Séparation entre main et renderer
- **No Node Integration** - Pas d'accès direct à Node.js depuis le renderer
- **Preload Script** - Bridge sécurisé via `contextBridge`
- **DOMPurify** - Protection XSS pour le HTML généré depuis markdown

## Développement

### Mode Mock

Par défaut, l'application utilise des données mockées. Aucun serveur backend n'est nécessaire.

### Mode Production

Pour connecter au serveur réel :

1. Modifier `src/renderer/src/services/api.ts` :
   ```typescript
   export const apiService = new ApiService('http://localhost:8080', false)
   ```

2. S'assurer que le serveur backend tourne sur le port 3000

## IPC Communication

Le main process expose une API via IPC :

```typescript
// Dans le renderer
window.electronAPI.fetchApi('/endpoint')
```

## Hot Module Replacement

Le mode dev supporte le HMR pour le renderer Vue, permettant un développement rapide sans recharger l'application.
