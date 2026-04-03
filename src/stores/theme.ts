import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { extractThemes, applyThemeToCSS } from '@/utils/themeExtractor'
import type { Theme } from '@/utils/themeExtractor'

const DEFAULT_THEME: Theme = {
  id: 'default',
  name: '默认主题',
  colors: {
    primary: '#3b82f6',
    background: 'rgba(255, 255, 255, 0.85)',
    surface: 'rgba(255, 255, 255, 0.9)',
    text: '#1a1a1a',
    textSecondary: 'rgba(26, 26, 26, 0.7)',
    border: 'rgba(26, 26, 26, 0.15)',
    accent: '#2563eb'
  },
  isDark: false
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>(DEFAULT_THEME)
  const extractedThemes = ref<Theme[]>([])
  const isLoading = ref(false)

  // 预览状态
  const previewTheme = ref<Theme | null>(null)
  const pendingTheme = ref<Theme | null>(null)

  const hasThemes = computed(() => extractedThemes.value.length > 0)
  const activeTheme = computed(() => previewTheme.value || currentTheme.value)

  // 从壁纸提取主题
  async function extractFromWallpaper(imageUrl: string) {
    isLoading.value = true
    try {
      const themes = await extractThemes(imageUrl)
      extractedThemes.value = themes
      // 不再自动应用，只提取
      return themes
    } catch (error) {
      console.error('提取主题失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 预览主题（临时应用，不保存）
  function preview(theme: Theme) {
    previewTheme.value = theme
    applyThemeToCSS(theme)
  }

  // 应用主题（保存）
  function applyTheme(theme: Theme) {
    currentTheme.value = theme
    previewTheme.value = null
    pendingTheme.value = null
    applyThemeToCSS(theme)
    // 保存到本地存储
    saveTheme()
  }

  // 取消预览，恢复原主题
  function cancelPreview() {
    if (previewTheme.value) {
      previewTheme.value = null
      applyThemeToCSS(currentTheme.value)
    }
    pendingTheme.value = null
  }

  // 更新主题颜色（用户微调）
  function updateThemeColor(key: keyof Theme['colors'], value: string) {
    if (!activeTheme.value) return

    const themeToUpdate = previewTheme.value || { ...currentTheme.value }
    themeToUpdate.colors = { ...themeToUpdate.colors, [key]: value }

    if (previewTheme.value) {
      previewTheme.value = themeToUpdate
    } else {
      previewTheme.value = themeToUpdate
    }
    applyThemeToCSS(themeToUpdate)
  }

  // 保存主题到 storage
  async function saveTheme() {
    try {
      await chrome.storage.sync.set({
        currentTheme: currentTheme.value,
        extractedThemes: extractedThemes.value
      })
      console.log('主题已保存到 storage:', currentTheme.value.id)
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  // 加载保存的主题
  async function loadTheme() {
    try {
      const result = await chrome.storage.sync.get(['currentTheme', 'extractedThemes'])
      console.log('从 storage 加载主题:', result)

      if (result.currentTheme) {
        currentTheme.value = result.currentTheme
        applyThemeToCSS(currentTheme.value)
        console.log('已应用保存的主题:', currentTheme.value.name)
      } else {
        // 没有保存的主题，应用默认主题
        applyThemeToCSS(DEFAULT_THEME)
        console.log('没有保存的主题，使用默认主题')
      }

      if (result.extractedThemes && result.extractedThemes.length > 0) {
        extractedThemes.value = result.extractedThemes
        console.log('已加载提取的主题列表:', extractedThemes.value.length)
      }
    } catch (error) {
      console.error('加载主题失败:', error)
      // 出错时使用默认主题
      applyThemeToCSS(DEFAULT_THEME)
    }
  }

  // 重置为默认主题
  function resetTheme() {
    applyTheme(DEFAULT_THEME)
  }

  return {
    currentTheme,
    extractedThemes,
    isLoading,
    hasThemes,
    previewTheme,
    pendingTheme,
    activeTheme,
    extractFromWallpaper,
    preview,
    applyTheme,
    cancelPreview,
    updateThemeColor,
    loadTheme,
    saveTheme,
    resetTheme
  }
})
