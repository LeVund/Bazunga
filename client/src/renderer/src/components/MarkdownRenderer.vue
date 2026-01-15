<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{
  content: string
}>()

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedHtml = computed(() => {
  const rawHtml = marked(props.content) as string
  // Sanitize HTML pour éviter les XSS
  return DOMPurify.sanitize(rawHtml)
})
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<style scoped>
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  line-height: var(--ui-line-height-base);
  color: var(--ui-color-text-primary);
}

.markdown-body :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid var(--ui-color-border-subtle);
  padding-bottom: 0.3em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid var(--ui-color-border-default);
  padding-bottom: 0.3em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body :deep(p) {
  margin: 0.5em 0;
}

.markdown-body :deep(code) {
  background-color: var(--ui-color-background-code-inline);
  padding: 0.2em 0.4em;
  border-radius: var(--ui-radius-sm);
  font-family: var(--ui-font-family-code);
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: var(--ui-color-background-code);
  padding: 1em;
  border-radius: var(--ui-radius-md);
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--ui-color-primary);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--ui-color-text-muted);
  font-style: italic;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--ui-color-border-subtle);
  padding: 0.5em 1em;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: var(--ui-color-background-code-inline);
}

.markdown-body :deep(a) {
  color: var(--ui-color-primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  color: var(--ui-color-text-strong);
}
</style>
