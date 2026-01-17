/model
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Bold, Italic, Code, Link, List, Heading2 } from "lucide-vue-next";

interface Props {
 textareaRef?: HTMLTextAreaElement | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
 format: [type: string];
}>();

// Détection de la plateforme
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";

// Helper pour générer le texte du tooltip
function getTooltip(action: string, shortcut: string): string {
 return `${action} (${shortcut})`;
}

// Raccourcis clavier
onMounted(() => {
 if (props.textareaRef) {
  props.textareaRef.addEventListener("keydown", handleKeydown);
 }
});

onUnmounted(() => {
 if (props.textareaRef) {
  props.textareaRef.removeEventListener("keydown", handleKeydown);
 }
});

function handleKeydown(event: KeyboardEvent) {
 const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
 const modKey = isMac ? event.metaKey : event.ctrlKey;

 if (modKey && event.key === "b") {
  event.preventDefault();
  formatBold();
 } else if (modKey && event.key === "i") {
  event.preventDefault();
  formatItalic();
 } else if (modKey && event.key === "k") {
  event.preventDefault();
  if (event.shiftKey) {
   formatLink();
  } else {
   formatCode();
  }
 } else if (modKey && event.shiftKey && event.key === "@") {
  // Shift+2 on most keyboards
  event.preventDefault();
  formatHeading();
 } else if (modKey && event.shiftKey && event.key === "L") {
  event.preventDefault();
  formatList();
 }
}

function wrapSelection(before: string, after: string = before) {
 const textarea = props.textareaRef;
 if (!textarea) return;

 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const selectedText = textarea.value.substring(start, end);
 const beforeText = textarea.value.substring(0, start);
 const afterText = textarea.value.substring(end);

 const newText = beforeText + before + selectedText + after + afterText;

 // Émettre l'événement avec le nouveau texte
 emit("format", newText);

 // Attendre le prochain tick pour repositionner le curseur
 setTimeout(() => {
  if (selectedText) {
   // Si du texte était sélectionné, sélectionner le texte wrappé
   textarea.setSelectionRange(start + before.length, end + before.length);
  } else {
   // Si rien n'était sélectionné, placer le curseur entre les marqueurs
   textarea.setSelectionRange(start + before.length, start + before.length);
  }
  textarea.focus();
 }, 0);
}

function formatBold() {
 wrapSelection("**");
}

function formatItalic() {
 wrapSelection("*");
}

function formatCode() {
 wrapSelection("`");
}

function formatLink() {
 wrapSelection("[", "](url)");
}

function formatList() {
 const textarea = props.textareaRef;
 if (!textarea) return;

 const start = textarea.selectionStart;
 const beforeText = textarea.value.substring(0, start);
 const afterText = textarea.value.substring(start);

 // Ajouter une puce au début de la ligne
 const newText = beforeText + "\n- ";

 emit("format", newText + afterText);

 setTimeout(() => {
  textarea.setSelectionRange(newText.length, newText.length);
  textarea.focus();
 }, 0);
}

function formatHeading() {
 const textarea = props.textareaRef;
 if (!textarea) return;

 const start = textarea.selectionStart;
 const beforeText = textarea.value.substring(0, start);
 const afterText = textarea.value.substring(start);

 const newText = beforeText + "\n## ";

 emit("format", newText + afterText);

 setTimeout(() => {
  textarea.setSelectionRange(newText.length, newText.length);
  textarea.focus();
 }, 0);
}
</script>

<template>
 <div class="markdown-toolbar">
  <button
   type="button"
   class="toolbar-btn"
   @click="formatBold"
   :title="getTooltip('Gras', `${modKey}+B`)"
   aria-label="Formater en gras"
  >
   <Bold :size="14" />
  </button>

  <button
   type="button"
   class="toolbar-btn"
   @click="formatItalic"
   :title="getTooltip('Italique', `${modKey}+I`)"
   aria-label="Formater en italique"
  >
   <Italic :size="14" />
  </button>

  <button
   type="button"
   class="toolbar-btn"
   @click="formatCode"
   :title="getTooltip('Code inline', `${modKey}+K`)"
   aria-label="Formater en code"
  >
   <Code :size="14" />
  </button>

  <div class="toolbar-separator"></div>

  <button
   type="button"
   class="toolbar-btn"
   @click="formatHeading"
   :title="getTooltip('Titre', `${modKey}+Shift+2`)"
   aria-label="Insérer un titre"
  >
   <Heading2 :size="14" />
  </button>

  <button
   type="button"
   class="toolbar-btn"
   @click="formatList"
   :title="getTooltip('Liste', `${modKey}+Shift+L`)"
   aria-label="Insérer une liste"
  >
   <List :size="14" />
  </button>

  <button
   type="button"
   class="toolbar-btn"
   @click="formatLink"
   :title="getTooltip('Lien', `${modKey}+Shift+K`)"
   aria-label="Insérer un lien"
  >
   <Link :size="14" />
  </button>
 </div>
</template>

<style scoped>
.markdown-toolbar {
 display: flex;
 align-items: center;
 gap: 2px;
 padding: 6px 8px;
 background-color: var(--ui-color-background-secondary);
 border: 1px solid var(--ui-color-border-subtle);
 border-bottom: none;
 border-radius: var(--ui-radius-md) var(--ui-radius-md) 0 0;
}

.toolbar-btn {
 display: flex;
 align-items: center;
 justify-content: center;
 padding: 6px;
 background: transparent;
 border: none;
 border-radius: 4px;
 color: var(--ui-color-text-tertiary);
 cursor: pointer;
 transition: all 0.15s ease;
}

.toolbar-btn:hover {
 background-color: var(--ui-color-background-tertiary);
 color: var(--ui-color-text-primary);
}

.toolbar-btn:active {
 background-color: var(--ui-color-background-elevated);
 color: var(--ui-color-primary);
 transform: scale(0.95);
}

.toolbar-btn:focus-visible {
 outline: 2px solid var(--ui-color-primary);
 outline-offset: 1px;
}

.toolbar-separator {
 width: 1px;
 height: 16px;
 background-color: var(--ui-color-border-subtle);
 margin: 0 4px;
 opacity: 0.5;
}
</style>
