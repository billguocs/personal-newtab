<template>
  <div class="hot-list-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <span class="icon">💡</span>
        {{ "知乎热榜" }}
      </h3>
      <button 
        class="refresh-btn"
        @click="refresh"
        :disabled="hotlistStore.loading.zhihu"
      >
        <svg 
          :class="{ spinning: hotlistStore.loading.zhihu }"
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 16h5v5"/>
        </svg>
      </button>
    </div>

    <div class="widget-content">
      <div v-if="hotlistStore.loading.zhihu" class="loading">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="hotlistStore.error.zhihu" class="error">
        <p>{{ hotlistStore.error.zhihu }}</p>
        <button @click="refresh" class="retry-btn">{{ "刷新" }}</button>
      </div>
      
      <div v-else class="hot-list">
        <a
          v-for="(item, index) in hotlistStore.zhihuItems"
          :key="index"
          :href="item.url"
          target="_blank"
          class="hot-item"
        >
          <span :class="['rank', { top: index < 3 }]">{{ index + 1 }}</span>
          <span class="title">{{ item.title }}</span>
          <span class="heat">{{ item.hot }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHotListStore } from '@/stores/hotlist'

const hotlistStore = useHotListStore()

onMounted(() => {
  hotlistStore.loadZhihuHot()
})

function refresh() {
  hotlistStore.loadZhihuHot(true)
}
</script>

<style scoped>
.hot-list-widget {
  @apply h-full flex flex-col;
}

.widget-header {
  @apply flex items-center justify-between p-4 border-b;
  border-color: var(--border-color);
}

.widget-title {
  @apply flex items-center gap-2 text-lg font-semibold;
  color: var(--text-primary);
}

.icon {
  @apply text-xl;
}

.refresh-btn {
  @apply p-2 rounded-lg transition-all duration-200;
  color: var(--text-secondary);
}

.refresh-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.refresh-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.widget-content {
  @apply flex-1 overflow-y-auto p-4;
}

.loading {
  @apply flex items-center justify-center h-full;
}

.spinner {
  @apply w-8 h-8 border-2 border-t-transparent rounded-full animate-spin;
  border-color: var(--accent-color);
  border-top-color: transparent;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error {
  @apply flex flex-col items-center justify-center h-full text-center;
  color: var(--text-secondary);
}

.retry-btn {
  @apply mt-4 px-4 py-2 rounded-lg font-medium;
  background: var(--accent-color);
  color: white;
}

.hot-list {
  @apply space-y-2;
}

.hot-item {
  @apply flex items-center gap-3 p-3 rounded-lg transition-all duration-200;
  color: var(--text-primary);
}

.hot-item:hover {
  background: var(--bg-secondary);
}

.rank {
  @apply w-7 h-7 flex items-center justify-center rounded text-base font-bold flex-shrink-0;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.rank.top {
  background: var(--accent-color);
  color: white;
}

.title {
  @apply flex-1 min-w-0 truncate text-base;
}

.heat {
  @apply text-sm flex-shrink-0;
  color: var(--text-secondary);
}
</style>