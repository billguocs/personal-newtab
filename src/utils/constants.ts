import type { SearchEngine, AIPlatform } from '@/types'

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd={query}',
    icon: '🔍'
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q={query}',
    icon: '🔍'
  },
  {
    id: 'bing',
    name: '必应',
    url: 'https://www.bing.com/search?q={query}',
    icon: '🔍'
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q={query}',
    icon: '🔍'
  }
]

export const AI_PLATFORMS: AIPlatform[] = [
  {
    id: 'qwen',
    name: '通义千问',
    url: 'https://tongyi.aliyun.com/qianwen/?chatId={query}',
    icon: '🤖'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app?q={query}',
    icon: '✨'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com/?q={query}',
    icon: '💬'
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new?q={query}',
    icon: '🧠'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn/?q={query}',
    icon: '🌙'
  }
]

export function buildSearchUrl(engineId: string, query: string): string {
  const engine = SEARCH_ENGINES.find(e => e.id === engineId) || SEARCH_ENGINES[0]
  return engine.url.replace('{query}', encodeURIComponent(query))
}

export function buildAIUrl(platformId: string, query: string): string {
  const platform = AI_PLATFORMS.find(p => p.id === platformId) || AI_PLATFORMS[0]
  return platform.url.replace('{query}', encodeURIComponent(query))
}