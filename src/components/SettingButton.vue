<template>
  <button class="setting-btn" :title="text">
    <span class="icon">
      <slot name="icon"></slot>
    </span>
    <span class="text">{{ text }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<style scoped>
.setting-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.setting-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  width: auto;
  padding-right: 14px;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.text {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.25s ease;
}

.setting-btn:hover .text {
  opacity: 1;
  transform: translateX(0);
}
</style>
