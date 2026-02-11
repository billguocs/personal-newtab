import type { BingImage } from '@/types'
import { storage } from '@/utils/storage'

const BING_API_URL = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
const BING_BASE_URL = 'https://www.bing.com'

export async function fetchBingWallpaper(): Promise<BingImage | null> {
  try {
    const response = await fetch(BING_API_URL)
    const data = await response.json()
    
    if (data.images && data.images.length > 0) {
      const image = data.images[0]
      return {
        url: `${BING_BASE_URL}${image.url}`,
        title: image.title,
        copyright: image.copyright
      }
    }
    return null
  } catch (error) {
    console.error('Failed to fetch Bing wallpaper:', error)
    return null
  }
}

export async function getWallpaper(): Promise<BingImage | null> {
  const cached = await storage.getCachedData<BingImage>('bingWallpaper')
  if (cached) {
    return cached
  }

  const wallpaper = await fetchBingWallpaper()
  if (wallpaper) {
    await storage.setCachedData('bingWallpaper', wallpaper)
  }
  return wallpaper
}