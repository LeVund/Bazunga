<script setup lang="ts">
import { computed } from "vue";
import { Terminal, Folder, Check, CheckCheck, X, Zap } from "lucide-vue-next";
import type { ResolvedShellCommand } from "@core/types";

const props = defineProps<{
  command: ResolvedShellCommand;
}>();

const statusConfig = computed(() => {
  switch (props.command.status) {
    case "approved":
      return {
        label: "Approuvé",
        icon: Check,
        colorClass: "status-approved",
      };
    case "always_approved":
      return {
        label: "Approuvé (ajouté à la whitelist)",
        icon: CheckCheck,
        colorClass: "status-always-approved",
      };
    case "auto_approved":
      return {
        label: "Auto-approuvé",
        icon: Zap,
        colorClass: "status-auto-approved",
      };
    case "rejected":
      return {
        label: "Refusé",
        icon: X,
        colorClass: "status-rejected",
      };
    default:
      return {
        label: "Inconnu",
        icon: Terminal,
        colorClass: "",
      };
  }
});

const wasExecuted = computed(() => {
  return props.command.status !== "rejected" && props.command.result;
});
</script>

<template>
  <div class="shell-command-display" :class="statusConfig.colorClass">
    <div class="shell-command-header">
      <div class="header-left">
        <Terminal :size="16" />
        <span>Commande shell</span>
      </div>
      <div class="status-badge" :class="statusConfig.colorClass">
        <component :is="statusConfig.icon" :size="14" />
        <span>{{ statusConfig.label }}</span>
      </div>
    </div>

    <div class="shell-command-content">
      <div class="shell-command-code">
        <code>{{ command.command }}</code>
      </div>

      <div class="shell-directory">
        <Folder :size="14" />
        <span>{{ command.directory }}</span>
      </div>
    </div>

    <!-- Résultat de l'exécution si disponible -->
    <div v-if="wasExecuted && command.result" class="shell-result">
      <div v-if="command.result.success" class="result-success">
        <pre v-if="command.result.stdout">{{ command.result.stdout }}</pre>
        <span v-else class="no-output">(aucune sortie)</span>
      </div>
      <div v-else class="result-error">
        <pre>{{ command.result.error || command.result.stderr }}</pre>
      </div>
    </div>

    <!-- Message de refus -->
    <div v-if="command.status === 'rejected'" class="shell-rejected-message">
      Commande refusée par l'utilisateur
    </div>
  </div>
</template>

<style scoped>
.shell-command-display {
  display: flex;
  flex-direction: column;
  gap: var(--ui-gap-sm, 8px);
  padding: var(--ui-spacing-base, 12px);
  border-radius: var(--ui-radius-md, 8px);
  background-color: var(--ui-color-background-elevated, #2a2a2a);
  border: 1px solid var(--ui-color-border-default, #444);
  margin: var(--ui-spacing-sm, 8px) 0;
}

.shell-command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-sm, 8px);
  font-size: var(--ui-font-size-sm, 13px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-sm, 8px);
  color: var(--ui-color-text-secondary, #888);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 4px);
  padding: 2px 8px;
  border-radius: var(--ui-radius-sm, 4px);
  font-size: var(--ui-font-size-xs, 11px);
  font-weight: var(--ui-font-weight-medium, 500);
}

.status-badge.status-approved {
  background-color: color-mix(in srgb, var(--ui-color-success, #22c55e) 20%, transparent);
  color: var(--ui-color-success, #22c55e);
}

.status-badge.status-always-approved {
  background-color: color-mix(in srgb, var(--ui-color-primary, #3b82f6) 20%, transparent);
  color: var(--ui-color-primary, #3b82f6);
}

.status-badge.status-auto-approved {
  background-color: color-mix(in srgb, var(--ui-color-warning, #f59e0b) 20%, transparent);
  color: var(--ui-color-warning, #f59e0b);
}

.status-badge.status-rejected {
  background-color: color-mix(in srgb, var(--ui-color-error, #ef4444) 20%, transparent);
  color: var(--ui-color-error, #ef4444);
}

.shell-command-content {
  display: flex;
  flex-direction: column;
  gap: var(--ui-gap-xs, 4px);
}

.shell-command-code {
  padding: var(--ui-spacing-sm, 8px) var(--ui-spacing-base, 12px);
  background-color: var(--ui-color-background-primary, #1a1a1a);
  border-radius: var(--ui-radius-sm, 4px);
  border: 1px solid var(--ui-color-border-subtle, #333);
}

.shell-command-code code {
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

.shell-result {
  margin-top: var(--ui-spacing-xs, 4px);
  padding: var(--ui-spacing-sm, 8px);
  border-radius: var(--ui-radius-sm, 4px);
  font-size: var(--ui-font-size-sm, 13px);
}

.shell-result pre {
  margin: 0;
  font-family: var(--ui-font-family-mono, monospace);
  white-space: pre-wrap;
  word-break: break-all;
}

.result-success {
  background-color: color-mix(in srgb, var(--ui-color-success, #22c55e) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ui-color-success, #22c55e) 30%, transparent);
  color: var(--ui-color-text-primary, #fff);
}

.result-success .no-output {
  color: var(--ui-color-text-tertiary, #666);
  font-style: italic;
}

.result-error {
  background-color: color-mix(in srgb, var(--ui-color-error, #ef4444) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ui-color-error, #ef4444) 30%, transparent);
  color: var(--ui-color-error, #ef4444);
}

.shell-rejected-message {
  font-size: var(--ui-font-size-sm, 13px);
  color: var(--ui-color-error, #ef4444);
  font-style: italic;
}
</style>
