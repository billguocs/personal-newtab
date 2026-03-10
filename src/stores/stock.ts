import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StockItem } from '@/types'
import { fetchStockData, normalizeSymbol, validateStock } from '@/api/stock'
import { storage } from '@/utils/storage'

const STORAGE_KEY = 'stockWatchlist'

export type SortType = 'custom' | 'changePercent'

export const useStockStore = defineStore('stock', () => {
  const watchlist = ref<StockItem[]>([])
  const sortType = ref<SortType>('custom')
  const loading = ref(false)
  const error = ref('')
  const lastUpdate = ref<number>(0)

  // 根据排序类型返回排序后的列表
  const sortedWatchlist = computed(() => {
    if (sortType.value === 'changePercent') {
      return [...watchlist.value].sort((a, b) => b.changePercent - a.changePercent)
    }
    // custom: 保持原始顺序
    return watchlist.value
  })

  // 加载自选股列表
  async function loadWatchlist() {
    try {
      const saved = await storage.getCachedData<StockItem[]>(STORAGE_KEY)
      if (saved) {
        watchlist.value = saved
        // 立即刷新数据
        refreshData()
      }
    } catch (error) {
      console.error('[Stock] 加载自选股失败:', error)
    }
  }

  // 保存自选股列表
  async function saveWatchlist() {
    try {
      await storage.setCachedData(STORAGE_KEY, watchlist.value)
    } catch (error) {
      console.error('[Stock] 保存自选股失败:', error)
    }
  }

  // 添加股票
  async function addStock(input: string): Promise<boolean> {
    const normalized = normalizeSymbol(input)
    if (!normalized) {
      error.value = '股票代码格式不正确'
      return false
    }

    const { symbol } = normalized

    // 检查是否已存在
    if (watchlist.value.some(s => s.symbol === symbol)) {
      error.value = '该股票已在监控列表中'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      const stock = await validateStock(symbol)
      if (stock) {
        watchlist.value.push(stock)
        await saveWatchlist()
        return true
      } else {
        error.value = '未找到该股票，请检查代码'
        return false
      }
    } catch (e) {
      error.value = '添加股票失败'
      return false
    } finally {
      loading.value = false
    }
  }

  // 移除股票
  async function removeStock(symbol: string) {
    watchlist.value = watchlist.value.filter(s => s.symbol !== symbol)
    await saveWatchlist()
  }

  // 刷新数据
  async function refreshData() {
    if (watchlist.value.length === 0) return
    
    loading.value = true
    
    try {
      const symbols = watchlist.value.map(s => s.symbol)
      const updated = await fetchStockData(symbols)
      
      // 保留原始顺序（custom 排序）
      const updatedMap = new Map(updated.map(s => [s.symbol, s]))
      
      watchlist.value = watchlist.value.map(stock => {
        const updated = updatedMap.get(stock.symbol)
        return updated || stock
      })
      
      lastUpdate.value = Date.now()
    } catch (e) {
      console.error('[Stock] 刷新数据失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 设置排序方式
  function setSortType(type: SortType) {
    sortType.value = type
  }

  return {
    watchlist,
    sortedWatchlist,
    sortType,
    loading,
    error,
    lastUpdate,
    loadWatchlist,
    addStock,
    removeStock,
    refreshData,
    setSortType
  }
})
