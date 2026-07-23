import type { XueqiuHotStock } from '@/types'

// 东方财富个股人气榜 API（完全公开，无需认证）
const RANK_API = 'https://emappdata.eastmoney.com/stockrank/getAllCurrentList'
const QUOTE_API = 'https://push2.eastmoney.com/api/qt/ulist.np/get'

interface RankItem {
  sc: string  // 证券代码 e.g. "SZ000665"
  rk: number  // 排名
  hrc: number // 排名变化
}

// 提取股票代码中的纯数字部分
function extractCode(sc: string): string {
  const match = sc.match(/\d+/)
  return match ? match[0] : sc
}

// 构建 secid 用于行情接口
function buildSecId(sc: string): string {
  // SZ/SH 前缀判断
  if (sc.startsWith('SZ')) return `0.${extractCode(sc)}`
  return `1.${extractCode(sc)}`
}

export async function fetchEastMoneyHotRank(limit = 50): Promise<XueqiuHotStock[]> {
  try {
    // 第一步：获取热门股票排名列表
    const rankResponse = await fetch(RANK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        appId: 'appId01',
        globalId: '786e4c21-70dc-435a-93bb-38',
        marketType: '',
        pageNo: 1,
        pageSize: limit
      })
    })

    if (!rankResponse.ok) {
      console.error('[东方财富] HTTP error:', rankResponse.status)
      return []
    }

    const rankData = await rankResponse.json()
    if (!rankData?.data?.length) {
      console.error('[东方财富] 排名数据为空:', rankData)
      return []
    }

    const rankItems: RankItem[] = rankData.data
    const secids = rankItems.map(item => buildSecId(item.sc)).join(',')

    // 第二步：获取实时行情
    const quoteUrl = `${QUOTE_API}?fields=f14,f3,f12,f2,f15,f16,f17,f18&secids=${secids}`
    const quoteResponse = await fetch(quoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!quoteResponse.ok) {
      console.error('[东方财富] 行情接口错误:', quoteResponse.status)
      return []
    }

    const quoteData = await quoteResponse.json()
    const quoteMap = new Map<string, any>()

    if (quoteData?.data?.diff) {
      for (const item of quoteData.data.diff) {
        // f12=代码, f14=名称, f2=最新价, f3=涨跌幅, f15=最高, f16=最低, f17=今开, f18=昨收
        quoteMap.set(item.f12, item)
      }
    }

    // 合并排名和行情数据
    return rankItems.map((item, index) => {
      const code = extractCode(item.sc)
      const quote = quoteMap.get(code)
      const current = quote?.f2 ?? 0
      const prevClose = quote?.f18 ?? 0
      const percent = quote?.f3 ?? 0
      const chg = prevClose > 0 ? current - prevClose : 0

      return {
        symbol: code.length === 6 ? code : item.sc,
        name: quote?.f14 ?? code,
        current,
        percent,
        chg,
        high: quote?.f15 ?? 0,
        low: quote?.f16 ?? 0,
        volume: 0,
        amount: 0,
        market_capital: 0,
        turnover_rate: 0,
        pe_ttm: 0,
        follow: 0,
        value: Math.max(0, limit - index), // 用排名模拟热度
        rank_change: item.hrc ?? 0
      }
    })
  } catch (error) {
    console.error('[东方财富] 请求失败:', error)
    return []
  }
}
