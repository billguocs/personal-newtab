<template>
  <div ref="widgetRef" class="hot-list-widget">
    <!-- 标题栏 -->
    <div class="widget-header">
      <h3 class="widget-title">
        <img
          class="site-icon"
          src="https://xueqiu.com/favicon.ico"
          alt="雪球"
          @error="handleIconError"
        />
        雪球热榜
      </h3>
      <div class="widget-actions">
        <button
          v-if="layoutStore.isEditing"
          class="config-btn"
          @click.stop="showConfig = true"
          title="配置 Cookie"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button
          class="refresh-btn"
          @click="refresh"
          :disabled="hotlistStore.loading.xueqiu"
        >
          <svg
            :class="{ spinning: hotlistStore.loading.xueqiu }"
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

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 未配置 Cookie 提示 -->
    <div v-if="!hasCookie" class="cookie-warning">
      ⚠ 请点击右上角 ⚙ 配置雪球 Cookie 以获取热榜数据
    </div>

    <div class="widget-content">
      <!-- Loading 状态 -->
      <div v-if="hotlistStore.loading.xueqiu && currentStocks.length === 0" class="loading">
        <div class="spinner"></div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="errorMessage" class="error">
        <p>{{ errorMessage }}</p>
        <button v-if="hasCookie" @click="refresh" class="retry-btn">刷新</button>
      </div>

      <!-- 数据列表 -->
      <div v-else class="stock-list">
        <div class="list-header">
          <span class="col-rank">排名</span>
          <span class="col-name">名称</span>
          <span class="col-symbol">代码</span>
          <span class="col-price">价格</span>
          <span class="col-change">涨跌幅</span>
          <span class="col-follow"></span>
        </div>
        <div
          v-for="(stock, index) in currentStocks"
          :key="stock.symbol"
          class="stock-item"
        >
          <span class="rank-indicator">
            <span
              v-if="stock.rank_change > 0"
              class="rank-up"
              :title="`上升 ${stock.rank_change} 名`"
            >↑{{ stock.rank_change }}</span>
            <span
              v-else-if="stock.rank_change < 0"
              class="rank-down"
              :title="`下降 ${Math.abs(stock.rank_change)} 名`"
            >↓{{ Math.abs(stock.rank_change) }}</span>
            <span
              v-else
              class="rank-flat"
              title="排名不变"
            >—</span>
          </span>
          <span :class="['rank-num', { 'rank-top': index < 3 }]">{{ index + 1 }}</span>
          <a
            :href="`https://xueqiu.com/S/${stock.symbol}`"
            target="_blank"
            class="stock-name"
            :title="stock.name"
          >{{ stock.name }}</a>
          <span class="stock-symbol">{{ stock.symbol }}</span>
          <span class="stock-price">{{ formatPrice(stock.current) }}</span>
          <span :class="['stock-change', stock.percent >= 0 ? 'rise' : 'fall']">
            {{ stock.percent >= 0 ? '+' : '' }}{{ stock.percent.toFixed(2) }}%
          </span>
          <button
            class="follow-btn"
            :class="{ followed: isFollowed(stock.symbol) }"
            @click="toggleFollow(stock.symbol)"
            :title="isFollowed(stock.symbol) ? '取消关注' : '关注'"
          >
            {{ isFollowed(stock.symbol) ? '★' : '☆' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 自选股折叠面板 -->
    <div class="watchlist-section">
      <button
        class="watchlist-toggle"
        @click="showWatchlist = !showWatchlist"
      >
        <span class="watchlist-label">★ 自选股 ({{ watchlist.length }})</span>
        <span :class="['watchlist-arrow', { open: showWatchlist }]">▼</span>
      </button>
      <div v-if="showWatchlist" class="watchlist-content">
        <div v-if="watchlist.length === 0" class="watchlist-empty">
          关注你感兴趣的股票
        </div>
        <div
          v-for="quote in watchlistQuotes"
          :key="quote.symbol"
          class="watchlist-item"
        >
          <span class="wl-name">{{ quote.name }}</span>
          <span class="wl-price">{{ formatPrice(quote.current) }}</span>
          <span :class="['wl-change', quote.percent >= 0 ? 'rise' : 'fall']">
            {{ quote.percent >= 0 ? '+' : '' }}{{ quote.percent.toFixed(2) }}%
          </span>
        </div>
        <div v-if="watchlistLoading" class="watchlist-loading">
          <div class="mini-spinner"></div>
        </div>
      </div>
    </div>

    <!-- Cookie 配置弹窗 -->
    <teleport to="body">
      <div v-if="showConfig" class="config-overlay" @click.self="showConfig = false">
        <div class="config-dialog" @click.stop>
          <h4 class="config-title">配置雪球 Cookie</h4>
          <p class="config-desc">
            从浏览器开发者工具 (F12) → Network → 任意请求头中获取
            <code>u</code> 和 <code>xq_a_token</code> 的值
          </p>
          <div class="config-field">
            <label>u</label>
            <input
              v-model="cookieForm.u"
              type="text"
              placeholder="输入 u 的值"
              class="config-input"
            />
          </div>
          <div class="config-field">
            <label>xq_a_token</label>
            <input
              v-model="cookieForm.xq_a_token"
              type="text"
              placeholder="输入 xq_a_token 的值"
              class="config-input"
            />
          </div>
          <div class="config-actions">
            <button
              class="config-btn-cancel"
              @click="showConfig = false"
            >取消</button>
            <button
              class="config-btn-save"
              @click="saveCookieConfig"
            >保存</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useHotListStore } from '@/stores/hotlist'
import { useLayoutStore } from '@/stores/layout'
import { getXueqiuCookie, setXueqiuCookie, getWatchlist, saveWatchlist, fetchRealtimeQuotes } from '@/api/xueqiu'
import type { XueqiuMarket, XueqiuStockRealtime } from '@/types'

const hotlistStore = useHotListStore()
const layoutStore = useLayoutStore()
const widgetRef = ref<HTMLElement>()
const hasLoaded = ref(false)
const hasCookie = ref(false)

// Tab
const activeTab = ref<XueqiuMarket>('hs')
const tabs = [
  { key: 'hs' as XueqiuMarket, label: '沪深' },
  { key: 'hk' as XueqiuMarket, label: '港股' },
  { key: 'us' as XueqiuMarket, label: '美股' }
]

// 当前 tab 的数据
const currentStocks = computed(() => hotlistStore.xueqiuStocks[activeTab.value])
const errorMessage = computed(() => {
  if (!hasCookie.value) return ''
  return hotlistStore.error.xueqiu
})

// 自选股
const watchlist = ref<string[]>([])
const watchlistQuotes = ref<XueqiuStockRealtime[]>([])
const showWatchlist = ref(false)
const watchlistLoading = ref(false)
let quoteTimer: ReturnType<typeof setInterval> | null = null

// Cookie 配置
const showConfig = ref(false)
const cookieForm = ref({ u: '', xq_a_token: '' })

function handleIconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

async function loadIfVisible() {
  if (!hasLoaded.value) {
    hasLoaded.value = true
    await checkCookie()
    if (hasCookie.value) {
      hotlistStore.loadXueqiuHot(activeTab.value)
    }
  }
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
  // 检查 Cookie 和加载自选股
  await checkCookie()
  watchlist.value = await getWatchlist()

  if (widgetRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadIfVisible()
        }
      },
      { rootMargin: '100px' }
    )
    observer.observe(widgetRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  stopQuoteRefresh()
})

async function checkCookie() {
  const cookie = await getXueqiuCookie()
  hasCookie.value = !!(cookie?.u && cookie?.xq_a_token)
}

async function switchTab(market: XueqiuMarket) {
  activeTab.value = market
  if (hasCookie.value && hotlistStore.xueqiuStocks[market].length === 0) {
    hotlistStore.loadXueqiuHot(market)
  }
}

async function refresh() {
  if (hasCookie.value) {
    await hotlistStore.loadXueqiuHot(activeTab.value, true)
    refreshWatchlistQuotes()
  }
}

// 自选股管理
function isFollowed(symbol: string): boolean {
  return watchlist.value.includes(symbol)
}

async function toggleFollow(symbol: string) {
  if (isFollowed(symbol)) {
    watchlist.value = watchlist.value.filter(s => s !== symbol)
  } else {
    watchlist.value.push(symbol)
  }
  await saveWatchlist(watchlist.value)

  // 如果自选股展开，刷新行情
  if (showWatchlist.value) {
    if (watchlist.value.length > 0) {
      refreshWatchlistQuotes()
    } else {
      watchlistQuotes.value = []
      stopQuoteRefresh()
    }
  }
}

async function refreshWatchlistQuotes() {
  if (watchlist.value.length === 0) return
  watchlistLoading.value = true
  const quotes = await fetchRealtimeQuotes(watchlist.value)
  if (quotes.length > 0) {
    watchlistQuotes.value = quotes
  }
  watchlistLoading.value = false
}

function startQuoteRefresh() {
  stopQuoteRefresh()
  if (watchlist.value.length === 0) return
  refreshWatchlistQuotes()
  quoteTimer = setInterval(refreshWatchlistQuotes, 60000)
}

function stopQuoteRefresh() {
  if (quoteTimer) {
    clearInterval(quoteTimer)
    quoteTimer = null
  }
}

// 监听自选股面板展开/收起
watch(showWatchlist, (val: boolean) => {
  if (val && watchlist.value.length > 0) {
    startQuoteRefresh()
  } else {
    stopQuoteRefresh()
  }
})

// Cookie 配置
async function saveCookieConfig() {
  if (!cookieForm.value.u || !cookieForm.value.xq_a_token) return
  await setXueqiuCookie({
    u: cookieForm.value.u.trim(),
    xq_a_token: cookieForm.value.xq_a_token.trim()
  })
  showConfig.value = false
  hasCookie.value = true
  // 自动刷新数据
  hotlistStore.loadXueqiuHot(activeTab.value, true)
}

function formatPrice(price: number): string {
  return price.toFixed(2)
}
</script>

<style scoped>
.hot-list-widget {
  @apply h-full flex flex-col;
}

.widget-header {
  @apply flex items-center justify-between p-4 border-b;
  border-color: var(--border-color);
}

.widget-title {
  @apply flex items-center gap-2 text-lg font-semibold;
  color: var(--text-primary);
}

.site-icon {
  @apply w-5 h-5 inline-block align-middle;
}

.widget-actions {
  @apply flex items-center gap-2;
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

.config-btn {
  @apply p-2 rounded-lg transition-all duration-200;
  color: var(--text-secondary);
  pointer-events: auto;
}

.config-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-color);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Tab 栏 */
.tab-bar {
  @apply flex gap-1 px-4 pt-3 pb-2;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  @apply px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200;
  color: var(--text-secondary);
  background: transparent;
}

.tab-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-color);
  color: white;
}

/* Cookie 警告 */
.cookie-warning {
  @apply mx-4 mt-3 px-3 py-2 rounded-lg text-xs;
  background: rgba(234, 179, 8, 0.15);
  color: #b8860b;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

/* 内容区域 */
.widget-content {
  @apply flex-1 overflow-y-auto;
}

.loading {
  @apply flex items-center justify-center h-48;
}

.spinner {
  @apply w-8 h-8 border-2 border-t-transparent rounded-full animate-spin;
  border-color: var(--accent-color);
  border-top-color: transparent;
}

.error {
  @apply flex flex-col items-center justify-center h-48 text-center;
  color: var(--text-secondary);
}

.retry-btn {
  @apply mt-4 px-4 py-2 rounded-lg font-medium;
  background: var(--accent-color);
  color: white;
}

/* 列表头 */
.list-header {
  @apply flex items-center gap-2 px-4 py-2 text-xs;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.col-rank { width: 60px; }
.col-name { flex: 1; }
.col-symbol { width: 90px; }
.col-price { width: 80px; text-align: right; }
.col-change { width: 85px; text-align: right; }
.col-follow { width: 32px; }

/* 股票行 */
.stock-list {
  @apply flex flex-col;
}

.stock-item {
  @apply flex items-center gap-2 px-4 py-2.5 transition-all duration-150;
  border-bottom: 1px solid var(--border-color);
}

.stock-item:hover {
  background: var(--bg-secondary);
}

/* 排名变化指示器 */
.rank-indicator {
  @apply w-14 flex-shrink-0 text-xs;
}

.rank-up {
  @apply px-1.5 py-0.5 rounded;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.rank-down {
  @apply px-1.5 py-0.5 rounded;
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.rank-flat {
  @apply px-1.5 py-0.5 rounded;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.rank-num {
  @apply w-6 h-6 flex items-center justify-center rounded text-sm font-bold flex-shrink-0;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.rank-num.rank-top {
  background: var(--accent-color);
  color: white;
}

.stock-name {
  @apply flex-1 min-w-0 truncate text-sm font-medium;
  color: var(--text-primary);
  text-decoration: none;
}

.stock-name:hover {
  color: var(--accent-color);
}

.stock-symbol {
  @apply w-20 flex-shrink-0 text-xs;
  color: var(--text-secondary);
}

.stock-price {
  @apply w-20 flex-shrink-0 text-right text-sm;
  color: var(--text-primary);
}

.stock-change {
  @apply w-20 flex-shrink-0 text-right text-sm font-medium;
}

.rise {
  color: #dc2626;
}

.fall {
  color: #16a34a;
}

.follow-btn {
  @apply w-6 h-6 flex items-center justify-center rounded text-sm transition-all duration-200;
  background: transparent;
}

.follow-btn:hover {
  background: var(--bg-secondary);
}

.follow-btn.followed {
  color: #eab308;
}

/* 自选股面板 */
.watchlist-section {
  @apply border-t;
  border-color: var(--border-color);
  flex-shrink: 0;
}

.watchlist-toggle {
  @apply w-full flex items-center justify-between px-4 py-3 transition-all duration-200;
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.watchlist-toggle:hover {
  background: var(--bg-secondary);
  opacity: 0.8;
}

.watchlist-label {
  @apply font-medium text-sm;
}

.watchlist-arrow {
  @apply text-xs transition-transform duration-200;
  color: var(--text-secondary);
}

.watchlist-arrow.open {
  transform: rotate(180deg);
}

.watchlist-content {
  @apply px-4 py-3 space-y-2 max-h-32 overflow-y-auto;
}

.watchlist-empty {
  @apply text-xs text-center py-2;
  color: var(--text-secondary);
}

.watchlist-item {
  @apply flex items-center gap-3 text-sm;
}

.wl-name {
  @apply flex-1 min-w-0 truncate;
  color: var(--text-primary);
}

.wl-price {
  @apply w-20 text-right;
  color: var(--text-primary);
}

.wl-change {
  @apply w-20 text-right font-medium;
}

.watchlist-loading {
  @apply flex justify-center py-2;
}

.mini-spinner {
  @apply w-4 h-4 border-2 border-t-transparent rounded-full animate-spin;
  border-color: var(--accent-color);
  border-top-color: transparent;
}

/* 配置弹窗 */
.config-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  background: rgba(0, 0, 0, 0.5);
}

.config-dialog {
  @apply p-6 rounded-2xl w-96 max-w-[90vw];
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.config-title {
  @apply text-lg font-semibold mb-2;
  color: var(--text-primary);
}

.config-desc {
  @apply text-xs mb-4 leading-relaxed;
  color: var(--text-secondary);
}

.config-desc code {
  @apply px-1 py-0.5 rounded;
  background: var(--bg-secondary);
  font-family: monospace;
}

.config-field {
  @apply mb-3;
}

.config-field label {
  @apply block text-sm font-medium mb-1;
  color: var(--text-primary);
}

.config-input {
  @apply w-full px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.config-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.config-actions {
  @apply flex justify-end gap-2 mt-4;
}

.config-btn-cancel {
  @apply px-4 py-2 rounded-lg text-sm;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.config-btn-save {
  @apply px-4 py-2 rounded-lg text-sm font-medium;
  background: var(--accent-color);
  color: white;
}
</style>
