<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Edit3, Copy, Trash2 } from "lucide-vue-next";

interface Props {
  anchorRect: DOMRect;
  showDuplicate?: boolean;
  align?: "left" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  showDuplicate: true,
  align: "right",
});

const emit = defineEmits<{
  rename: [];
  duplicate: [];
  delete: [];
  close: [];
}>();

const menuRef = ref<HTMLDivElement | null>(null);

const menuStyle = computed(() => {
  const rect = props.anchorRect;

  if (props.align === "right") {
    // Align right edge of menu with right edge of anchor
    return {
      top: `${rect.bottom}px`,
      right: `0px`,
    };
  } else {
    // Align left edge of menu with left edge of anchor
    return {
      top: `${rect.bottom}px`,
      left: `0px`,
    };
  }
});

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit("close");
  }
}

function handleAction(action: "rename" | "duplicate" | "delete") {
  if (action === "rename") {
    emit("rename");
  } else if (action === "duplicate") {
    emit("duplicate");
  } else if (action === "delete") {
    emit("delete");
  }
  emit("close");
}

onMounted(() => {
  // Delay adding event listeners to avoid immediate trigger
  setTimeout(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("contextmenu", handleClickOutside);
  }, 0);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  document.removeEventListener("contextmenu", handleClickOutside);
});
</script>

<template>
  <div
    ref="menuRef"
    class="context-menu"
    :style="menuStyle"
  >
    <button class="menu-item" @click="handleAction('rename')">
      <Edit3 :size="14" />
      <span>Renommer</span>
    </button>
    <button
      v-if="props.showDuplicate"
      class="menu-item"
      @click="handleAction('duplicate')"
    >
      <Copy :size="14" />
      <span>Dupliquer</span>
    </button>
    <div class="divider"></div>
    <button class="menu-item danger" @click="handleAction('delete')">
      <Trash2 :size="14" />
      <span>Supprimer</span>
    </button>
  </div>
</template>

<style scoped>
.context-menu {
  position: absolute;
  z-index: 1000;
  min-width: 160px;
  background-color: var(--ui-color-background-elevated);
  border: 1px solid var(--ui-color-border-default);
  border-radius: var(--ui-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: var(--ui-spacing-xs);
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-sm);
  width: 100%;
  padding: var(--ui-spacing-sm) var(--ui-spacing-base);
  border: none;
  border-radius: var(--ui-radius-sm);
  background: transparent;
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ui-transition-fast);
}

.menu-item:hover {
  background-color: var(--ui-color-background-tertiary);
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.divider {
  height: 1px;
  background-color: var(--ui-color-border-subtle);
  margin: var(--ui-spacing-xs) 0;
}
</style>
