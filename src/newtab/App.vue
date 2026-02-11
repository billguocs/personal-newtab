<template>
  <div class="new-tab-page">
    <Wallpaper />
    
    <div class="main-content">
      <ClockWeather v-if="settingsStore.settings.showClock" />
      
      <!-- 只有在布局加载完成后才渲染 GridLayout -->
      <GridLayout v-if="layoutStore.visibleWidgets.length > 0" />
      
      <!-- 如果没有可见组件，显示提示 -->
      <div v-else-if="isLoaded" class="no-widgets-hint">
        <p>暂无可见组件</p>
        <button @click="layoutStore.resetLayout()">恢复默认布局</button>
      </div>
    </div>
    
    <LayoutEditor ref="layoutEditorRef" />
    
    <!-- 右侧按钮组 -->
    <div v-if="!layoutStore.isEditing" class="right-actions">
      <!-- 壁纸设置按钮 -->
      <button 
        class="action-btn"
        @click="showWallpaperSettings = true"
        title="壁纸设置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        <span>壁纸设置</span>
      </button>
      
      <!-- 编辑布局按钮 -->
      <button 
        class="action-btn"
        @click="layoutStore.startEditing()"
        title="编辑布局"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="12" r="1"/>
          <circle cx="9" cy="5" r="1"/>
          <circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <circle cx="15" cy="5" r="1"/>
          <circle cx="15" cy="19" r="1"/>
        </svg>
        <span>编辑布局</span>
      </button>
    </div>
    
    <!-- 壁纸设置面板 -->
    <div v-if="showWallpaperSettings" class="wallpaper-settings-overlay" @click.self="showWallpaperSettings = false">
      <div class="wallpaper-settings-panel">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useLayoutStore } from '@/stores/layout'
import { useHotListStore } from '@/stores/hotlist'
import Wallpaper from '@/components/Wallpaper.vue'
import ClockWeather from '@/components/ClockWeather.vue'
import GridLayout from '@/components/GridLayout.vue'
import LayoutEditor from '@/components/LayoutEditor.vue'


const settingsStore = useSettingsStore()
const layoutStore = useLayoutStore()
const hotlistStore = useHotListStore()

const isLoaded = ref(false)

// 壁纸设置
const showWallpaperSettings = ref(false)
const wallpaperUrlInput = ref('')

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

// 监听暗色模式变化并应用到 html 元素
watch(() => settingsStore.isDark, (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

onMounted(async () => {
  // 先加载布局，确保 GridLayout 组件能正确渲染
  await layoutStore.loadLayout()
  await settingsStore.loadSettings()
  await hotlistStore.loadAll()
  isLoaded.value = true
  
  // 调试信息
  console.log('布局加载完成:', layoutStore.layout)
  console.log('可见组件数:', layoutStore.visibleWidgets.length)
  console.log('组件列表:', layoutStore.visibleWidgets)
})
</script>

<style scoped>
.new-tab-page {
  min-height: 100vh;
  position: relative;
  /* 不设置背景色，让 Wallpaper 组件处理背景 */
  color: var(--text-primary, #1a1a1a);
}

.main-content {
  position: relative;
  z-index: 10;
  padding: 2rem 1rem;
}

.no-widgets-hint {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
}

.no-widgets-hint p {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.no-widgets-hint button {
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.no-widgets-hint button:hover {
  opacity: 0.9;
}

/* 右侧按钮组 */
.right-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 40;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 壁纸设置面板 */
.wallpaper-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.wallpaper-settings-panel {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-close {
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.file-input {
  display: none;
}

.upload-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px dashed var(--border-color);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.upload-btn:hover {
  border-color: var(--accent-color);
  background: rgba(255, 255, 255, 0.5);
}

.url-input-group {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.url-input:focus {
  border-color: var(--accent-color);
}

.btn-apply {
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--accent-color);
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-apply:hover {
  opacity: 0.9;
}

.bing-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.bing-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: var(--accent-color);
}

.bing-btn.active {
  background: var(--accent-color);
  color: white;
}

.bing-icon {
  font-size: 1.25rem;
}

.current-wallpaper {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.current-wallpaper img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
}
</style>