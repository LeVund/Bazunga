<script setup lang="ts">
import type { GenerationMetrics } from "@core/types";

defineProps<{
  metrics: GenerationMetrics;
}>();

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function getFinishReasonLabel(reason: GenerationMetrics["finishReason"]): string {
  switch (reason) {
    case "stop":
      return "Terminé";
    case "length":
      return "Limite atteinte";
    case "cancelled":
      return "Annulé";
    case "error":
      return "Erreur";
    default:
      return reason;
  }
}

function getFinishReasonClass(reason: GenerationMetrics["finishReason"]): string {
  switch (reason) {
    case "stop":
      return "success";
    case "length":
      return "warning";
    case "cancelled":
      return "cancelled";
    case "error":
      return "error";
    default:
      return "";
  }
}
</script>

<template>
  <div class="metrics">
    <span class="metric" title="Vitesse de génération">
      {{ metrics.tokensPerSecond.toFixed(1) }} tok/s
    </span>
    <span class="metric" title="Tokens générés">
      {{ metrics.completionTokens }} tokens
    </span>
    <span class="metric" title="Durée totale">
      {{ formatDuration(metrics.durationMs) }}
    </span>
    <span
      class="metric finish-reason"
      :class="getFinishReasonClass(metrics.finishReason)"
      :title="'Raison: ' + metrics.finishReason"
    >
      {{ getFinishReasonLabel(metrics.finishReason) }}
    </span>
  </div>
</template>

<style scoped>
.metrics {
  display: flex;
  gap: var(--ui-gap-md, 12px);
  font-size: var(--ui-font-size-xs, 11px);
  color: var(--ui-color-text-tertiary, #666);
}

.metric {
  display: inline-flex;
  align-items: center;
}

.finish-reason {
  padding: 2px 6px;
  border-radius: var(--ui-radius-sm, 4px);
  font-weight: var(--ui-font-weight-medium, 500);
}

.finish-reason.success {
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.finish-reason.warning {
  background-color: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.finish-reason.cancelled {
  background-color: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.finish-reason.error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
