import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GitHubRepo, GitHubQueryOptions, ZhihuItem, V2exTopic, XueqiuHotStock, XueqiuMarket } from '@/types'
import { getGitHubTrending } from '@/api/github'
import { getZhihuHot } from '@/api/zhihu'
import { getV2exHot } from '@/api/v2ex'
import { getHsHotStocks, getXueqiuHotStocks, fetchAllXueqiuHotStocks } from '@/api/xueqiu'

export const useHotListStore = defineStore('hotlist', () => {
  const githubRepos = ref<GitHubRepo[]>([])
  const zhihuItems = ref<ZhihuItem[]>([])
  const v2exTopics = ref<V2exTopic[]>([])
  const xueqiuStocks = ref<Record<XueqiuMarket, XueqiuHotStock[]>>({
    hs: [],
    hk: [],
    us: []
  })
  const loading = ref({
    github: false,
    zhihu: false,
    v2ex: false,
    xueqiu: false
  })
  const error = ref({
    github: '',
    zhihu: '',
    v2ex: '',
    xueqiu: ''
  })

  async function loadGitHubTrending(options: Partial<GitHubQueryOptions> = {}, force = false) {
    if (loading.value.github) return

    const queryOptions: GitHubQueryOptions = {
      period: options.period || 'day',
      language: options.language || 'all'
    }

    loading.value.github = true
    error.value.github = ''

    try {
      const repos = await getGitHubTrending(queryOptions, force)
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

  async function loadXueqiuHot(market: XueqiuMarket, force = false) {
    if (loading.value.xueqiu) return

    loading.value.xueqiu = true
    error.value.xueqiu = ''

    try {
      if (market === 'hs') {
        // 沪深：降级策略（雪球 → 东方财富）
        const stocks = await getHsHotStocks(force)
        xueqiuStocks.value.hs = stocks
      } else {
        // 港股/美股：仅雪球
        const stocks = await getXueqiuHotStocks(market, force)
        xueqiuStocks.value[market] = stocks
      }
    } catch (e) {
      error.value.xueqiu = '获取失败，请稍后重试'
    } finally {
      loading.value.xueqiu = false
    }
  }

  async function loadAllXueqiu(force = false) {
    if (loading.value.xueqiu) return

    loading.value.xueqiu = true
    error.value.xueqiu = ''

    try {
      const all = await fetchAllXueqiuHotStocks(force)
      xueqiuStocks.value = all
    } catch (e) {
      error.value.xueqiu = '获取失败，请稍后重试'
    } finally {
      loading.value.xueqiu = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadGitHubTrending(),
      loadZhihuHot(),
      loadV2exHot(),
      loadXueqiuHot('hs')
    ])
  }

  function refreshAll() {
    loadGitHubTrending({ period: 'day' }, true)
    loadZhihuHot(true)
    loadV2exHot(true)
    loadAllXueqiu(true)
  }

  return {
    githubRepos,
    zhihuItems,
    v2exTopics,
    xueqiuStocks,
    loading,
    error,
    loadGitHubTrending,
    loadZhihuHot,
    loadV2exHot,
    loadXueqiuHot,
    loadAllXueqiu,
    loadAll,
    refreshAll
  }
})
