import type { LayoutConfig } from '@/types'

export const DEFAULT_LAYOUT: LayoutConfig = {
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
  backgroundBlur: 24,
  widgetOpacity: 0.85
}

