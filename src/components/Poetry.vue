<template>
  <div ref="widgetRef" class="poetry-widget">
    <div v-if="poetryStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="poetryStore.error" class="error">
      <p>{{ poetryStore.error }}</p>
    </div>

    <div v-else-if="poetryStore.currentPoetry" class="poetry-content">
      <!-- 标题和作者 -->
      <div class="poetry-meta">
        <span class="poetry-title">{{ poetryStore.currentPoetry.title }}</span>
        <span class="poetry-author">{{ poetryStore.currentPoetry.author }}</span>
      </div>
      <!-- 诗词内容 - 自动换列 -->
      <div class="poetry-text">{{ poetryStore.currentPoetry.content }}</div>
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
  @apply h-full flex items-center justify-center;
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
  display: flex;
  flex-direction: row-reverse;
  color: white;
  height: 100%;
  padding: 12px;
  gap: 8px;
}

.poetry-meta {
  writing-mode: vertical-rl;
  font-size: 12px;
  opacity: 0.85;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.poetry-title {
  font-weight: 600;
}

.poetry-author {
  opacity: 0.9;
}

.poetry-text {
  writing-mode: vertical-rl;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.8;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.4);
  font-family: 'ZCOOL XiaoWei', 'Ma Shan Zheng', 'ZCOOL QingKe HuangYou', 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif;
  height: 100%;
  overflow: hidden;
}

/* 响应式字体大小 */
@media (min-width: 768px) {
  .poetry-text {
    font-size: 16px;
  }
}

@media (min-width: 1024px) {
  .poetry-text {
    font-size: 18px;
  }
}
</style>
