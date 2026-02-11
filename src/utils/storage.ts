import type { Settings, LayoutConfig } from '@/types'

const DEFAULT_SETTINGS: Settings = {
  wallpaperType: 'bing',
  customWallpaper: null,
  searchEngine: 'baidu',
  language: 'zh_CN',
  showClock: true,
  showDate: true
}

const DEFAULT_LAYOUT: LayoutConfig = {
  widgets: [
    { id: 'search', type: 'search', title: '搜索', x: 2, y: 2, w: 8, h: 2, visible: true },
    { id: 'github', type: 'github', title: 'GitHub趋势', x: 0, y: 5, w: 4, h: 6, visible: true },
    { id: 'zhihu', type: 'zhihu', title: '知乎热榜', x: 4, y: 5, w: 4, h: 6, visible: true },
    { id: 'v2ex', type: 'v2ex', title: 'V2EX热议', x: 8, y: 5, w: 4, h: 6, visible: true }
  ],
  gridCols: 12,
  gridRowHeight: 50,
  gap: 16
}

export const storage = {
  async getSettings(): Promise<Settings> {
    try {
      const result = await chrome.storage.sync.get('settings')
      return { ...DEFAULT_SETTINGS, ...result.settings }
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  async setSettings(settings: Settings): Promise<void> {
    await chrome.storage.sync.set({ settings })
  },

  async getLayout(): Promise<LayoutConfig> {
    try {
      const result = await chrome.storage.sync.get('layout')
      const saved = result.layout
      
      if (!saved) {
        return DEFAULT_LAYOUT
      }
      
      // 确保 widgets 是数组
      const widgets = Array.isArray(saved.widgets) ? saved.widgets : DEFAULT_LAYOUT.widgets
      
      // 深度合并：保留默认 widgets，同时应用保存的配置
      return {
        ...DEFAULT_LAYOUT,
        ...saved,
        widgets: widgets
      }
    } catch {
      return DEFAULT_LAYOUT
    }
  },

  async setLayout(layout: LayoutConfig): Promise<void> {
    await chrome.storage.sync.set({ layout })
  },

  async getWallpaper(): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get('customWallpaper')
      return result.customWallpaper || null
    } catch {
      return null
    }
  },

  async setWallpaper(dataUrl: string): Promise<void> {
    await chrome.storage.local.set({ customWallpaper: dataUrl })
  },

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key)
      const cached = result[key]
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        return cached.data
      }
      return null
    } catch {
      return null
    }
  },

  async setCachedData<T>(key: string, data: T): Promise<void> {
    await chrome.storage.local.set({
      [key]: { data, timestamp: Date.now() }
    })
  }
}