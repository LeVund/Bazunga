<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

interface Props {
  initialValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [value: string];
  cancel: [];
}>();

const inputValue = ref(props.initialValue);
const inputRef = ref<HTMLInputElement | null>(null);

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
  const trimmed = inputValue.value.trim();
  if (trimmed && trimmed !== props.initialValue) {
    emit("save", trimmed);
  } else {
    emit("cancel");
  }
}

function handleBlur() {
  save();
}

onMounted(async () => {
  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select();
});
</script>

<template>
  <input
    ref="inputRef"
    v-model="inputValue"
    type="text"
    class="rename-input"
    @keydown="handleKeydown"
    @blur="handleBlur"
  />
</template>

<style scoped>
.rename-input {
  width: 100%;
  padding: 2px 6px;
  border: 1px solid var(--ui-color-primary);
  border-radius: var(--ui-radius-sm);
  background-color: var(--ui-color-background-primary);
  color: var(--ui-color-text-primary);
  font-size: var(--ui-font-size-sm);
  outline: none;
}

.rename-input:focus {
  box-shadow: 0 0 0 2px rgba(var(--ui-color-primary-rgb), 0.2);
}
</style>
