# Design System Guidelines

Guide d'utilisation du design system pour garantir la cohérence visuelle de l'application.

## Table des matières

- [Couleurs](#couleurs)
- [Espacements](#espacements)
- [Typographie](#typographie)
- [Rayons de bordure](#rayons-de-bordure)
- [Transitions](#transitions)
- [Ombres](#ombres)
- [Composants](#composants)

---

## Couleurs

### Palette de couleurs

#### Couleurs de fond

```css
background-color: var(--ui-color-background-primary);    /* #1a1a1a - Fond principal */
background-color: var(--ui-color-background-secondary);  /* #242424 - Header, footer */
background-color: var(--ui-color-background-tertiary);   /* #2a2a2a - Hover states */
background-color: var(--ui-color-background-elevated);   /* #333 - Éléments surélevés */
background-color: var(--ui-color-background-code);       /* #1e1e1e - Blocs de code */
background-color: var(--ui-color-background-code-inline); /* #2d2d2d - Code inline */
```

#### Couleurs de texte

```css
color: var(--ui-color-text-primary);    /* #e0e0e0 - Texte principal */
color: var(--ui-color-text-secondary);  /* #888 - Texte secondaire */
color: var(--ui-color-text-tertiary);   /* #666 - Texte tertiaire */
color: var(--ui-color-text-muted);      /* #aaa - Texte atténué */
color: var(--ui-color-text-strong);     /* #fff - Texte fort/titres */
```

#### Couleurs de bordure

```css
border-color: var(--ui-color-border-default); /* #333 - Bordure par défaut */
border-color: var(--ui-color-border-subtle);  /* #444 - Bordure subtile */
```

#### Couleurs d'accent

```css
background-color: var(--ui-color-primary);        /* #646cff - Couleur primaire */
background-color: var(--ui-color-primary-hover);  /* #5558dd - État hover */
background-color: var(--ui-color-primary-active); /* #7580ff - État active */
```

### Règles d'utilisation

- **Toujours** utiliser les variables CSS plutôt que des valeurs en dur
- Pour les boutons primaires : `--ui-color-primary` avec transition vers `--ui-color-primary-hover`
- Pour le texte sur fond sombre : `--ui-color-text-primary`
- Pour les bordures : `--ui-color-border-default`

---

## Espacements

### Échelle d'espacement

L'application utilise une échelle d'espacement cohérente basée sur `rem` :

```css
padding: var(--ui-spacing-xs);    /* 0.25rem = 4px */
padding: var(--ui-spacing-sm);    /* 0.5rem = 8px */
padding: var(--ui-spacing-md);    /* 0.75rem = 12px */
padding: var(--ui-spacing-base);  /* 1rem = 16px */
padding: var(--ui-spacing-lg);    /* 1.5rem = 24px */
padding: var(--ui-spacing-xl);    /* 2rem = 32px */
padding: var(--ui-spacing-2xl);   /* 3rem = 48px */
```

### Règles d'utilisation

- **Padding de composants :** Utiliser `--ui-spacing-base` ou `--ui-spacing-lg`
- **Gaps entre éléments :** Utiliser `--ui-gap-sm` ou `--ui-gap-base`
- **Marges externes :** Utiliser les variables `--ui-margin-*`
- **Espacement de sections :** Utiliser `--ui-spacing-xl` ou `--ui-spacing-2xl`

### Exemples

```css
/* Padding d'un composant card */
.card {
  padding: var(--ui-spacing-lg) var(--ui-spacing-xl);
}

/* Gap entre éléments d'une liste */
.list {
  display: flex;
  gap: var(--ui-gap-base);
}

/* Marge entre sections */
.section + .section {
  margin-top: var(--ui-margin-xl);
}
```

---

## Typographie

### Familles de police

```css
font-family: var(--ui-font-family-base); /* Police système pour l'interface */
font-family: var(--ui-font-family-code); /* Police monospace pour le code */
```

### Tailles de police

```css
font-size: var(--ui-font-size-xs);   /* 0.75rem = 12px */
font-size: var(--ui-font-size-sm);   /* 0.9em = ~14px */
font-size: var(--ui-font-size-base); /* 1rem = 16px */
font-size: var(--ui-font-size-md);   /* 1.25em = ~20px */
font-size: var(--ui-font-size-lg);   /* 1.5em = ~24px */
font-size: var(--ui-font-size-xl);   /* 1.5rem = 24px */
font-size: var(--ui-font-size-2xl);  /* 2em = ~32px */
```

### Poids de police

```css
font-weight: var(--ui-font-weight-normal);   /* 400 */
font-weight: var(--ui-font-weight-medium);   /* 500 */
font-weight: var(--ui-font-weight-semibold); /* 600 */
font-weight: var(--ui-font-weight-bold);     /* 700 */
```

### Hauteur de ligne

```css
line-height: var(--ui-line-height-tight);   /* 1.5 - Pour les titres */
line-height: var(--ui-line-height-base);    /* 1.6 - Par défaut */
line-height: var(--ui-line-height-relaxed); /* 1.8 - Pour le contenu */
```

---

## Rayons de bordure

```css
border-radius: var(--ui-radius-sm);     /* 4px - Petits éléments */
border-radius: var(--ui-radius-base);   /* 6px - Boutons */
border-radius: var(--ui-radius-md);     /* 8px - Inputs, cards */
border-radius: var(--ui-radius-lg);     /* 12px - Messages, panels */
border-radius: var(--ui-radius-full);   /* 50% - Cercles */
border-radius: var(--ui-radius-circle); /* 9999px - Pills */
```

### Règles d'utilisation

- **Boutons :** `--ui-radius-base` ou `--ui-radius-md`
- **Inputs :** `--ui-radius-md`
- **Cards/Messages :** `--ui-radius-lg`
- **Avatars/Icônes rondes :** `--ui-radius-full`

---

## Transitions

```css
transition: all var(--ui-transition-fast);   /* 0.2s ease - Interactions rapides */
transition: all var(--ui-transition-base);   /* 0.3s ease-out - Standard */
transition: all var(--ui-transition-smooth); /* 0.35s cubic-bezier - Fluide */
```

### Règles d'utilisation

- **Hover sur boutons :** `--ui-transition-fast`
- **Animations de composants :** `--ui-transition-base`
- **Panels, modals :** `--ui-transition-smooth`

---

## Ombres

```css
box-shadow: var(--ui-shadow-sm);   /* Ombre légère */
box-shadow: var(--ui-shadow-base); /* Ombre standard */
box-shadow: var(--ui-shadow-md);   /* Ombre moyenne */
box-shadow: var(--ui-shadow-lg);   /* Ombre importante */
```

### Règles d'utilisation

- Éviter les ombres sur fond sombre (déjà utilisé dans l'app)
- Privilégier les bordures pour la séparation visuelle

---

## Z-Index

```css
z-index: var(--ui-z-index-base);     /* 1 - Éléments de base */
z-index: var(--ui-z-index-dropdown); /* 10 - Dropdowns */
z-index: var(--ui-z-index-sticky);   /* 50 - Headers sticky */
z-index: var(--ui-z-index-sidebar);  /* 100 - Sidebars, panels */
z-index: var(--ui-z-index-modal);    /* 1000 - Modals */
z-index: var(--ui-z-index-tooltip);  /* 2000 - Tooltips */
```

---

## Composants

### Structure des composants génériques

Les composants génériques doivent être placés dans `ui-kit/components/` et suivre ces règles :

1. **Utiliser uniquement les tokens du design system**
2. **Éviter les valeurs en dur**
3. **Documenter les props et l'utilisation**
4. **Respecter l'accessibilité (aria-labels, roles, etc.)**

### Exemple de composant

```vue
<template>
  <button class="ui-button">
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  padding: var(--ui-spacing-md) var(--ui-spacing-lg);
  border-radius: var(--ui-radius-md);
  background-color: var(--ui-color-primary);
  color: var(--ui-color-text-strong);
  font-weight: var(--ui-font-weight-medium);
  transition: background-color var(--ui-transition-fast);
}

.ui-button:hover {
  background-color: var(--ui-color-primary-hover);
}
</style>
```

---

## Import du design system

Pour utiliser les tokens dans vos composants, importez le fichier tokens.css dans `main.ts` :

```typescript
import './ui-kit/styles/tokens.css'
```

Les variables CSS seront alors disponibles globalement dans tous vos composants.

---

## Bonnes pratiques

1. **Ne jamais** écrire de couleurs en dur (hex, rgb, etc.)
2. **Toujours** utiliser les variables d'espacement pour padding/margin
3. **Préférer** les variables de transition plutôt que des valeurs personnalisées
4. **Documenter** tout nouveau token ajouté au système
5. **Tester** l'accessibilité des contrastes de couleurs
6. **Maintenir** la cohérence avec les valeurs existantes

---

## Maintenance du design system

Si vous devez ajouter de nouvelles valeurs :

1. Vérifier qu'une valeur similaire n'existe pas déjà
2. Ajouter la variable dans `tokens.css` avec un nom cohérent
3. Documenter la nouvelle variable dans ce fichier
4. Mettre à jour les composants existants si nécessaire

---

**Version :** 1.0.0
**Dernière mise à jour :** 2026-01-16
