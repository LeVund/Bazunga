<script setup lang="ts">
import { Copy, Pencil, Trash2, RefreshCw, ArrowRight } from "lucide-vue-next";

defineProps<{
  messageType: "user" | "assistant";
  isStreaming?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  copy: [];
  edit: [];
  delete: [];
  regenerate: [];
  continue: [];
}>();
</script>

<template>
  <div class="message-actions" :class="{ disabled: disabled || isStreaming }">
    <button
      @click="emit('copy')"
      title="Copier"
      :disabled="disabled || isStreaming"
    >
      <Copy :size="14" />
    </button>
    <button
      @click="emit('edit')"
      title="Modifier"
      :disabled="disabled || isStreaming"
    >
      <Pencil :size="14" />
    </button>
    <button
      @click="emit('delete')"
      title="Supprimer"
      :disabled="disabled || isStreaming"
    >
      <Trash2 :size="14" />
    </button>
    <template v-if="messageType === 'assistant'">
      <button
        @click="emit('regenerate')"
        title="Regenerer"
        :disabled="disabled || isStreaming"
      >
        <RefreshCw :size="14" />
      </button>
      <button
        @click="emit('continue')"
        title="Continuer"
        :disabled="disabled || isStreaming"
      >
        <ArrowRight :size="14" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.message-actions {
  display: flex;
  gap: var(--ui-gap-xs, 4px);
  opacity: 0;
  transition: opacity var(--ui-transition-fast, 0.15s);
}

.message:hover .message-actions {
  opacity: 1;
}

.message-actions.disabled {
  opacity: 0.3;
  pointer-events: none;
}

.message-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--ui-radius-sm, 4px);
  background: transparent;
  color: var(--ui-color-text-secondary, #888);
  cursor: pointer;
  transition: all var(--ui-transition-fast, 0.15s);
}

.message-actions button:hover:not(:disabled) {
  background-color: var(--ui-color-background-elevated, #333);
  color: var(--ui-color-text-primary, #fff);
}

.message-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
