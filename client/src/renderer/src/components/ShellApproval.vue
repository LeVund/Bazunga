<script setup lang="ts">
import { ref } from "vue";
import { Check, CheckCheck, X, Terminal, Folder } from "lucide-vue-next";
import type { ShellApprovalRequest } from "@core/types";

defineProps<{
  request: ShellApprovalRequest;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  approve: [];
  alwaysApprove: [];
  reject: [];
}>();

const isProcessing = ref(false);

function handleApprove() {
  isProcessing.value = true;
  emit("approve");
}

function handleAlwaysApprove() {
  isProcessing.value = true;
  emit("alwaysApprove");
}

function handleReject() {
  isProcessing.value = true;
  emit("reject");
}
</script>

<template>
  <div class="shell-approval">
    <div class="shell-approval-header">
      <Terminal :size="16" />
      <span>Commande shell en attente d'approbation</span>
    </div>

    <div class="shell-approval-content">
      <div class="shell-command">
        <code>{{ request.command }}</code>
      </div>

      <div class="shell-directory">
        <Folder :size="14" />
        <span>{{ request.directory }}</span>
      </div>
    </div>

    <div class="shell-approval-actions">
      <button
        class="approve-btn"
        @click="handleApprove"
        :disabled="disabled || isProcessing"
        title="Exécuter cette commande une fois"
      >
        <Check :size="16" />
        Approuver
      </button>

      <button
        class="always-approve-btn"
        @click="handleAlwaysApprove"
        :disabled="disabled || isProcessing"
        title="Exécuter et toujours autoriser cette commande pour ce dossier"
      >
        <CheckCheck :size="16" />
        Toujours approuver
      </button>

      <button
        class="reject-btn"
        @click="handleReject"
        :disabled="disabled || isProcessing"
        title="Refuser cette commande"
      >
        <X :size="16" />
        Refuser
      </button>
    </div>
  </div>
</template>

<style scoped>
.shell-approval {
  display: flex;
  flex-direction: column;
  gap: var(--ui-gap-sm, 8px);
  padding: var(--ui-spacing-base, 12px);
  border-radius: var(--ui-radius-md, 8px);
  background-color: var(--ui-color-background-elevated, #2a2a2a);
  border: 1px solid var(--ui-color-border-default, #444);
  margin: var(--ui-spacing-sm, 8px) 0;
}

.shell-approval-header {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-sm, 8px);
  color: var(--ui-color-warning, #f59e0b);
  font-weight: var(--ui-font-weight-medium, 500);
  font-size: var(--ui-font-size-sm, 13px);
}

.shell-approval-content {
  display: flex;
  flex-direction: column;
  gap: var(--ui-gap-xs, 4px);
}

.shell-command {
  padding: var(--ui-spacing-sm, 8px) var(--ui-spacing-base, 12px);
  background-color: var(--ui-color-background-primary, #1a1a1a);
  border-radius: var(--ui-radius-sm, 4px);
  border: 1px solid var(--ui-color-border-subtle, #333);
}

.shell-command code {
  font-family: var(--ui-font-family-mono, monospace);
  font-size: var(--ui-font-size-sm, 13px);
  color: var(--ui-color-primary, #3b82f6);
  word-break: break-all;
}

.shell-directory {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 4px);
  font-size: var(--ui-font-size-xs, 11px);
  color: var(--ui-color-text-secondary, #888);
}

.shell-approval-actions {
  display: flex;
  gap: var(--ui-gap-sm, 8px);
  margin-top: var(--ui-spacing-xs, 4px);
}

.shell-approval-actions button {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 4px);
  padding: var(--ui-spacing-xs, 6px) var(--ui-spacing-sm, 10px);
  border: none;
  border-radius: var(--ui-radius-sm, 4px);
  font-size: var(--ui-font-size-sm, 13px);
  font-weight: var(--ui-font-weight-medium, 500);
  cursor: pointer;
  transition: all var(--ui-transition-fast, 0.15s);
}

.shell-approval-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.approve-btn {
  background-color: var(--ui-color-success, #22c55e);
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--ui-color-success, #22c55e) 85%, black);
}

.always-approve-btn {
  background-color: var(--ui-color-primary, #3b82f6);
  color: white;
}

.always-approve-btn:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--ui-color-primary, #3b82f6) 85%, black);
}

.reject-btn {
  background-color: var(--ui-color-error, #ef4444);
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--ui-color-error, #ef4444) 85%, black);
}
</style>
