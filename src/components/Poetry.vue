<template>
  <div ref="widgetRef" class="poetry-widget">
    <div v-if="poetryStore.loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="poetryStore.error" class="error">
      <p>{{ poetryStore.error }}</p>
    </div>
    
    <div v-else-if="poetryStore.currentPoetry" class="poetry-content">
      <div class="poetry-text">{{ poetryStore.currentPoetry.content }}</div>
      <div class="poetry-meta">
        {{ poetryStore.currentPoetry.author }} · {{ poetryStore.currentPoetry.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePoetryStore } from '@/stores/poetry'

const poetryStore = usePoetryStore()

onMounted(() => {
  poetryStore.loadPoetry()
})
</script>

<style scoped>
.poetry-widget {
  @apply h-full flex items-center justify-center p-6;
  background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.loading {
  @apply flex items-center justify-center;
}

.spinner {
  @apply w-8 h-8 border-2 border-t-transparent rounded-full animate-spin;
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: transparent;
}

.error {
  @apply text-center;
  color: rgba(255, 255, 255, 0.7);
}

.poetry-content {
  @apply text-center;
  color: white;
}

.poetry-text {
  @apply text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed mb-4;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.4);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif;
}

.poetry-meta {
  @apply text-sm md:text-base opacity-80;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
</style>
