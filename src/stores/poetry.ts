import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PoetryItem } from '@/types'
import { fetchPoetry, getCachedPoetry, cachePoetry } from '@/api/poetry'

export const usePoetryStore = defineStore('poetry', () => {
  const currentPoetry = ref<PoetryItem | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function loadPoetry() {
    // 检查今日缓存
    const cached = getCachedPoetry()
    if (cached) {
      currentPoetry.value = cached
      console.log('[Poetry] 使用今日缓存')
      return
    }

    // 无缓存，从网络获取
    loading.value = true
    error.value = ''

    try {
      const poetry = await fetchPoetry()
      if (poetry) {
        currentPoetry.value = poetry
        cachePoetry(poetry)
        console.log('[Poetry] 获取新诗并缓存')
      } else {
        error.value = '获取诗词失败'
      }
    } catch (e) {
      error.value = '获取诗词失败'
      console.error('[Poetry] 加载失败:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    currentPoetry,
    loading,
    error,
    loadPoetry
  }
})
