<template>
  <Teleport to="body">
    <dialog ref="dialog" class="app-dialog" :aria-label="title" @cancel.prevent.stop="emit('close')" @keydown.esc.prevent.stop @keyup.esc.prevent.stop="emit('close')" @click="onBackdrop">
      <slot />
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
function onBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) emit('close')
}
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<style>
.app-dialog {
  width: min(680px, calc(100% - 32px));
  max-height: calc(100vh - 48px);
  margin: auto;
  padding: 0;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 22px;
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
}
.app-dialog::backdrop { background: rgba(15, 23, 42, 0.48); backdrop-filter: blur(8px); }
</style>
