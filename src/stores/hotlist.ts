import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GitHubRepo, ZhihuItem, V2exTopic } from '@/types'
import { getGitHubTrending } from '@/api/github'
import { getZhihuHot } from '@/api/zhihu'
import { getV2exHot } from '@/api/v2ex'

export const useHotListStore = defineStore('hotlist', () => {
  const githubRepos = ref<GitHubRepo[]>([])
  const zhihuItems = ref<ZhihuItem[]>([])
  const v2exTopics = ref<V2exTopic[]>([])
  const loading = ref({
    github: false,
    zhihu: false,
    v2ex: false
  })
  const error = ref({
    github: '',
    zhihu: '',
    v2ex: ''
  })

  async function loadGitHubTrending(period: 'day' | 'week' | 'month' = 'day', force = false) {
    if (loading.value.github) return
    
    loading.value.github = true
    error.value.github = ''
    
    try {
      const repos = await getGitHubTrending(period, force)
      if (repos.length === 0 && !force) {
        error.value.github = '获取失败，请稍后重试'
      } else {
        githubRepos.value = repos
      }
    } catch (e) {
      error.value.github = '获取失败，请稍后重试'
    } finally {
      loading.value.github = false
    }
  }

  async function loadZhihuHot(force = false) {
    if (loading.value.zhihu) return
    
    loading.value.zhihu = true
    error.value.zhihu = ''
    
    try {
      const items = await getZhihuHot(force)
      if (items.length === 0 && !force) {
        error.value.zhihu = '获取失败，请稍后重试'
      } else {
        zhihuItems.value = items
      }
    } catch (e) {
      error.value.zhihu = '获取失败，请稍后重试'
    } finally {
      loading.value.zhihu = false
    }
  }

  async function loadV2exHot(force = false) {
    if (loading.value.v2ex) return
    
    loading.value.v2ex = true
    error.value.v2ex = ''
    
    try {
      const topics = await getV2exHot(force)
      if (topics.length === 0 && !force) {
        error.value.v2ex = '获取失败，请稍后重试'
      } else {
        v2exTopics.value = topics
      }
    } catch (e) {
      error.value.v2ex = '获取失败，请稍后重试'
    } finally {
      loading.value.v2ex = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadGitHubTrending(),
      loadZhihuHot(),
      loadV2exHot()
    ])
  }

  function refreshAll() {
    loadGitHubTrending('day', true)
    loadZhihuHot(true)
    loadV2exHot(true)
  }

  return {
    githubRepos,
    zhihuItems,
    v2exTopics,
    loading,
    error,
    loadGitHubTrending,
    loadZhihuHot,
    loadV2exHot,
    loadAll,
    refreshAll
  }
})