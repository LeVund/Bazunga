<script setup lang="ts">
import { ref } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const isOpen = ref(false);

function togglePanel() {
 isOpen.value = !isOpen.value;
}
</script>

<template>
 <div :class="['side-panel', { open: isOpen }]">
  <button
   class="toggle-button"
   @click="togglePanel"
   :aria-label="isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'"
   :aria-expanded="isOpen"
  >
   <ChevronLeft v-if="isOpen" :size="20" />
   <ChevronRight v-else :size="20" />
  </button>

  <div class="panel-content">
   <div class="panel-header">
    <h2>Panneau latéral</h2>
   </div>
   <div class="panel-body">
    <p>Contenu du panneau</p>
    <p>Vous pouvez ajouter n'importe quel contenu ici.</p>
   </div>
  </div>
 </div>
</template>

<style scoped>
.side-panel {
 position: absolute;
 right: 0;
 top: 0;
 height: 100%;
 background-color: var(--ui-color-background-secondary);
 border-left: 1px solid var(--ui-color-border-default);
 display: flex;
 transition: transform var(--ui-transition-smooth);
 z-index: var(--ui-z-index-sidebar);
 width: var(--ui-width-sidebar-panel);
 transform: translateX(calc(100% - var(--ui-width-sidebar-toggle)));
}

.side-panel.open {
 transform: translateX(0);
}

.toggle-button {
 /*position: absolute;*/
 left: 0;
 top: 50%;
 /*transform: translateY(-50%) translateX(-100%);*/
 width: var(--ui-width-sidebar-toggle);
 height: 100%;
 background-color: var(--ui-color-background-secondary);
 border: 1px solid var(--ui-color-border-default);
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 color: var(--ui-color-text-secondary);
 transition: all var(--ui-transition-fast);
 padding: 0;
 z-index: var(--ui-z-index-base);
}

.toggle-button:hover {
 background-color: var(--ui-color-background-tertiary);
 color: var(--ui-color-primary);
 border-color: var(--ui-color-border-subtle);
}

.toggle-button:focus {
 outline: none;
 border-color: var(--ui-color-primary);
 color: var(--ui-color-primary);
}

.toggle-button:active {
 background-color: var(--ui-color-border-default);
 color: var(--ui-color-primary-active);
}

.panel-content {
 width: 100%;
 display: flex;
 flex-direction: column;
 overflow: hidden;
}

.panel-header {
 padding: var(--ui-spacing-lg) var(--ui-spacing-lg) var(--ui-spacing-base);
 border-bottom: 1px solid var(--ui-color-border-default);
}

.panel-header h2 {
 margin: 0;
 font-size: var(--ui-font-size-md);
 color: var(--ui-color-text-strong);
 font-weight: var(--ui-font-weight-semibold);
}

.panel-body {
 padding: var(--ui-spacing-lg);
 overflow-y: auto;
 flex: 1;
 color: var(--ui-color-text-primary);
}

.panel-body p {
 margin: 0 0 var(--ui-margin-base) 0;
 line-height: var(--ui-line-height-base);
}

.panel-body p:last-child {
 margin-bottom: 0;
}

/* Scrollbar styling */
.panel-body::-webkit-scrollbar {
 width: var(--ui-width-scrollbar);
}

.panel-body::-webkit-scrollbar-track {
 background: var(--ui-color-scrollbar-track);
 border-radius: var(--ui-radius-sm);
}

.panel-body::-webkit-scrollbar-thumb {
 background: var(--ui-color-scrollbar-thumb);
 border-radius: var(--ui-radius-sm);
}

.panel-body::-webkit-scrollbar-thumb:hover {
 background: var(--ui-color-scrollbar-thumb-hover);
}
</style>
