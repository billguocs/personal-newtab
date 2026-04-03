import type { StockItem } from '@/types'

// 新浪财经 API 基础 URL
const SINA_API_URL = 'https://hq.sinajs.cn/list='

// 股票代码格式化
export function normalizeSymbol(input: string): { symbol: string; market: 'A' | 'HK' | 'US' } | null {
  const clean = input.trim().toUpperCase()
  
  // A股：6位数字
  if (/^\d{6}$/.test(clean)) {
    const prefix = clean.startsWith('6') || clean.startsWith('9') ? 'sh' : 'sz'
    return { symbol: `${prefix}${clean}`, market: 'A' }
  }
  
  // A股带前缀
  if (/^(SH|SZ)\d{6}$/i.test(clean)) {
    return { symbol: clean.toLowerCase(), market: 'A' }
  }
  
  // 港股：HK 开头
  if (/^HK\d+$/i.test(clean)) {
    return { symbol: clean.toLowerCase(), market: 'HK' }
  }
  
  // 美股：纯字母（2-5位）
  if (/^[A-Z]{1,5}$/.test(clean)) {
    return { symbol: `gb_${clean.toLowerCase()}`, market: 'US' }
  }
  
  return null
}

// 获取股票名称（用于显示）
export function getDisplayName(symbol: string, sinaData: string[]): string {
  // sinaData 格式因市场而异
  if (symbol.startsWith('gb_')) {
    // 美股：gb_aapl → "苹果"
    return sinaData[0] || symbol.replace('gb_', '').toUpperCase()
  }
  
  // A股和港股：第一个字段通常是名称
  return sinaData[0] || symbol.toUpperCase()
}

// 解析新浪财经返回数据
export function parseSinaData(symbol: string, dataStr: string): StockItem | null {
  if (!dataStr || dataStr === '') {
    return null
  }
  
  // 移除 var hq_str_xxxxx="..." 的外层
  const match = dataStr.match(/"([^"]+)"/)
  if (!match) return null
  
  const fields = match[1].split(',')
  if (fields.length < 3) return null
  
  let name: string
  let price: number
  let prevClose: number
  
  if (symbol.startsWith('gb_')) {
    // 美股格式：名称,最新价,涨跌幅,...
    name = fields[0] || symbol.replace('gb_', '').toUpperCase()
    price = parseFloat(fields[1]) || 0
    // 美股 API 返回的是涨跌幅百分比，需要计算昨收
    const changePercent = parseFloat(fields[2]) || 0
    prevClose = price / (1 + changePercent / 100)
  } else if (symbol.startsWith('hk')) {
    // 港股格式：英文名称,中文名称,开盘价,昨收,最高,最低,最新价,涨跌幅,...
    // 字段索引：0=英文名称, 1=中文名称, 2=开盘价, 3=昨收, 4=最高, 5=最低, 6=最新价, 7=涨跌幅
    name = fields[1] || fields[0] || symbol.toUpperCase()
    price = parseFloat(fields[6]) || 0  // 港股第7个字段(索引6)是最新价
    prevClose = parseFloat(fields[3]) || 0  // 港股第4个字段(索引3)是昨收
    console.log(`[Stock API] HK stock ${symbol} fields:`, { name, price, prevClose, rawFields: fields.slice(0, 10) })
  } else {
    // A股格式：名称,今日开盘价,昨日收盘价,当前价,...
    name = fields[0] || symbol.toUpperCase()
    price = parseFloat(fields[3]) || 0
    prevClose = parseFloat(fields[2]) || 0
  }
  
  const change = price - prevClose
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
  
  const market: 'A' | 'HK' | 'US' = symbol.startsWith('gb_') ? 'US' : symbol.startsWith('hk') ? 'HK' : 'A'
  
  return {
    symbol,
    name,
    price,
    prevClose,
    change,
    changePercent,
    market,
    lastUpdate: Date.now()
  }
}

// 获取股票数据
export async function fetchStockData(symbols: string[]): Promise<StockItem[]> {
  if (symbols.length === 0) return []

  try {
    const url = `${SINA_API_URL}${symbols.join(',')}`
    console.log('[Stock API] Request URL:', url)

    // 使用 fetch 并设置特殊的 headers 来绕过同源限制
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()
    console.log('[Stock API] Response text:', text.substring(0, 500))

    const results: StockItem[] = []

    // 解析返回的 JavaScript 变量
    for (const symbol of symbols) {
      const regex = new RegExp(`var hq_str_${symbol}="([^"]*)"`)
      const match = text.match(regex)
      console.log(`[Stock API] Parsing symbol ${symbol}:`, match ? 'found' : 'not found')

      if (match) {
        const stock = parseSinaData(symbol, match[0])
        console.log(`[Stock API] Parsed stock for ${symbol}:`, stock)
        if (stock) {
          results.push(stock)
        }
      }
    }

    return results
  } catch (error) {
    console.error('[Stock API] Failed to fetch stock data:', error)
    return []
  }
}

// 验证股票是否存在
export async function validateStock(symbol: string): Promise<StockItem | null> {
  const stocks = await fetchStockData([symbol])
  return stocks.length > 0 ? stocks[0] : null
}
