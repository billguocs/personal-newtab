<template>
  <div class="wallpaper-container">
    <div 
      class="wallpaper-bg"
      :style="backgroundStyle"
    ></div>
    <div class="wallpaper-overlay"></div>
    
    <button 
      class="wallpaper-settings-btn"
      @click.stop="showSettings = !showSettings"
      title="壁纸设置"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>

    <!-- 遮罩层 -->
    <div 
      v-if="showSettings" 
      class="settings-overlay"
      @click="showSettings = false"
    ></div>

    <div v-if="showSettings" class="wallpaper-settings">
      <div class="settings-header">
        <div class="settings-title">壁纸设置</div>
        <button class="close-btn" @click="showSettings = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="settings-options">
        <label class="radio-label">
          <input 
            type="radio" 
            v-model="settingsStore.settings.wallpaperType" 
            value="bing"
            @change="onTypeChange"
          />
          <span>Bing每日一图</span>
        </label>
        
        <label class="radio-label">
          <input 
            type="radio" 
            v-model="settingsStore.settings.wallpaperType" 
            value="custom"
            @change="onTypeChange"
          />
          <span>自定义壁纸</span>
        </label>
      </div>

      <div v-if="settingsStore.settings.wallpaperType === 'custom'" class="upload-section">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          class="hidden"
        />
        <button class="upload-btn" @click="fileInput?.click()">
          上传图片
        </button>
        <div v-if="settingsStore.customWallpaperData" class="image-preview">
          <img :src="settingsStore.customWallpaperData" alt="自定义壁纸预览" />
          <button class="remove-btn" @click="removeCustomWallpaper">删除</button>
        </div>
      </div>

      <div v-if="settingsStore.bingWallpaper" class="bing-info">
        <p>{{ settingsStore.bingWallpaper.title }}</p>
        <small>{{ settingsStore.bingWallpaper.copyright }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const showSettings = ref(false)
const fileInput = ref<HTMLInputElement>()

const backgroundStyle = computed(() => {
  const url = settingsStore.currentWallpaper
  if (url && url.trim() !== '') {
    return {
      backgroundImage: `url("${url}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#1a1a1a'
    }
  }
  // 默认渐变背景
  return {
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})

function onTypeChange() {
  settingsStore.setWallpaperType(settingsStore.settings.wallpaperType)
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        settingsStore.setCustomWallpaper(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }
  // 清空 input 以便可以再次选择同一文件
  if (target) {
    target.value = ''
  }
}

function removeCustomWallpaper() {
  if (confirm('确定要删除自定义壁纸吗？')) {
    settingsStore.setWallpaperType('bing')
  }
}

// ESC 键关闭设置面板
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showSettings.value) {
    showSettings.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.wallpaper-container {
  @apply fixed inset-0 -z-10;
}

.wallpaper-bg {
  @apply absolute inset-0 bg-cover bg-center bg-no-repeat;
  transition: all 0.5s ease;
}

.wallpaper-overlay {
  @apply absolute inset-0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
}

.wallpaper-settings-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 12px;
  border-radius: 9999px;
  transition: all 0.2s;
  z-index: 50;
  cursor: pointer;
  background: rgba(59, 130, 246, 0.95);
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.wallpaper-settings-btn:hover {
  background: rgb(59, 130, 246);
  transform: scale(1.1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
}

.wallpaper-settings-btn:active {
  transform: scale(0.95);
}

.settings-overlay {
  @apply fixed inset-0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
}

.wallpaper-settings {
  @apply fixed top-20 right-4 p-5 rounded-2xl w-80;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 100;
}

.settings-header {
  @apply flex items-center justify-between mb-4;
}

.settings-title {
  @apply text-lg font-semibold;
  color: var(--text-primary);
}

.close-btn {
  @apply p-1 rounded-lg transition-all duration-200;
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.settings-options {
  @apply space-y-2 mb-4;
}

.radio-label {
  @apply flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all duration-200;
  color: var(--text-primary);
}

.radio-label:hover {
  background: var(--bg-secondary);
}

.radio-label input {
  @apply w-4 h-4;
  accent-color: var(--accent-color);
}

.upload-btn {
  @apply w-full py-2 rounded-lg font-medium transition-all duration-200;
  background: var(--accent-color);
  color: white;
}

.upload-btn:hover {
  @apply opacity-90;
}

.image-preview {
  @apply mt-3 relative;
}

.image-preview img {
  @apply w-full h-32 object-cover rounded-lg;
}

.remove-btn {
  @apply absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200;
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 1);
}

.bing-info {
  @apply mt-4 pt-4 border-t;
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.bing-info p {
  @apply font-medium mb-1;
  color: var(--text-primary);
}

.hidden {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>