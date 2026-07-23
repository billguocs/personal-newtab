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
    { id: 'poetry', type: 'poetry', title: '每日诗词', x: 0, y: 0, w: 3, h: 4, visible: true },
    { id: 'clockWeather', type: 'clockWeather', title: '时钟天气', x: 3, y: 0, w: 6, h: 4, visible: true },
    { id: 'search', type: 'search', title: '搜索', x: 2, y: 4, w: 8, h: 5, visible: true },
    { id: 'navigation', type: 'navigation', title: '快速导航', x: 2, y: 9, w: 8, h: 3, visible: true },
    { id: 'github', type: 'github', title: 'GitHub趋势', x: 0, y: 12, w: 4, h: 8, visible: true },
    { id: 'zhihu', type: 'zhihu', title: '知乎热榜', x: 4, y: 12, w: 4, h: 8, visible: true },
    { id: 'v2ex', type: 'v2ex', title: 'V2EX热议', x: 8, y: 12, w: 4, h: 8, visible: true },
    { id: 'xueqiu', type: 'xueqiu', title: '雪球热榜', x: 0, y: 20, w: 6, h: 10, visible: true }
  ],
  gridCols: 12,
  gridRowHeight: 45,
  gap: 16,
  widgetOpacity: 0.85
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

      console.log('[Storage] 读取到的原始布局数据:', saved)

      if (!saved) {
        console.log('[Storage] 无保存数据，返回默认布局')
        return JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
      }

      // 确保 widgets 是数组
      // Chrome Storage Sync 可能将数组存储为类数组对象（如 {"0": {...}, "1": {...}}）
      let widgets = saved.widgets
      if (!Array.isArray(widgets)) {
        // 如果是类数组对象，转换为真正的数组
        if (widgets && typeof widgets === 'object') {
          const keys = Object.keys(widgets).filter(k => /^\d+$/.test(k)).sort((a, b) => parseInt(a) - parseInt(b))
          widgets = keys.map(k => widgets[k])
          console.log('[Storage] 将类数组对象转换为数组')
        } else {
          widgets = DEFAULT_LAYOUT.widgets
        }
      }

      // 深度合并：保留默认值作为后备，使用保存的值覆盖
      const merged = {
        ...DEFAULT_LAYOUT,
        ...saved,
        widgets: JSON.parse(JSON.stringify(widgets))
      }

      console.log('[Storage] 合并后的 widgets:', JSON.stringify(merged.widgets.map((w: {id: string, x: number, y: number, w: number, h: number}) => ({id: w.id, x: w.x, y: w.y, w: w.w, h: w.h}))))
      return merged
    } catch (error) {
      console.error('[Storage] 读取布局失败:', error)
      return JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
    }
  },

  async setLayout(layout: LayoutConfig): Promise<void> {
    console.log('[Storage] 保存布局 widgets:', JSON.stringify(layout.widgets.map(w => ({id: w.id, x: w.x, y: w.y, w: w.w, h: w.h}))))
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
  },

  // 导航链接专用持久化存储（无过期时间）
  async getNavigationLinks<T>(): Promise<T | null | undefined> {
    try {
      const result = await chrome.storage.sync.get('navigationLinks')
      console.log('Storage: 读取 navigationLinks 结果:', result)
      // 检查是否存在该键，而不是检查值是否为 truthy（空数组会被误判）
      if ('navigationLinks' in result) {
        const value = result.navigationLinks
        console.log('Storage: 找到 navigationLinks，值为:', value, '类型:', typeof value)
        
        // 处理可能的历史数据格式（如果之前用 setCachedData 保存的，会有 data 和 timestamp 字段）
        if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
          console.log('Storage: 检测到旧格式数据，提取数组:', value.data)
          return value.data
        }
        
        return value
      }
      console.log('Storage: 未找到 navigationLinks 键')
      return null
    } catch (error) {
      console.error('Storage: 读取导航链接失败', error)
      return null
    }
  },

  async setNavigationLinks<T>(data: T): Promise<void> {
    try {
      await chrome.storage.sync.set({ navigationLinks: data })
      console.log('Storage: 导航链接已保存', data)
    } catch (error) {
      console.error('Storage: 保存导航链接失败', error)
      throw error
    }
  },

  async getFavicon(url: string): Promise<string | null> {
    try {
      const result = await chrome.storage.local.get('faviconCache')
      const cache = result.faviconCache || {}
      if (cache[url]) {
        return cache[url]
      }
      return null
    } catch {
      return null
    }
  },

  async setFavicon(url: string, faviconUrl: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get('faviconCache')
      const cache = result.faviconCache || {}
      cache[url] = faviconUrl
      await chrome.storage.local.set({ faviconCache: cache })
    } catch (error) {
      console.error('Storage: 保存 favicon 失败', error)
    }
  }
}