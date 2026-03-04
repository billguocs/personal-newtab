<template>
  <div class="navigation-widget">
    <div v-if="!isEditing" class="nav-links">
      <template v-if="navLinks.length > 0">
        <div class="nav-row">
          <a
            v-for="link in navLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            class="nav-item"
            :title="link.name"
          >
            <img 
              :src="getFaviconUrl(link.url)" 
              :alt="link.name"
              class="nav-favicon"
              @error="handleFaviconError($event, link.name)"
            />
            <span class="nav-name">{{ link.name }}</span>
          </a>
        </div>
      </template>
      <div v-else class="nav-empty">
        <span>暂无导航链接，点击编辑按钮添加</span>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="nav-editing">
      <div class="edit-header">
        <h3>自定义导航</h3>
        <span class="edit-hint">{{ navLinks.length }}/10</span>
      </div>
      
      <div class="nav-list">
        <VueDraggable
          v-model="navLinks"
          :animation="150"
          handle=".nav-drag-handle"
          @end="onNavDragEnd"
        >
          <div 
            v-for="(link, index) in navLinks" 
            :key="link.id"
            class="nav-edit-item"
          >
            <span class="nav-drag-handle">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
              </svg>
            </span>
            <input 
              v-model="link.name"
              type="text"
              placeholder="名称"
              class="name-input"
            />
            <input 
              v-model="link.url"
              type="text"
              placeholder="https://..."
              class="url-input"
            />
            <button class="delete-btn" @click="removeLink(index)">🗑️</button>
          </div>
        </VueDraggable>
      </div>

      <button 
        v-if="navLinks.length < 10"
        class="add-btn"
        @click="addLink"
      >
        + 添加导航
      </button>

      <button 
        class="import-btn"
        @click="showBookmarkPanel = true"
      >
        📚 从书签导入
      </button>

      <div class="edit-actions">
        <button class="btn-secondary" @click="cancelEdit">取消</button>
        <button class="btn-primary" @click="saveLinks">保存</button>
      </div>
    </div>

    <!-- 书签导入面板 -->
    <div v-if="showBookmarkPanel" class="bookmark-panel-overlay" @click.self="showBookmarkPanel = false">
      <div class="bookmark-panel">
        <div class="panel-header">
          <h3>从书签导入</h3>
          <button class="close-btn" @click="showBookmarkPanel = false">✕</button>
        </div>
        
        <div class="bookmark-list">
          <div v-if="bookmarkLoading" class="loading">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
          
          <template v-else>
            <div 
              v-for="bookmark in availableBookmarks" 
              :key="bookmark.id"
              :class="['bookmark-item', { selected: isBookmarkSelected(bookmark) }]"
              @click="toggleBookmarkSelection(bookmark)"
            >
              <span class="bookmark-icon">{{ getDefaultIcon(bookmark.title) }}</span>
              <span class="bookmark-title">{{ bookmark.title }}</span>
              <span v-if="isBookmarkSelected(bookmark)" class="check-icon">✓</span>
            </div>
            
            <div v-if="availableBookmarks.length === 0" class="no-bookmarks">
              暂无可用书签
            </div>
          </template>
        </div>

        <div class="panel-footer">
          <span class="selected-count">已选择 {{ selectedBookmarks.length }} 个</span>
          <div class="footer-actions">
            <button class="btn-secondary" @click="showBookmarkPanel = false">取消</button>
            <button 
              class="btn-primary" 
              @click="importBookmarks"
              :disabled="selectedBookmarks.length === 0"
            >
              导入
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑按钮 -->
    <button 
      v-if="!isEditing"
      class="edit-toggle-btn"
      @click="startEdit"
      title="编辑导航"
    >
      ✏️
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { NavigationLink } from '@/types'
import { storage } from '@/utils/storage'

const navLinks = ref<NavigationLink[]>([])
const isEditing = ref(false)
const originalLinks = ref<NavigationLink[]>([])
const showBookmarkPanel = ref(false)
const bookmarkLoading = ref(false)
const availableBookmarks = ref<{id: string, title: string, url: string}[]>([])
const selectedBookmarks = ref<{id: string, title: string, url: string}[]>([])
const faviconCache = ref<Record<string, string>>({})

// 默认导航数据
const defaultLinks: NavigationLink[] = [
  { id: '1', name: '百度', url: 'https://www.baidu.com', icon: '🔍' },
  { id: '2', name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { id: '3', name: '知乎', url: 'https://www.zhihu.com', icon: '💡' },
  { id: '4', name: 'B站', url: 'https://www.bilibili.com', icon: '📺' },
  { id: '5', name: '掘金', url: 'https://juejin.cn', icon: '📖' }
]

// 获取网站 favicon URL
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return faviconCache.value[domain] || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

async function loadFaviconCache() {
  try {
    const result = await chrome.storage.local.get('faviconCache')
    if (result.faviconCache) {
      faviconCache.value = result.faviconCache
    }
  } catch (error) {
    console.error('加载 favicon 缓存失败', error)
  }
}

// 处理 favicon 加载失败
function handleFaviconError(event: Event, name: string) {
  const img = event.target as HTMLImageElement
  // 显示默认图标
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent) {
    const fallback = document.createElement('span')
    fallback.className = 'nav-icon-fallback'
    fallback.textContent = getDefaultIcon(name)
    parent.insertBefore(fallback, img)
  }
}

function getDefaultIcon(name: string): string {
  const iconMap: Record<string, string> = {
    '百度': '🔍',
    'google': '🔍',
    'github': '🐙',
    '知乎': '💡',
    'bilibili': '📺',
    'b站': '📺',
    '掘金': '📖',
    '微博': '📱',
    '淘宝': '🛒',
    '京东': '📦',
    '豆瓣': '📚',
    '网易云': '🎵',
    'youtube': '📺'
  }
  
  const lowerName = name.toLowerCase()
  return iconMap[lowerName] || iconMap[name] || '🔗'
}

async function loadNavLinks() {
  try {
    const saved = await storage.getNavigationLinks<NavigationLink[]>()
    
    // 只有当 saved 是 null 或 undefined 时才使用默认值（表示从未保存过）
    // 空数组 [] 是有效值，表示用户手动清空了导航
    if (saved !== null && saved !== undefined) {
      // 再次确认是数组类型
      navLinks.value = Object.values(saved)
    } else {
      // 从未保存过数据，使用默认值
      navLinks.value = JSON.parse(JSON.stringify(defaultLinks))
      await saveToStorage()
      console.log('Navigation: 首次使用，已加载并保存默认链接', defaultLinks.length, '个')
    }
  } catch (error) {
    console.error('Navigation: 加载失败', error)
    navLinks.value = JSON.parse(JSON.stringify(defaultLinks))
  }
}

async function saveToStorage() {
  try {
    await storage.setNavigationLinks(navLinks.value)
    console.log('Navigation: 已保存', navLinks.value.length, '个链接:', navLinks.value.map(l => l.name))
  } catch (error) {
    console.error('Navigation: 保存失败', error)
    alert('保存导航失败，请检查权限设置')
  }
}

function startEdit() {
  originalLinks.value = JSON.parse(JSON.stringify(navLinks.value))
  isEditing.value = true
}

function cancelEdit() {
  navLinks.value = originalLinks.value
  isEditing.value = false
}

async function saveLinks() {
  // 过滤掉空项
  navLinks.value = navLinks.value.filter(link => link.name.trim() && link.url.trim())
  console.log('Navigation: 准备保存', navLinks.value.length, '个链接')
  await saveToStorage()
  isEditing.value = false
  console.log('Navigation: 编辑模式关闭')
}

function addLink() {
  if (navLinks.value.length < 10) {
    navLinks.value.push({
      id: Date.now().toString(),
      name: '',
      url: '',
      icon: ''
    })
  }
}

function onNavDragEnd() {
  saveToStorage()
}

async function removeLink(index: number) {
  navLinks.value.splice(index, 1)
  // 删除后立即保存
  await saveToStorage()
}

// 书签导入相关
async function loadBookmarks() {
  bookmarkLoading.value = true
  try {
    // 检查 chrome.bookmarks API 是否可用
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      const bookmarkTree = await chrome.bookmarks.getTree()
      const bookmarks: {id: string, title: string, url: string}[] = []
      
      // 递归提取所有书签
      function extractBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
        for (const node of nodes) {
          if (node.url && node.url.startsWith('http')) {
            bookmarks.push({
              id: node.id,
              title: node.title || '未命名',
              url: node.url
            })
          }
          if (node.children) {
            extractBookmarks(node.children)
          }
        }
      }
      
      extractBookmarks(bookmarkTree)
      
      // 过滤掉已存在的链接
      const existingUrls = new Set(navLinks.value.map(l => l.url))
      availableBookmarks.value = bookmarks.filter(b => !existingUrls.has(b.url))
    } else {
      console.warn('Chrome bookmarks API 不可用')
      availableBookmarks.value = []
    }
  } catch (error) {
    console.error('加载书签失败:', error)
    availableBookmarks.value = []
  } finally {
    bookmarkLoading.value = false
  }
}

function isBookmarkSelected(bookmark: {id: string, title: string, url: string}) {
  return selectedBookmarks.value.some(b => b.id === bookmark.id)
}

function toggleBookmarkSelection(bookmark: {id: string, title: string, url: string}) {
  const index = selectedBookmarks.value.findIndex(b => b.id === bookmark.id)
  if (index > -1) {
    selectedBookmarks.value.splice(index, 1)
  } else {
    selectedBookmarks.value.push(bookmark)
  }
}

async function importBookmarks() {
  const newLinks = selectedBookmarks.value.map(bookmark => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: bookmark.title,
    url: bookmark.url,
    icon: getDefaultIcon(bookmark.title)
  }))
  
  // 添加到现有链接中，不超过10个
  const remainingSlots = 10 - navLinks.value.length
  if (remainingSlots > 0) {
    navLinks.value = [...navLinks.value, ...newLinks.slice(0, remainingSlots)]
    // 立即保存导入的书签
    await saveToStorage()
  }
  
  selectedBookmarks.value = []
  showBookmarkPanel.value = false
}

// 监听面板显示状态
watch(showBookmarkPanel, (newVal) => {
  if (newVal) {
    loadBookmarks()
  } else {
    selectedBookmarks.value = []
  }
})

onMounted(() => {
  loadFaviconCache()
  loadNavLinks()
  console.log('Navigation 组件已加载，链接数:', navLinks.value.length)
})
</script>

<style scoped>
.navigation-widget {
  @apply relative;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px;
}

.navigation-widget:hover {
  background: var(--glass-bg);
  border-color: var(--accent-color);
}

.nav-links {
  @apply w-full;
}

.nav-row {
  @apply flex flex-wrap justify-center;
  gap: 8px;
}

/* 每行最多5个 */
.nav-item {
  @apply flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200;
  flex: 0 0 calc(20% - 6.4px);
  max-width: calc(20% - 6.4px);
  min-width: 100px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: var(--text-primary);
  text-decoration: none;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .nav-item {
    flex: 0 0 calc(33.333% - 5.33px);
    max-width: calc(33.333% - 5.33px);
  }
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.55);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-favicon {
  @apply w-5 h-5 flex-shrink-0;
  object-fit: contain;
}

.nav-icon-fallback {
  @apply text-base flex-shrink-0;
}

.nav-name {
  @apply text-sm font-medium truncate;
  flex: 1;
}

.nav-empty {
  @apply flex items-center justify-center py-4;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.edit-toggle-btn {
  @apply absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.navigation-widget:hover .edit-toggle-btn {
  opacity: 1;
}

.edit-toggle-btn:hover {
  transform: scale(1.1);
}

/* 编辑模式 */
.nav-editing {
  @apply p-4 rounded-2xl;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.edit-header {
  @apply flex items-center justify-between mb-3;
}

.edit-header h3 {
  @apply font-semibold;
  color: var(--text-primary);
}

.edit-hint {
  @apply text-sm;
  color: var(--text-secondary);
}

.nav-list {
  @apply space-y-2 mb-3;
}

.nav-edit-item {
  @apply flex gap-2 items-center;
}

.nav-drag-handle {
  @apply cursor-grab p-1 rounded flex-shrink-0;
  color: var(--text-secondary);
}

.nav-drag-handle:active {
  cursor: grabbing;
}

.name-input {
  @apply w-24 px-2 py-1 rounded-lg text-sm outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.url-input {
  @apply flex-1 px-2 py-1 rounded-lg text-sm outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.delete-btn {
  @apply w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200;
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.add-btn {
  @apply w-full py-2 rounded-lg font-medium transition-all duration-200 mb-3;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px dashed var(--border-color);
}

.add-btn:hover {
  border-color: var(--accent-color);
  background: var(--glass-bg);
}

.edit-actions {
  @apply flex gap-2 justify-end;
}

.btn-secondary {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  opacity: 0.8;
}

.btn-primary {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.import-btn {
  @apply w-full py-2 rounded-lg font-medium transition-all duration-200 mb-3;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  border: 2px dashed rgba(59, 130, 246, 0.3);
}

.import-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

/* 书签导入面板 */
.bookmark-panel-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  background: rgba(0, 0, 0, 0.5);
}

.bookmark-panel {
  @apply w-full max-w-md p-6 rounded-2xl;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.bookmark-panel .panel-header {
  @apply flex items-center justify-between mb-4;
}

.bookmark-panel .panel-header h3 {
  @apply text-lg font-semibold;
  color: var(--text-primary);
}

.bookmark-panel .close-btn {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.bookmark-panel .close-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.bookmark-list {
  @apply max-h-64 overflow-y-auto space-y-2 mb-4;
}

.loading {
  @apply flex flex-col items-center justify-center py-8 gap-3;
  color: var(--text-secondary);
}

.spinner {
  @apply w-6 h-6 border-2 border-t-transparent rounded-full animate-spin;
  border-color: var(--accent-color);
  border-top-color: transparent;
}

.bookmark-item {
  @apply flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.bookmark-item:hover {
  background: var(--border-color);
}

.bookmark-item.selected {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bookmark-icon {
  @apply text-lg;
}

.bookmark-title {
  @apply flex-1 text-sm truncate;
}

.check-icon {
  @apply w-5 h-5 rounded-full flex items-center justify-center text-xs;
  background: var(--accent-color);
  color: white;
}

.no-bookmarks {
  @apply text-center py-8;
  color: var(--text-secondary);
}

.panel-footer {
  @apply flex items-center justify-between pt-4;
  border-top: 1px solid var(--border-color);
}

.selected-count {
  @apply text-sm;
  color: var(--text-secondary);
}

.footer-actions {
  @apply flex gap-2;
}
</style>
