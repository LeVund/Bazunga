<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { Folder, MessageSquare } from "lucide-vue-next";

interface Props {
  type: "folder" | "chat";
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
});

const emit = defineEmits<{
  save: [value: string];
  cancel: [];
}>();

const inputValue = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const isSaving = ref(false);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    save();
  } else if (event.key === "Escape") {
    event.preventDefault();
    emit("cancel");
  }
}

function save() {
  if (isSaving.value) return;
  isSaving.value = true;

  const trimmed = inputValue.value.trim();
  if (trimmed) {
    emit("save", trimmed);
  } else {
    emit("cancel");
  }
}

function handleBlur() {
  // Delay slightly to allow other events to fire first
  setTimeout(() => {
    if (!isSaving.value) {
      save();
    }
  }, 100);
}

onMounted(async () => {
  await nextTick();
  inputRef.value?.focus();
});
</script>

<template>
  <div
    class="create-input-container"
    :style="{ paddingLeft: `${props.depth * 16 + 8}px` }"
  >
    <span class="icon">
      <Folder v-if="type === 'folder'" :size="16" class="folder-icon" />
      <MessageSquare v-else :size="16" class="chat-icon" />
    </span>
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="create-input"
      :placeholder="type === 'folder' ? 'Nom du dossier...' : 'Titre du chat...'"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />
  </div>
</template>

<style scoped>
.create-input-container {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs);
  padding: 6px 8px;
  padding-right: 4px;
  border-radius: var(--ui-radius-sm);
  background-color: var(--ui-color-background-tertiary);
}

.icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.folder-icon {
  color: var(--ui-color-text-secondary);
}

.chat-icon {
  color: var(--ui-color-text-tertiary);
  margin-left: 16px;
}

.create-input {
  flex: 1;
  min-width: 0;
  padding: 2px 6px;
  border: 1px solid var(--ui-color-primary);
  border-radius: var(--ui-radius-sm);
  background-color: var(--ui-color-background-primary);
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-sm);
  outline: none;
}

.create-input:focus {
  box-shadow: 0 0 0 2px rgba(var(--ui-color-primary-rgb, 59, 130, 246), 0.2);
}

.create-input::placeholder {
  color: var(--ui-color-text-tertiary);
}
</style>
