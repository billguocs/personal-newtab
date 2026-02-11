<template>
  <button class="lang-switcher" @click="toggleLang" title="切换语言">
    <span v-if="currentLang === 'zh_CN'">🇨🇳 中文</span>
    <span v-else>🇺🇸 English</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentLang = ref('zh_CN')

function toggleLang() {
  currentLang.value = currentLang.value === 'zh_CN' ? 'en' : 'zh_CN'
  // 暂时只切换显示，不实际切换语言（因为移除了 i18n）
  console.log('语言切换为:', currentLang.value)
}
</script>

<style scoped>
.lang-switcher {
  @apply fixed top-4 left-4 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 z-50;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.lang-switcher:hover {
  background: rgba(59, 130, 246, 1);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>