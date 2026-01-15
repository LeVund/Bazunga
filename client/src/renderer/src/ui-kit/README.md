# UI Kit - Design System

Système de design centralisé pour l'application LangChain Client.

## Structure du dossier

```
ui-kit/
├── README.md                  # Ce fichier
├── guidelines.md              # Documentation complète du design system
├── styles/
│   └── tokens.css            # Variables CSS (tokens) du design system
└── components/
    └── (composants génériques à venir)
```

## Utilisation

### Import des tokens

Les tokens CSS sont automatiquement importés dans `main.ts` et sont disponibles globalement dans toute l'application.

```typescript
// src/renderer/src/main.ts
import './ui-kit/styles/tokens.css'
```

### Utilisation dans les composants

Utilisez les variables CSS au lieu de valeurs en dur :

```vue
<style scoped>
/* ❌ Mauvais - Valeurs en dur */
.button {
  background-color: #646cff;
  padding: 12px 24px;
  border-radius: 8px;
}

/* ✅ Bon - Utilisation des tokens */
.button {
  background-color: var(--ui-color-primary);
  padding: var(--ui-spacing-md) var(--ui-spacing-lg);
  border-radius: var(--ui-radius-md);
}
</style>
```

## Tokens disponibles

### Couleurs

- **Fond**: `--ui-color-background-*` (primary, secondary, tertiary, etc.)
- **Texte**: `--ui-color-text-*` (primary, secondary, strong, etc.)
- **Bordures**: `--ui-color-border-*` (default, subtle)
- **Accent**: `--ui-color-primary`, `--ui-color-primary-hover`, etc.

### Espacements

- **Padding/Margin**: `--ui-spacing-*` / `--ui-margin-*` (xs, sm, md, base, lg, xl, 2xl)
- **Gap**: `--ui-gap-*` (xs, sm, md, base, lg)

### Typographie

- **Familles**: `--ui-font-family-base`, `--ui-font-family-code`
- **Tailles**: `--ui-font-size-*` (xs, sm, base, md, lg, xl, 2xl)
- **Poids**: `--ui-font-weight-*` (normal, medium, semibold, bold)
- **Hauteur de ligne**: `--ui-line-height-*` (tight, base, relaxed)

### Autres

- **Border-radius**: `--ui-radius-*` (sm, base, md, lg, full, circle)
- **Transitions**: `--ui-transition-*` (fast, base, smooth)
- **Z-index**: `--ui-z-index-*` (base, dropdown, sticky, sidebar, modal, tooltip)
- **Ombres**: `--ui-shadow-*` (sm, base, md, lg)

## Documentation complète

Pour la documentation complète avec des exemples et les guidelines, consultez [guidelines.md](./guidelines.md).

## Principes

1. **Cohérence** : Utilisez toujours les tokens pour garantir la cohérence visuelle
2. **Maintenabilité** : Les tokens centralisent les valeurs, facilitant les mises à jour
3. **Scalabilité** : Ajoutez de nouveaux tokens au lieu de valeurs en dur
4. **Accessibilité** : Les tokens respectent les contrastes et l'accessibilité

## Ajouter de nouveaux tokens

1. Ouvrez `styles/tokens.css`
2. Ajoutez votre nouveau token dans la section appropriée
3. Suivez la convention de nommage : `--ui-{catégorie}-{nom}`
4. Documentez le nouveau token dans `guidelines.md`

Exemple :

```css
:root {
  /* Nouvelle couleur d'erreur */
  --ui-color-error: #ff4444;
  --ui-color-error-hover: #ff5555;
}
```

## Composants génériques

Les composants réutilisables doivent être placés dans `components/` et doivent :

- Utiliser uniquement les tokens du design system
- Être documentés avec des props et exemples
- Respecter l'accessibilité
- Être testés

---

**Dernière mise à jour :** 2026-01-16
**Version du design system :** 1.0.0
