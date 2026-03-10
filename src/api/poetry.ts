import type { PoetryItem } from '@/types'

const API_URL = 'https://v1.jinrishici.com/all'

export async function fetchPoetry(): Promise<PoetryItem | null> {
  try {
    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      content: data.content,
      author: data.origin?.author || data.author || '未知',
      title: data.origin?.title || data.title || '未知',
      category: data.category || '古诗词'
    }
  } catch (error) {
    console.error('Failed to fetch poetry:', error)
    return null
  }
}

export function getTodayCacheKey(): string {
  const today = new Date().toISOString().split('T')[0]
  return `poetry_${today}`
}

export function getCachedPoetry(): PoetryItem | null {
  const cacheKey = getTodayCacheKey()
  const cached = localStorage.getItem(cacheKey)
  
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      return null
    }
  }
  
  return null
}

export function cachePoetry(poetry: PoetryItem): void {
  const cacheKey = getTodayCacheKey()
  localStorage.setItem(cacheKey, JSON.stringify(poetry))
}
