import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Settings, BingImage } from '@/types'
import { storage } from '@/utils/storage'
import { getWallpaper } from '@/api/bing'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    wallpaperType: 'bing',
    customWallpaper: null,
    searchEngine: 'baidu',
    language: 'zh_CN',
    showClock: true,
    showDate: true
  })

  const bingWallpaper = ref<BingImage | null>(null)
  const customWallpaperData = ref<string | null>(null)
  const isDark = ref(false)

  const currentWallpaper = computed(() => {
    if (settings.value.wallpaperType === 'custom' && customWallpaperData.value) {
      return customWallpaperData.value
    }
    return bingWallpaper.value?.url || ''
  })

  async function loadSettings() {
    const saved = await storage.getSettings()
    settings.value = { ...settings.value, ...saved }
    
    if (settings.value.wallpaperType === 'bing') {
      await loadBingWallpaper()
    }
    
    customWallpaperData.value = await storage.getWallpaper()
    checkDarkMode()
  }

  async function loadBingWallpaper() {
    bingWallpaper.value = await getWallpaper()
  }

  async function saveSettings() {
    await storage.setSettings(settings.value)
  }

  async function setWallpaperType(type: 'custom' | 'bing') {
    settings.value.wallpaperType = type
    await saveSettings()
    
    if (type === 'bing') {
      await loadBingWallpaper()
    }
  }

  async function setCustomWallpaper(dataUrl: string) {
    customWallpaperData.value = dataUrl
    await storage.setWallpaper(dataUrl)
    settings.value.wallpaperType = 'custom'
    await saveSettings()
  }

  function setSearchEngine(engine: string) {
    settings.value.searchEngine = engine
    saveSettings()
  }

  function setLanguage(lang: 'zh_CN' | 'en') {
    settings.value.language = lang
    saveSettings()
  }

  function checkDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    isDark.value = prefersDark.matches
    
    prefersDark.addEventListener('change', (e) => {
      isDark.value = e.matches
    })
  }

  function toggleClock(show: boolean) {
    settings.value.showClock = show
    saveSettings()
  }

  function toggleDate(show: boolean) {
    settings.value.showDate = show
    saveSettings()
  }

  return {
    settings,
    bingWallpaper,
    customWallpaperData,
    isDark,
    currentWallpaper,
    loadSettings,
    loadBingWallpaper,
    saveSettings,
    setWallpaperType,
    setCustomWallpaper,
    setSearchEngine,
    setLanguage,
    checkDarkMode,
    toggleClock,
    toggleDate
  }
})