import type { XueqiuHotStock, XueqiuStockRealtime, XueqiuMarket } from '@/types'
import { storage } from '@/utils/storage'
import { fetchEastMoneyHotRank } from './eastmoney'

const COOKIE_KEY = 'xueqiuCookie'
const HOT_CACHE_PREFIX = 'xueqiuHot_'
const QUOTE_CACHE_KEY = 'xueqiuQuotes'
const HOT_API = 'https://stock.xueqiu.com/v5/stock/hot_stock/list.json'
const QUOTE_API = 'https://stock.xueqiu.com/v5/stock/batch/quote.json'

// 雪球市场类型到 API type 参数的映射
const XUEQIU_MARKET_TYPE: Record<XueqiuMarket, 11 | 12 | 13> = {
  hs: 12,
  hk: 13,
  us: 11
}

const MARKET_LABEL: Record<XueqiuMarket, string> = {
  hs: '沪深',
  hk: '港股',
  us: '美股'
}

export interface XueqiuCookie {
  u: string
  xq_a_token: string
}

export function getMarketLabel(market: XueqiuMarket): string {
  return MARKET_LABEL[market]
}

// ----- Cookie 管理 -----

export async function getXueqiuCookie(): Promise<XueqiuCookie | null> {
  try {
    const result = await chrome.storage.local.get(COOKIE_KEY)
    return result[COOKIE_KEY] || null
  } catch {
    return null
  }
}

export async function setXueqiuCookie(cookie: XueqiuCookie): Promise<void> {
  await chrome.storage.local.set({ [COOKIE_KEY]: cookie })
}

// ----- 雪球请求（需要 Cookie） -----

async function requestWithCookie(url: string): Promise<Response | null> {
  const cookie = await getXueqiuCookie()
  if (!cookie) return null

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://xueqiu.com/',
        'Cookie': `u=${cookie.u}; xq_a_token=${cookie.xq_a_token}`,
        'Accept': 'application/json, text/plain, */*'
      }
    })

    if (!response.ok) {
      console.error(`[雪球] HTTP error! status: ${response.status}`)
      return null
    }

    return response
  } catch (error) {
    console.error('[雪球] 请求失败:', error)
    return null
  }
}

// ----- 雪球热榜（需要 Cookie，支持沪深/港股/美股） -----

async function fetchXueqiuHotStocks(type: 11 | 12 | 13): Promise<XueqiuHotStock[]> {
  const url = `${HOT_API}?type=${type}&size=30`
  const response = await requestWithCookie(url)
  if (!response) return []

  try {
    const data = await response.json()
    if (data.error_code !== 0 || !data.data?.items) {
      console.error('[雪球] 热榜接口返回异常:', data)
      return []
    }

    return data.data.items.map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      current: item.current,
      percent: item.percent,
      chg: item.chg,
      high: item.high,
      low: item.low,
      volume: item.volume,
      amount: item.amount,
      market_capital: item.market_capital,
      turnover_rate: item.turnover_rate,
      pe_ttm: item.pe_ttm,
      follow: item.follow,
      value: item.value,
      rank_change: item.rank_change ?? 0
    }))
  } catch (error) {
    console.error('[雪球] 解析热榜数据失败:', error)
    return []
  }
}

// ----- 沪深热榜（优先雪球，无 Cookie 自动降级到东方财富） -----

export async function getHsHotStocks(force = false): Promise<XueqiuHotStock[]> {
  const cacheKey = `${HOT_CACHE_PREFIX}hs`

  if (!force) {
    const cached = await storage.getCachedData<XueqiuHotStock[]>(cacheKey)
    if (cached) {
      console.log('[热榜] 沪深 使用缓存数据')
      return cached
    }
  }

  console.log('[热榜] 沪深 从网络获取')

  // 优先用雪球
  const cookie = await getXueqiuCookie()
  if (cookie?.u && cookie?.xq_a_token) {
    const items = await fetchXueqiuHotStocks(12)
    if (items.length > 0) {
      await storage.setCachedData(cacheKey, items)
      console.log('[热榜] 沪深 雪球数据已缓存')
      return items
    }
  }

  // 无 Cookie 或雪球失败，降级到东方财富
  const eastmoneyItems = await fetchEastMoneyHotRank(50)
  if (eastmoneyItems.length > 0) {
    await storage.setCachedData(cacheKey, eastmoneyItems)
    console.log('[热榜] 沪深 东方财富数据已缓存')
  }
  return eastmoneyItems
}

// ----- 港股/美股热榜（仅雪球，需要 Cookie） -----

function getXueqiuMarketType(market: XueqiuMarket): 11 | 12 | 13 {
  return XUEQIU_MARKET_TYPE[market]
}

export async function getXueqiuHotStocks(market: XueqiuMarket, force = false): Promise<XueqiuHotStock[]> {
  const cacheKey = `${HOT_CACHE_PREFIX}${market}`
  const type = getXueqiuMarketType(market)

  if (!force) {
    const cached = await storage.getCachedData<XueqiuHotStock[]>(cacheKey)
    if (cached) {
      console.log(`[热榜] ${MARKET_LABEL[market]} 使用缓存数据`)
      return cached
    }
  }

  console.log(`[热榜] ${MARKET_LABEL[market]} 从网络获取`)
  const items = await fetchXueqiuHotStocks(type)
  if (items.length > 0) {
    await storage.setCachedData(cacheKey, items)
    console.log(`[热榜] ${MARKET_LABEL[market]} 数据已缓存`)
  }
  return items
}

export async function fetchAllXueqiuHotStocks(force = false): Promise<Record<XueqiuMarket, XueqiuHotStock[]>> {
  // 沪深走降级策略，港股/美股仅雪球
  const cookie = await getXueqiuCookie()
  const hasCookie = !!(cookie?.u && cookie?.xq_a_token)

  if (hasCookie) {
    const [hs, hk, us] = await Promise.all([
      getHsHotStocks(force),
      getXueqiuHotStocks('hk', force),
      getXueqiuHotStocks('us', force)
    ])
    return { hs, hk, us }
  } else {
    const hs = await getHsHotStocks(force)
    return { hs, hk: [], us: [] }
  }
}

// ----- 批量行情（需要 Cookie） -----

export async function fetchRealtimeQuotes(symbols: string[]): Promise<XueqiuStockRealtime[]> {
  if (symbols.length === 0) return []

  const symbolStr = symbols.join(',')
  const url = `${QUOTE_API}?symbol=${encodeURIComponent(symbolStr)}`
  const response = await requestWithCookie(url)
  if (!response) return []

  try {
    const data = await response.json()
    if (data.error_code !== 0 || !data.data?.items) {
      console.error('[雪球] 行情接口返回异常:', data)
      return []
    }

    return data.data.items.map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      current: item.current,
      percent: item.percent,
      chg: item.chg,
      lastUpdate: Date.now()
    }))
  } catch (error) {
    console.error('[雪球] 解析行情数据失败:', error)
    return []
  }
}

export async function getRealtimeQuotes(symbols: string[], force = false): Promise<XueqiuStockRealtime[]> {
  if (symbols.length === 0) return []

  if (!force) {
    const cached = await storage.getCachedData<XueqiuStockRealtime[]>(QUOTE_CACHE_KEY)
    if (cached) {
      const symbolSet = new Set(symbols)
      const filtered = cached.filter(q => symbolSet.has(q.symbol))
      if (filtered.length > 0) {
        console.log('[雪球] 行情使用缓存数据')
        return filtered
      }
    }
  }

  console.log('[雪球] 行情从网络获取')
  const quotes = await fetchRealtimeQuotes(symbols)
  if (quotes.length > 0) {
    const oldCached = await storage.getCachedData<XueqiuStockRealtime[]>(QUOTE_CACHE_KEY)
    const merged = oldCached || []
    const newSymbols = new Set(quotes.map(q => q.symbol))
    const filteredOld = merged.filter(q => !newSymbols.has(q.symbol))
    await storage.setCachedData(QUOTE_CACHE_KEY, [...filteredOld, ...quotes])
  }
  return quotes
}

// ----- 自选股持久化 -----

const WATCHLIST_KEY = 'xueqiuWatchlist'

export async function getWatchlist(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(WATCHLIST_KEY)
    return result[WATCHLIST_KEY] || []
  } catch {
    return []
  }
}

export async function saveWatchlist(symbols: string[]): Promise<void> {
  await chrome.storage.local.set({ [WATCHLIST_KEY]: symbols })
}
