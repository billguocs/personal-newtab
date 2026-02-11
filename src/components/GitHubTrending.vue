<template>
  <div class="hot-list-widget">
    <div class="widget-header">
      <h3 class="widget-title">
        <span class="icon">🐙</span>
        {{ "GitHub趋势" }}
      </h3>
      <div class="widget-actions">
        <select v-model="period" @change="onPeriodChange" class="period-select">
          <option value="day">{{ "今日" }}</option>
          <option value="week">{{ "本周" }}</option>
          <option value="month">{{ "本月" }}</option>
        </select>
        <button 
          class="refresh-btn"
          @click="refresh"
          :disabled="hotlistStore.loading.github"
        >
          <svg 
            :class="{ spinning: hotlistStore.loading.github }"
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
    </div>

    <div class="widget-content">
      <div v-if="hotlistStore.loading.github" class="loading">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="hotlistStore.error.github" class="error">
        <p>{{ hotlistStore.error.github }}</p>
        <button @click="refresh" class="retry-btn">{{ "刷新" }}</button>
      </div>
      
      <div v-else class="repo-list">
        <a
          v-for="(repo, index) in hotlistStore.githubRepos"
          :key="repo.fullName"
          :href="repo.url"
          target="_blank"
          class="repo-item"
        >
          <span class="rank">{{ index + 1 }}</span>
          <div class="repo-info">
            <div class="repo-name">{{ repo.name }}</div>
            <div class="repo-desc">{{ repo.description }}</div>
            <div class="repo-meta">
              <span class="language" v-if="repo.language">{{ repo.language }}</span>
              <span class="stars">⭐ {{ formatNumber(repo.stars) }}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHotListStore } from '@/stores/hotlist'
import { formatNumber } from '@/utils/helpers'

const hotlistStore = useHotListStore()

const period = ref<'day' | 'week' | 'month'>('day')

onMounted(() => {
  hotlistStore.loadGitHubTrending(period.value)
})

function onPeriodChange() {
  hotlistStore.loadGitHubTrending(period.value, true)
}

function refresh() {
  hotlistStore.loadGitHubTrending(period.value, true)
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

.widget-actions {
  @apply flex items-center gap-2;
}

.period-select {
  @apply px-2 py-1 rounded-lg text-sm outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
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

.repo-list {
  @apply space-y-2;
}

.repo-item {
  @apply flex gap-3 p-3 rounded-lg transition-all duration-200;
  color: var(--text-primary);
}

.repo-item:hover {
  background: var(--bg-secondary);
}

.rank {
  @apply w-7 h-7 flex items-center justify-center rounded text-base font-bold flex-shrink-0;
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.repo-info {
  @apply flex-1 min-w-0;
}

.repo-name {
  @apply font-medium truncate text-base;
}

.repo-desc {
  @apply text-base mt-1 line-clamp-2;
  color: var(--text-secondary);
}

.repo-meta {
  @apply flex items-center gap-3 mt-2 text-sm;
  color: var(--text-secondary);
}

.language {
  @apply px-2 py-0.5 rounded-full;
  background: var(--bg-secondary);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>