import type { ZhihuItem } from '@/types'
import { storage } from '@/utils/storage'

const CACHE_KEY = 'zhihuHot'
const API_URL = 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total'

export async function fetchZhihuHot(): Promise<ZhihuItem[]> {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.data) {
      return data.data.slice(0, 10).map((item: any) => ({
        title: item.target.title,
        url: `https://www.zhihu.com/question/${item.target.id}`,
        hot: item.detail_text || '0'
      }))
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch Zhihu hot:', error)
    return []
  }
}

export async function getZhihuHot(force = false): Promise<ZhihuItem[]> {
  // 如果不是强制刷新，先检查缓存
  if (!force) {
    const cached = await storage.getCachedData<ZhihuItem[]>(CACHE_KEY)
    if (cached) {
      console.log('[知乎] 使用缓存数据')
      return cached
    }
  }

  console.log('[知乎] 从网络获取数据')
  const items = await fetchZhihuHot()
  if (items.length > 0) {
    await storage.setCachedData(CACHE_KEY, items)
    console.log('[知乎] 数据已缓存')
  }
  return items
}