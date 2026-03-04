import type { GitHubRepo, GitHubQueryOptions } from '@/types'
import { storage } from '@/utils/storage'

const CACHE_KEY = 'githubTrending'
const API_URL = 'https://api.github.com/search/repositories'

export async function fetchGitHubTrending(options: GitHubQueryOptions): Promise<GitHubRepo[]> {
  try {
    const { period, language } = options
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
    
    if (language && language !== 'all') {
      createdQuery += ` language:${language}`
    }
    
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

export async function getGitHubTrending(options: GitHubQueryOptions, force = false): Promise<GitHubRepo[]> {
  const { period, language } = options
  const cacheKey = `${CACHE_KEY}_${period}_${language}`
  
  if (!force) {
    const cached = await storage.getCachedData<GitHubRepo[]>(cacheKey)
    if (cached) {
      console.log(`[GitHub] 使用缓存数据 (${period}, ${language})`)
      return cached
    }
  }

  console.log(`[GitHub] 从网络获取数据 (${period}, ${language})`)
  const repos = await fetchGitHubTrending(options)
  if (repos.length > 0) {
    await storage.setCachedData(cacheKey, repos)
    console.log(`[GitHub] 数据已缓存 (${period}, ${language})`)
  }
  return repos
}