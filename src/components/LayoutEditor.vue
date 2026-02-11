<template>
  <div class="layout-editor" v-if="layoutStore.isEditing">
    <!-- 遮罩层 -->
    <div class="editor-overlay" @click="cancelEdit"></div>
    
    <div class="editor-panel">
      <div class="editor-header">
        <h3>编辑布局</h3>
        <div class="editor-actions">
          <button class="btn-close" @click="cancelEdit" title="关闭 (ESC)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="editor-content">
        <div class="widgets-panel">
          <div class="panel-title">组件列表（点击切换显示/隐藏）</div>
          <div class="widget-list">
            <div
              v-for="widget in layoutStore.layout.widgets"
              :key="widget.id"
              :class="['widget-item', { visible: widget.visible }]"
              @click="toggleWidget(widget.id)"
            >
              <span class="widget-icon">{{ getWidgetIcon(widget.type) }}</span>
              <span class="widget-name">{{ widget.title }}</span>
              <span class="toggle-indicator">{{ widget.visible ? '显示' : '隐藏' }}</span>
            </div>
          </div>
        </div>

        <div class="opacity-panel">
          <div class="panel-title">组件透明度</div>
          <div class="opacity-control">
            <span class="opacity-label">透明</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              :value="layoutStore.layout.widgetOpacity ?? 0.85"
              @input="(e) => layoutStore.updateWidgetOpacity(parseFloat((e.target as HTMLInputElement).value))"
              class="opacity-slider"
            />
            <span class="opacity-label">不透明</span>
          </div>
          <div class="opacity-value">{{ Math.round((layoutStore.layout.widgetOpacity ?? 0.85) * 100) }}%</div>
        </div>

        <div class="editor-tip">
          <p>💡 提示：</p>
          <ul>
            <li>拖动组件左上角把手可调整位置</li>
            <li>拖动组件右下角可调整大小</li>
            <li>按 ESC 键可快速退出编辑</li>
          </ul>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn-secondary" @click="resetLayout">
          重置布局
        </button>
        <button class="btn-primary" @click="saveLayout">
          保存布局
        </button>
      </div>
    </div>
  </div>

  <!-- 壁纸设置面板 -->
  <div v-if="showWallpaperSettings" class="wallpaper-settings-panel" @click.self="showWallpaperSettings = false">
    <div class="wallpaper-panel">
      <div class="panel-header">
        <h3>壁纸设置</h3>
        <button class="btn-close" @click="showWallpaperSettings = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="panel-content">
        <div class="setting-section">
          <div class="section-title">本地上传</div>
          <input
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="file-input"
            id="wallpaper-file"
          />
          <label for="wallpaper-file" class="upload-btn">
            选择图片文件
          </label>
        </div>

        <div class="setting-section">
          <div class="section-title">网络图片</div>
          <div class="url-input-group">
            <input
              v-model="wallpaperUrlInput"
              type="text"
              placeholder="输入图片URL地址..."
              class="url-input"
              @keydown.enter="setWallpaperFromUrl"
            />
            <button class="btn-apply" @click="setWallpaperFromUrl">应用</button>
          </div>
        </div>

        <div class="setting-section">
          <div class="section-title">预设壁纸</div>
          <button 
            :class="['bing-btn', { active: settingsStore.settings.wallpaperType === 'bing' }]"
            @click="useBingWallpaper"
          >
            <span class="bing-icon">🖼️</span>
            <span>使用 Bing 每日一图</span>
          </button>
        </div>

        <div v-if="settingsStore.currentWallpaper" class="current-wallpaper">
          <div class="section-title">当前壁纸</div>
          <img :src="settingsStore.currentWallpaper" alt="当前壁纸" />
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import { useSettingsStore } from '@/stores/settings'

const layoutStore = useLayoutStore()
const settingsStore = useSettingsStore()

// 壁纸设置相关
const showWallpaperSettings = ref(false)
const wallpaperUrlInput = ref('')

function getWidgetIcon(type: string): string {
  const icons: Record<string, string> = {
    search: '🔍',
    github: '🐙',
    zhihu: '💡',
    v2ex: '💬',
    navigation: '🔗'
  }
  return icons[type] || '📦'
}

function toggleWidget(id: string) {
  layoutStore.toggleWidgetVisibility(id)
}

function saveLayout() {
  layoutStore.stopEditing()
}

function cancelEdit() {
  // 直接退出编辑模式，不保存更改
  layoutStore.isEditing = false
}

function resetLayout() {
  if (confirm('确定要重置布局吗？所有自定义布局设置将恢复默认值。')) {
    layoutStore.resetLayout()
  }
}

// ESC 键退出编辑模式
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showWallpaperSettings.value) {
      showWallpaperSettings.value = false
    } else if (layoutStore.isEditing) {
      cancelEdit()
    }
  }
}

// 壁纸设置功能
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        settingsStore.setCustomWallpaper(dataUrl)
        showWallpaperSettings.value = false
      }
    }
    reader.readAsDataURL(file)
  }
  if (target) {
    target.value = ''
  }
}

function setWallpaperFromUrl() {
  if (wallpaperUrlInput.value.trim()) {
    settingsStore.setCustomWallpaper(wallpaperUrlInput.value.trim())
    wallpaperUrlInput.value = ''
    showWallpaperSettings.value = false
  }
}

function useBingWallpaper() {
  settingsStore.setWallpaperType('bing')
  showWallpaperSettings.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.layout-editor {
  @apply fixed inset-0 z-50 flex items-end justify-center pb-4;
}

.editor-overlay {
  @apply absolute inset-0;
  background: rgba(0,0,0,0.3);
}

.editor-panel {
  @apply relative w-full max-w-4xl mx-4 p-4 rounded-2xl;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-header {
  @apply flex items-center justify-between mb-4;
}

.editor-header h3 {
  @apply text-lg font-semibold;
  color: var(--text-primary);
}

.editor-actions {
  @apply flex gap-2;
}

.btn-close {
  @apply p-2 rounded-lg transition-all duration-200;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.btn-close:hover {
  color: var(--text-primary);
  background: var(--border-color);
}

.editor-content {
  @apply mb-4;
}

.widgets-panel {
  @apply mb-4;
}

.panel-title {
  @apply text-sm font-medium mb-2;
  color: var(--text-secondary);
}

.widget-list {
  @apply flex flex-wrap gap-2;
}

.widget-item {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.widget-item.visible {
  background: var(--accent-color);
  color: white;
}

.widget-icon {
  @apply text-lg;
}

.widget-name {
  @apply text-sm;
}

.toggle-indicator {
  @apply ml-2 text-xs;
}

.editor-tip {
  @apply text-xs p-3 rounded-lg;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.editor-tip p {
  @apply font-medium mb-1;
  color: var(--text-primary);
}

.editor-tip ul {
  @apply list-disc list-inside space-y-1;
}

.opacity-panel {
  @apply mb-4 p-4 rounded-xl;
  background: var(--bg-secondary);
}

.opacity-control {
  @apply flex items-center gap-3;
}

.opacity-label {
  @apply text-xs whitespace-nowrap;
  color: var(--text-secondary);
}

.opacity-slider {
  @apply flex-1 h-2 rounded-lg appearance-none cursor-pointer;
  background: var(--border-color);
}

.opacity-slider::-webkit-slider-thumb {
  @apply w-4 h-4 rounded-full appearance-none;
  background: var(--accent-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.opacity-slider::-moz-range-thumb {
  @apply w-4 h-4 rounded-full border-0;
  background: var(--accent-color);
  cursor: pointer;
}

.opacity-value {
  @apply text-center text-sm font-medium mt-2;
  color: var(--text-primary);
}

.editor-footer {
  @apply flex items-center justify-end gap-2;
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

/* 壁纸设置面板 */
.wallpaper-settings-panel {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  background: rgba(0,0,0,0.5);
}

.wallpaper-panel {
  @apply w-full max-w-md p-6 rounded-2xl;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.panel-header {
  @apply flex items-center justify-between mb-6;
}

.panel-header h3 {
  @apply text-xl font-semibold;
  color: var(--text-primary);
}

.setting-section {
  @apply mb-5;
}

.section-title {
  @apply text-sm font-medium mb-2;
  color: var(--text-secondary);
}

.file-input {
  display: none;
}

.upload-btn {
  @apply w-full py-3 px-4 rounded-xl font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-2;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px dashed var(--border-color);
}

.upload-btn:hover {
  border-color: var(--accent-color);
  background: var(--glass-bg);
}

.url-input-group {
  @apply flex gap-2;
}

.url-input {
  @apply flex-1 px-4 py-2 rounded-xl outline-none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.url-input:focus {
  border-color: var(--accent-color);
}

.btn-apply {
  @apply px-4 py-2 rounded-xl font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.btn-apply:hover {
  opacity: 0.9;
}

.bing-btn {
  @apply w-full py-3 px-4 rounded-xl font-medium cursor-pointer transition-all duration-200 flex items-center gap-3;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid transparent;
}

.bing-btn:hover {
  background: var(--glass-bg);
  border-color: var(--accent-color);
}

.bing-btn.active {
  background: var(--accent-color);
  color: white;
}

.bing-icon {
  @apply text-xl;
}

.current-wallpaper {
  @apply mt-6 pt-6;
  border-top: 1px solid var(--border-color);
}

.current-wallpaper img {
  @apply w-full h-40 object-cover rounded-xl;
}
</style>