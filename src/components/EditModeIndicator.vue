<template>
  <div v-if="store.isEditing" class="edit-mode-indicator" aria-label="布局编辑工具栏">
    <span class="edit-title">编辑布局</span>
    <button @click="store.undo()" :disabled="!store.canUndo" title="撤销 Ctrl+Z">撤销</button>
    <button @click="store.redo()" :disabled="!store.canRedo" title="重做 Ctrl+Shift+Z">重做</button>
    <button @click="store.cancelEditing()" :disabled="store.isSaving || store.interactionActive" title="取消 Escape">取消</button>
    <button class="btn-done" @click="store.stopEditing()" :disabled="store.isSaving || store.interactionActive">{{ store.isSaving ? '保存中…' : '完成' }}</button>
    <p v-if="store.saveError || store.feedback" class="edit-status" role="status">{{ store.saveError || store.feedback }}</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useLayoutStore } from '@/stores/layout'
const store = useLayoutStore()
function shortcuts(event: KeyboardEvent) {
  if (!store.isEditing || event.defaultPrevented || store.isSaving || store.interactionActive) return
  const target = event.target as HTMLElement
  if (event.key === 'Escape') { event.preventDefault(); store.cancelEditing(); return }
  if (target.matches('input, textarea, select, [contenteditable="true"]')) return
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo(); else store.undo()
  } else if (event.key.toLowerCase() === 'y') { event.preventDefault(); store.redo() }
}
onMounted(() => window.addEventListener('keydown', shortcuts))
onBeforeUnmount(() => window.removeEventListener('keydown', shortcuts))
</script>
<style scoped>
.edit-mode-indicator { position: fixed; top: 16px; right: 20px; z-index: 70; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); box-shadow: 0 8px 32px rgba(15,23,42,.12); font-size: 13px; }
.edit-title { margin-right: 4px; font-weight: 600; }
button { border-radius: 7px; padding: 6px 10px; } button:hover:not(:disabled) { background: var(--row-hover); }
button.btn-done { background: var(--accent-color); color: white; }
.edit-status { position: absolute; top: calc(100% + 8px); right: 0; width: 100%; padding: 10px; border-radius: 10px; background: var(--bg-primary); color: #dc2626; border: 1px solid var(--border-color); }
@media (max-width: 600px) { .edit-mode-indicator { top: 12px; right: 12px; left: 12px; gap: 4px; justify-content: space-between; } button { padding: 6px 8px; } }
</style>
