<template>
  <div ref="widgetRef" class="stock-widget">
    <div class="stock-header">
      <h3 class="stock-title">
        <span class="icon">📈</span>
        {{ "股票监控" }}
      </h3>
      <div class="stock-actions">
        <select v-model="sortType" @change="onSortChange" class="sort-select">
          <option value="custom">自定义排序</option>
          <option value="changePercent">涨跌幅排序</option>
        </select>
        <button 
          class="refresh-btn"
          @click="refresh"
          :disabled="stockStore.loading"
        >
          <svg 
            :class="{ spinning: stockStore.loading }"
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="stock-content">
      <!-- 添加股票输入框 -->
      <div class="add-stock">
        <input
          v-model="newStockInput"
          type="text"
          class="stock-input"
          placeholder="输入代码：600519、hk00700、AAPL"
          @keydown.enter="addStock"
        />
        <button class="add-btn" @click="addStock" :disabled="!newStockInput.trim()">
          添加
        </button>
      </div>
      
      <div class="input-hint">
        格式：A股(600519)、港股(hk00700)、美股(AAPL)
      </div>

      <!-- 错误提示 -->
      <div v-if="stockStore.error" class="error-msg">
        {{ stockStore.error }}
      </div>

      <!-- 股票列表 -->
      <div v-if="stockStore.sortedWatchlist.length > 0" class="stock-list">
        <div
          v-for="stock in stockStore.sortedWatchlist"
          :key="stock.symbol"
          class="stock-item"
        >
          <div class="stock-info">
            <div class="stock-name">{{ stock.name }}</div>
            <div class="stock-symbol">{{ formatSymbol(stock.symbol) }}</div>
          </div>
          <div class="stock-price" :class="getChangeClass(stock.change)">
            {{ stock.price.toFixed(2) }}
          </div>
          <div class="stock-change" :class="getChangeClass(stock.change)">
            <span class="change-percent">
              {{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
            </span>
          </div>
          <button class="remove-btn" @click="removeStock(stock.symbol)">✕</button>
        </div>
      </div>

      <div v-else class="empty-state">
        暂无监控股票，请添加
      </div>

      <!-- 最后更新时间 -->
      <div v-if="stockStore.lastUpdate > 0" class="update-time">
        更新于 {{ formatTime(stockStore.lastUpdate) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStockStore } from '@/stores/stock'

const stockStore = useStockStore()
const newStockInput = ref('')
const sortType = ref('custom')

let refreshInterval: number | null = null

onMounted(() => {
  stockStore.loadWatchlist()
  // 每30秒自动刷新
  refreshInterval = window.setInterval(() => {
    stockStore.refreshData()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

function addStock() {
  if (!newStockInput.value.trim()) return
  
  stockStore.addStock(newStockInput.value.trim()).then(success => {
    if (success) {
      newStockInput.value = ''
    }
  })
}

function removeStock(symbol: string) {
  stockStore.removeStock(symbol)
}

function refresh() {
  stockStore.refreshData()
}

function onSortChange() {
  stockStore.setSortType(sortType.value as 'custom' | 'changePercent')
}

function formatSymbol(symbol: string): string {
  if (symbol.startsWith('gb_')) {
    return symbol.replace('gb_', '').toUpperCase()
  }
  return symbol.toUpperCase()
}

function getChangeClass(change: number): string {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.stock-widget {
  @apply h-full flex flex-col;
}

.stock-header {
  @apply flex items-center justify-between p-4 border-b gap-2;
  border-color: var(--border-color);
  flex-wrap: wrap;
}

.stock-title {
  @apply flex items-center gap-2 text-lg font-semibold;
  color: var(--text-primary);
}

.icon {
  @apply text-xl;
}

.stock-actions {
  @apply flex items-center gap-2;
}

.sort-select {
  @apply px-2 py-1 rounded-lg text-xs outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.refresh-btn {
  @apply p-2 rounded-lg transition-all duration-200;
  color: var(--text-secondary);
}

.refresh-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.refresh-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stock-content {
  @apply flex-1 overflow-y-auto p-4;
}

.add-stock {
  @apply flex gap-2 mb-2;
}

.stock-input {
  @apply flex-1 px-3 py-2 rounded-lg text-sm outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.stock-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.add-btn {
  @apply px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.add-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.input-hint {
  @apply text-xs mb-3;
  color: var(--text-secondary);
}

.error-msg {
  @apply text-sm mb-3 p-2 rounded-lg;
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.stock-list {
  @apply space-y-1;
}

.stock-item {
  @apply flex items-center gap-2 p-2 rounded-lg transition-all duration-200;
  background: rgba(255, 255, 255, 0.05);
}

.stock-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stock-info {
  @apply flex-1 min-w-0;
}

.stock-name {
  @apply text-sm font-medium truncate;
  color: var(--text-primary);
}

.stock-symbol {
  @apply text-xs;
  color: var(--text-secondary);
}

.stock-price {
  @apply text-sm font-medium text-right w-16;
}

.stock-change {
  @apply text-xs text-right w-16;
}

.change-percent {
  @apply px-1.5 py-0.5 rounded;
}

.up {
  color: #ff4d4f;
}

.up .change-percent {
  background: rgba(255, 77, 79, 0.1);
}

.down {
  color: #52c41a;
}

.down .change-percent {
  background: rgba(82, 196, 26, 0.1);
}

.neutral {
  color: var(--text-secondary);
}

.remove-btn {
  @apply p-1 rounded opacity-0 transition-all duration-200;
  color: var(--text-secondary);
  font-size: 12px;
}

.stock-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  color: #ff4d4f;
}

.empty-state {
  @apply text-center py-8 text-sm;
  color: var(--text-secondary);
}

.update-time {
  @apply text-xs text-right mt-3;
  color: var(--text-secondary);
}
</style>
