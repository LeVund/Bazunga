# Core Types

Ce dossier contient tous les types TypeScript partagés entre le client et le serveur.

## Structure

```
core/
├── types/
│   ├── index.ts          # Export centralisé de tous les types
│   ├── lmstudio.ts       # Types pour les réponses brutes de LM Studio
│   └── langchain.ts      # Types pour LangChain et les APIs
└── package.json
```

## Types disponibles

### LM Studio (`lmstudio.ts`)

Types pour la réponse brute de l'API LM Studio:

- `LMStudioResponse`: Interface principale pour la réponse complète
- `LMStudioChoice`: Interface pour chaque choix de réponse
- `LMStudioMessage`: Interface pour les messages (assistant/user/system)
- `LMStudioUsage`: Interface pour les statistiques d'utilisation des tokens

### LangChain (`langchain.ts`)

Types pour l'intégration LangChain et les APIs:

- `AIMessageResponse`: Type pour le retour de `invoke()` de LangChain
- `ToolCall`: Interface pour les appels d'outils
- `SendReplyData`: Interface pour l'envoi de réponses au client
- `ApiResponse`: Type union pour les réponses API (succès ou erreur)
- `ApiSuccessResponse`: Interface pour les réponses API réussies
- `ApiErrorResponse`: Interface pour les réponses API en erreur

## Usage

### Depuis le serveur

```typescript
import { AIMessageResponse, ApiResponse } from "../../../../core/types";
```

### Depuis le client

```typescript
import { ApiResponse as ServerApiResponse } from "../../../../../../core/types";
```

## Flux de données

1. **LM Studio → LangChain**: LM Studio retourne une `LMStudioResponse`
2. **LangChain → Server**: LangChain encapsule la réponse dans un `AIMessageResponse`
3. **Server → Client**: Le serveur envoie une `ApiResponse` au client
4. **Client**: Le client transforme la `ServerApiResponse` en `ClientApiResponse` pour l'UI
