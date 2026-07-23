export interface Widget {
  id: string
  type: 'search' | 'github' | 'zhihu' | 'v2ex' | 'navigation' | 'poetry' | 'clockWeather' | 'xueqiu'
  title: string
  x: number
  y: number
  w: number
  h: number
  visible: boolean
}

export interface NavigationLink {
  id: string
  name: string
  url: string
  icon?: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  weatherCode: number
  windSpeed: number
  location: string
  forecast: {
    date: string
    maxTemp: number
    minTemp: number
    weatherCode: number
  }[]
}

export interface LocationData {
  name: string
  region: string
  country: string
  latitude: number
  longitude: number
}

export interface LayoutConfig {
  widgets: Widget[]
  gridCols: number
  gridRowHeight: number
  gap: number
  widgetOpacity?: number
  widgetOpacities?: Record<string, number>
}

export interface SearchEngine {
  id: string
  name: string
  url: string
  icon: string
}

export interface AIPlatform {
  id: string
  name: string
  url: string
  icon: string
}

export interface BingImage {
  url: string
  title: string
  copyright: string
}

export interface GitHubRepo {
  name: string
  fullName: string
  description: string
  stars: number
  url: string
  language: string
}

export interface GitHubQueryOptions {
  period: 'day' | 'week' | 'month'
  language: string
}

export interface PoetryItem {
  content: string
  author: string
  title: string
  category: string
}

export interface ZhihuItem {
  title: string
  url: string
  hot: number
}

export interface V2exTopic {
  title: string
  url: string
  replies: number
  node: string
}

export type XueqiuMarket = 'hs' | 'hk' | 'us'

export interface XueqiuHotStock {
  symbol: string
  name: string
  current: number
  percent: number
  chg: number
  high: number
  low: number
  volume: number
  amount: number
  market_capital: number
  turnover_rate: number
  pe_ttm: number
  follow: number
  value: number
  rank_change: number
}

export interface XueqiuStockRealtime {
  symbol: string
  name: string
  current: number
  percent: number
  chg: number
  lastUpdate: number
}

export interface Settings {
  wallpaperType: 'custom' | 'bing'
  customWallpaper: string | null
  searchEngine: string
  language: 'zh_CN' | 'en'
  showClock: boolean
  showDate: boolean
}

export type Theme = 'light' | 'dark' | 'auto'