import type { V2exTopic } from '@/types'
import { storage } from '@/utils/storage'

const CACHE_KEY = 'v2exHot'
const PRIMARY_API_URL = 'https://www.v2ex.com/api/topics/hot.json'
const BACKUP_API_URL = 'https://v2ex.com/api/topics/hot.json'

// 备用数据（当 API 无法访问时使用）
const FALLBACK_DATA: V2exTopic[] = [
  { title: 'V2EX 热门话题 - 当前无法访问', url: 'https://v2ex.com', replies: 0, node: '公告' },
  { title: '请检查网络连接或稍后重试', url: 'https://v2ex.com', replies: 0, node: '提示' }
]

export async function fetchV2exHot(): Promise<V2exTopic[]> {
  try {
    // 尝试主 API
    const urlWithTimestamp = `${PRIMARY_API_URL}?t=${Date.now()}`
    const response = await fetch(urlWithTimestamp, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.slice(0, 10).map((item: any) => ({
      title: item.title,
      url: item.url,
      replies: item.replies,
      node: item.node?.title || 'V2EX'
    }))
  } catch (error) {
    console.log('[V2EX] 主 API 失败，尝试备用 API...')
    
    try {
      // 尝试备用 API
      const response = await fetch(`${BACKUP_API_URL}?t=${Date.now()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Backup API error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      return data.slice(0, 10).map((item: any) => ({
        title: item.title,
        url: item.url,
        replies: item.replies,
        node: item.node?.title || 'V2EX'
      }))
    } catch (backupError) {
      console.error('[V2EX] 所有 API 都失败了，使用备用数据')
      return FALLBACK_DATA
    }
  }
}

export async function getV2exHot(force = false): Promise<V2exTopic[]> {
  // 如果不是强制刷新，先检查缓存
  if (!force) {
    const cached = await storage.getCachedData<V2exTopic[]>(CACHE_KEY)
    if (cached) {
      console.log('[V2EX] 使用缓存数据')
      return cached
    }
  }

  console.log('[V2EX] 从网络获取数据')
  const topics = await fetchV2exHot()
  if (topics.length > 0 && topics[0].title !== 'V2EX 热门话题 - 当前无法访问') {
    await storage.setCachedData(CACHE_KEY, topics)
    console.log('[V2EX] 数据已缓存')
  }
  return topics
}