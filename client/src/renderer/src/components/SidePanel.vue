<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const isOpen = ref(false)

function togglePanel() {
  isOpen.value = !isOpen.value
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
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  background-color: #242424;
  border-left: 1px solid #333;
  display: flex;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  width: 320px;
  transform: translateX(calc(100% - 24px));
}

.side-panel.open {
  transform: translateX(0);
}

.toggle-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) translateX(-100%);
  width: 24px;
  height: 80px;
  background-color: #242424;
  border: 1px solid #333;
  border-right: none;
  border-radius: 8px 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  transition: all 0.2s ease;
  padding: 0;
  z-index: 1;
}

.toggle-button:hover {
  background-color: #2a2a2a;
  color: #646cff;
  border-color: #444;
}

.toggle-button:focus {
  outline: none;
  border-color: #646cff;
  color: #646cff;
}

.toggle-button:active {
  background-color: #333;
  color: #7580ff;
}

.panel-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #333;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
  font-weight: 600;
}

.panel-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  color: #e0e0e0;
}

.panel-body p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.panel-body p:last-child {
  margin-bottom: 0;
}

/* Scrollbar styling */
.panel-body::-webkit-scrollbar {
  width: 8px;
}

.panel-body::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
