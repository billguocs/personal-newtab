<template>
  <div v-if="show" class="theme-selector-overlay" @click.self="handleOverlayClick">
    <div class="theme-panel">
      <div class="panel-header">
        <h3>主题设置</h3>
        <button class="btn-close" @click="cancelAndClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- 加载状态 -->
        <div v-if="themeStore.isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>正在分析壁纸颜色...</span>
        </div>

        <!-- 主题列表 -->
        <div v-else-if="themeStore.hasThemes" class="themes-section">
          <div class="section-title">推荐主题（点击预览）</div>
          <div class="theme-list">
            <div
              v-for="theme in themeStore.extractedThemes"
              :key="theme.id"
              :class="['theme-card', { active: themeStore.activeTheme?.id === theme.id, previewing: themeStore.previewTheme?.id === theme.id }]"
              @click="previewTheme(theme)"
            >
              <div class="theme-preview" :style="getThemePreviewStyle(theme)">
                <span class="preview-text">Aa</span>
                <div v-if="themeStore.previewTheme?.id === theme.id" class="preview-badge">预览中</div>
              </div>
              <div class="theme-name">{{ theme.name }}</div>
            </div>
          </div>
        </div>

        <!-- 当前主题微调 -->
        <div v-if="themeStore.activeTheme" class="customize-section">
          <div class="section-title">颜色微调</div>
          <div class="color-controls">
            <div class="color-item">
              <label>主色调</label>
              <input
                type="color"
                :value="themeStore.activeTheme.colors.primary"
                @input="(e) => updateColor('primary', (e.target as HTMLInputElement).value)"
              />
            </div>
            <div class="color-item">
              <label>文字颜色</label>
              <input
                type="color"
                :value="themeStore.activeTheme.colors.text"
                @input="(e) => updateColor('text', (e.target as HTMLInputElement).value)"
              />
            </div>
            <div class="color-item">
              <label>背景透明度</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                :value="getBackgroundAlpha()"
                @input="(e) => updateBackgroundAlpha(parseFloat((e.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button class="btn-secondary" @click="cancelAndClose">取消</button>
          <button class="btn-reset" @click="resetTheme">重置</button>
          <button class="btn-primary" @click="saveAndClose">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import type { Theme } from '@/utils/themeExtractor'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const themeStore = useThemeStore()

function close() {
  emit('close')
}

function previewTheme(theme: Theme) {
  themeStore.preview(theme)
}

function saveAndClose() {
  // 如果有预览的主题，保存它
  if (themeStore.previewTheme) {
    themeStore.applyTheme(themeStore.previewTheme)
  }
  close()
}

function cancelAndClose() {
  // 取消预览，恢复原主题
  themeStore.cancelPreview()
  close()
}

function handleOverlayClick() {
  // 点击遮罩相当于取消
  cancelAndClose()
}

function updateColor(key: string, value: string) {
  themeStore.updateThemeColor(key as keyof Theme['colors'], value)
}

function getThemePreviewStyle(theme: Theme) {
  return {
    background: theme.colors.background,
    borderColor: theme.colors.primary,
    color: theme.colors.text
  }
}

function getBackgroundAlpha(): number {
  const bg = themeStore.activeTheme?.colors.background || 'rgba(255,255,255,0.85)'
  const match = bg.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
  return match ? parseFloat(match[1]) : 0.85
}

function updateBackgroundAlpha(alpha: number) {
  const bg = themeStore.activeTheme?.colors.background || '#ffffff'
  // 提取基础颜色
  const hexMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (hexMatch) {
    const r = hexMatch[1]
    const g = hexMatch[2]
    const b = hexMatch[3]
    const newBg = `rgba(${r}, ${g}, ${b}, ${alpha})`
    themeStore.updateThemeColor('background', newBg)
  }
}

function resetTheme() {
  themeStore.resetTheme()
}
</script>

<style scoped>
.theme-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.theme-panel {
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 20px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.3));
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.btn-close {
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  color: var(--text-secondary, #666);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--border-color, rgba(0, 0, 0, 0.1));
  color: var(--text-primary, #1a1a1a);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: var(--text-secondary, #666);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-top-color: var(--accent-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 12px;
}

.themes-section {
  margin-bottom: 24px;
}

.theme-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.theme-card.active {
  border-color: var(--accent-color, #3b82f6);
}

.theme-card.previewing {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.theme-preview {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid;
  position: relative;
}

.preview-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.preview-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  font-size: 10px;
  background: var(--accent-color, #3b82f6);
  color: white;
  border-radius: 4px;
}

.theme-name {
  padding: 8px;
  font-size: 0.75rem;
  text-align: center;
  color: var(--text-secondary, #666);
  background: var(--bg-secondary, rgba(0, 0, 0, 0.03));
}

.customize-section {
  margin-bottom: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
}

.color-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-item label {
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.color-item input[type="color"] {
  width: 48px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-item input[type="range"] {
  width: 120px;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color, rgba(0, 0, 0, 0.1));
  appearance: none;
}

.color-item input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color, #3b82f6);
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: 10px;
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  color: var(--text-secondary, #666);
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--border-color, rgba(0, 0, 0, 0.1));
  color: var(--text-primary, #1a1a1a);
}

.btn-reset {
  padding: 10px 20px;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.2));
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--bg-secondary, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #1a1a1a);
}

.btn-primary {
  padding: 10px 24px;
  border-radius: 10px;
  background: var(--accent-color, #3b82f6);
  color: white;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
