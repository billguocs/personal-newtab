import type { GitHubRepo } from '@/types'
import { storage } from '@/utils/storage'

const CACHE_KEY = 'githubTrending'
const API_URL = 'https://api.github.com/search/repositories'

export async function fetchGitHubTrending(period: 'day' | 'week' | 'month' = 'day'): Promise<GitHubRepo[]> {
  try {
    const date = new Date()
    let createdQuery = ''
    
    switch (period) {
      case 'day':
        date.setDate(date.getDate() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
    }
    
    createdQuery = `created:>${date.toISOString().split('T')[0]}`
    
    const response = await fetch(
      `${API_URL}?q=${encodeURIComponent(createdQuery)}&sort=stars&order=desc&per_page=10`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.items.map((item: any) => ({
      name: item.name,
      fullName: item.full_name,
      description: item.description || '',
      stars: item.stargazers_count,
      url: item.html_url,
      language: item.language || 'Unknown'
    }))
  } catch (error) {
    console.error('Failed to fetch GitHub trending:', error)
    return []
  }
}

export async function getGitHubTrending(period: 'day' | 'week' | 'month' = 'day', force = false): Promise<GitHubRepo[]> {
  // 如果不是强制刷新，先检查缓存
  if (!force) {
    const cached = await storage.getCachedData<GitHubRepo[]>(`${CACHE_KEY}_${period}`)
    if (cached) {
      console.log(`[GitHub] 使用缓存数据 (${period})`)
      return cached
    }
  }

  console.log(`[GitHub] 从网络获取数据 (${period})`)
  const repos = await fetchGitHubTrending(period)
  if (repos.length > 0) {
    await storage.setCachedData(`${CACHE_KEY}_${period}`, repos)
    console.log(`[GitHub] 数据已缓存 (${period})`)
  }
  return repos
}