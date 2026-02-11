<template>
  <div class="search-widget">
    <div class="search-mode-toggle">
      <button 
        :class="['mode-btn', { active: !isAIMode }]"
        @click="isAIMode = false"
      >
        {{ "搜索模式" }}
      </button>
      <button 
        :class="['mode-btn', { active: isAIMode }]"
        @click="isAIMode = true"
      >
        {{ "AI模式" }}
      </button>
    </div>

    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="'输入搜索内容或AI问题...'"
          @keydown.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="!isAIMode" class="engine-selector">
      <button
        v-for="engine in engines"
        :key="engine.id"
        :class="['engine-btn', { active: currentEngine === engine.id }]"
        @click="currentEngine = engine.id"
      >
        {{ engine.name }}
      </button>
    </div>

    <div v-else class="ai-selector">
      <button
        v-for="platform in aiPlatforms"
        :key="platform.id"
        :class="['ai-btn', { active: currentAI === platform.id }]"
        @click="currentAI = platform.id"
      >
        <span class="ai-icon">{{ platform.icon }}</span>
        {{ platform.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SEARCH_ENGINES, AI_PLATFORMS, buildSearchUrl, buildAIUrl } from '@/utils/constants'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const query = ref('')
const isAIMode = ref(false)
const currentEngine = ref(settingsStore.settings.searchEngine)
const currentAI = ref('qwen')
const inputRef = ref<HTMLInputElement>()

const engines = SEARCH_ENGINES
const aiPlatforms = AI_PLATFORMS

watch(() => settingsStore.settings.searchEngine, (newVal) => {
  currentEngine.value = newVal
})

function handleSearch() {
  if (!query.value.trim()) {
    inputRef.value?.focus()
    return
  }

  let url: string
  
  if (isAIMode.value) {
    url = buildAIUrl(currentAI.value, query.value)
  } else {
    url = buildSearchUrl(currentEngine.value, query.value)
    settingsStore.setSearchEngine(currentEngine.value)
  }

  window.open(url, '_blank')
  query.value = ''
}
</script>

<style scoped>
.search-widget {
  @apply w-full p-6 rounded-2xl;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: none;
  transition: all 0.3s ease;
}

.search-widget:hover {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.search-mode-toggle {
  @apply flex gap-2 mb-4 justify-center;
}

.mode-btn {
  @apply px-4 py-2 rounded-full text-sm font-medium transition-all duration-200;
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mode-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.search-container {
  @apply relative;
}

.search-input-wrapper {
  @apply relative flex items-center;
}

.search-input {
  @apply w-full px-5 py-3 pr-12 rounded-xl text-base outline-none transition-all duration-200;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.search-btn {
  @apply absolute right-3 p-2 rounded-full transition-all duration-200;
  color: var(--text-secondary);
}

.search-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.engine-selector,
.ai-selector {
  @apply flex flex-wrap gap-2 mt-4 justify-center;
}

.engine-btn,
.ai-btn {
  @apply px-3 py-1.5 rounded-lg text-sm transition-all duration-200;
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.engine-btn:hover,
.ai-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.engine-btn.active,
.ai-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.ai-icon {
  @apply mr-1;
}
</style>