import type { XueqiuHotStock, XueqiuStockRealtime, XueqiuMarket } from '@/types'
import { storage } from '@/utils/storage'

const HOT_CACHE_PREFIX = 'xueqiuHot_v2_'
const QUOTE_CACHE_KEY = 'xueqiuQuotes'
const HOT_API = 'https://stock.xueqiu.com/v5/stock/hot_stock/list.json'
const QUOTE_API = 'https://stock.xueqiu.com/v5/stock/batch/quote.json'
// 访问首页会让雪球下发 u / xq_a_token 等 Cookie，后续请求自动携带
const HOME_URL = 'https://www.xueqiu.com/'

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

export function getMarketLabel(market: XueqiuMarket): string {
  return MARKET_LABEL[market]
}

// ----- 会话（Cookie）管理 -----
// 浏览器的 fetch 不允许手动设置 Cookie 请求头，因此不再让用户配置 token，
// 而是先访问雪球首页，让浏览器自动保存 Cookie，再用 credentials: 'include' 请求接口。

let sessionPromise: Promise<boolean> | null = null
let hasSession = false

async function bootstrapSession(): Promise<boolean> {
  try {
    const response = await fetch(HOME_URL, {
      credentials: 'include',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    return response.ok
  } catch (error) {
    console.error('[雪球] 建立会话失败:', error)
    return false
  }
}

function ensureSession(force = false): Promise<boolean> {
  if (!force) {
    if (sessionPromise) return sessionPromise
    if (hasSession) return Promise.resolve(true)
  }
  const promise = bootstrapSession().then((ok) => {
    hasSession = ok
    if (!ok) sessionPromise = null
    return ok
  })
  sessionPromise = promise
  return promise
}

function isAuthError(response: Response): boolean {
  return response.status === 400 || response.status === 401 || response.status === 403
}

async function fetchXueqiu(url: string): Promise<Response | null> {
  try {
    const request = () =>
      fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json, text/plain, */*' }
      })

    let response = await request()

    // 没有 Cookie 或 Cookie 失效时，雪球会返回 400/401/403。
    // 重新访问首页建立会话后重试一次。
    if (isAuthError(response)) {
      console.log('[雪球] 会话失效，重新获取 Cookie 后重试')
      const ok = await ensureSession(true)
      if (!ok) return null
      response = await request()
    }

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

// ----- 雪球热榜（沪深/港股/美股） -----

async function fetchXueqiuHotStocks(type: 11 | 12 | 13): Promise<XueqiuHotStock[]> {
  const url = `${HOT_API}?type=${type}&size=30`
  const response = await fetchXueqiu(url)
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
  const [hs, hk, us] = await Promise.all([
    getXueqiuHotStocks('hs', force),
    getXueqiuHotStocks('hk', force),
    getXueqiuHotStocks('us', force)
  ])
  return { hs, hk, us }
}

// ----- 批量行情（自选股） -----

export async function fetchRealtimeQuotes(symbols: string[]): Promise<XueqiuStockRealtime[]> {
  if (symbols.length === 0) return []

  const symbolStr = symbols.join(',')
  const url = `${QUOTE_API}?symbol=${encodeURIComponent(symbolStr)}`
  const response = await fetchXueqiu(url)
  if (!response) return []

  try {
    const data = await response.json()
    if (data.error_code !== 0 || !Array.isArray(data.data?.items)) {
      console.error('[雪球] 行情接口返回异常:', data)
      return []
    }

    return data.data.items
      .map((item: any) => item?.quote)
      .filter((quote: any) => quote && typeof quote.symbol === 'string')
      .map((item: any) => ({
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

// 存储数据不受 TypeScript 约束；兼容旧版写入的数字键对象。
function normalizeWatchlist(value: unknown): string[] {
  let entries: unknown[] = []
  if (Array.isArray(value)) {
    entries = value
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    entries = Object.keys(record)
      .filter(key => /^(0|[1-9]\d*)$/.test(key))
      .sort((a, b) => Number(a) - Number(b))
      .map(key => record[key])
  }
  return [...new Set(entries
    .filter((symbol): symbol is string => typeof symbol === 'string')
    .map(symbol => symbol.trim())
    .filter(Boolean))]
}

export async function getWatchlist(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(WATCHLIST_KEY)
    return normalizeWatchlist(result[WATCHLIST_KEY])
  } catch {
    return []
  }
}

export async function saveWatchlist(symbols: string[]): Promise<void> {
  // 生成普通数组，避免直接把 Vue 响应式 Proxy 传给 Chrome Storage。
  await chrome.storage.local.set({ [WATCHLIST_KEY]: normalizeWatchlist(symbols) })
}
