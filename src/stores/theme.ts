import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { extractThemes, applyThemeToCSS } from '@/utils/themeExtractor'
import type { Theme } from '@/utils/themeExtractor'

import { LIGHT_THEME, DARK_THEME, BUILTIN_THEMES } from '@/utils/themePresets'

const DEFAULT_THEME = LIGHT_THEME

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>(DEFAULT_THEME)
  const extractedThemes = ref<Theme[]>([...BUILTIN_THEMES])
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
      extractedThemes.value = [...BUILTIN_THEMES, ...themes]
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
        appearanceVersion: 2,
        currentTheme: JSON.parse(JSON.stringify(currentTheme.value)),
        extractedThemes: JSON.parse(JSON.stringify(extractedThemes.value))
      })
      console.log('主题已保存到 storage:', currentTheme.value.id)
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  // 加载保存的主题
  async function loadTheme() {
    try {
      const result = await chrome.storage.sync.get(['currentTheme', 'extractedThemes', 'appearanceVersion'])
      console.log('从 storage 加载主题:', result)

      const savedThemes: Theme[] = Array.isArray(result.extractedThemes) ? result.extractedThemes : []
      const legacyTheme: Theme | undefined = result.appearanceVersion !== 2 ? result.currentTheme : undefined
      // 首次升级采用清透主题，旧配色保留在主题列表，可随时切回。
      currentTheme.value = result.appearanceVersion === 2 && result.currentTheme
        ? result.currentTheme
        : (result.currentTheme?.isDark ?? window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? DARK_THEME : LIGHT_THEME
      const candidates = [...BUILTIN_THEMES, ...(legacyTheme ? [legacyTheme] : []), ...savedThemes]
      extractedThemes.value = candidates.filter((theme, index) =>
        theme && candidates.findIndex(item => item?.id === theme.id) === index)
      applyThemeToCSS(currentTheme.value)
      if (result.appearanceVersion !== 2) await saveTheme()
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
