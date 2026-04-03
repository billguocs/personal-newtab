<template>
  <div v-if="layoutStore.isEditing" class="edit-mode-indicator">
    <div class="edit-hint">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 6.34L2.1 2.1m17.8 17.8l-4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24-4.24l-4.24 4.24M6.34 6.34l-4.24-4.24"/>
      </svg>
      <span>编辑模式</span>
    </div>
    <button class="btn-done" @click="exitEdit">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      完成
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()

function exitEdit() {
  layoutStore.stopEditing()
}
</script>

<style scoped>
.edit-mode-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.edit-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.edit-hint svg {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-done {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--accent-color, #3b82f6);
  color: white;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-done:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
