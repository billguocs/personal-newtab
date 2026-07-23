<template>
  <div
    ref="gridContainer"
    class="grid-layout"
    :style="gridStyle"
  >
    <!-- 调试网格线 -->
    <div v-if="layoutStore.isEditing" class="grid-debug-lines">
      <div
        v-for="row in totalRows"
        :key="row"
        class="grid-row-line"
        :style="{ gridRow: row }"
      >
        <span class="row-label">{{ row - 1 }}</span>
      </div>
    </div>
    <div
      v-for="widget in layoutStore.visibleWidgets"
      :key="widget.id"
      :class="['grid-item', { editing: layoutStore.isEditing, dragging: draggingId === widget.id, 'is-search': widget.type === 'search' }]"
      :style="getItemStyle(widget)"
      :data-id="widget.id"
      :data-type="widget.type"
    >
      <div :class="widget.type === 'search' ? 'widget-wrapper widget-transparent' : 'widget-wrapper widget-container'">
        <div 
          v-if="layoutStore.isEditing" 
          class="drag-handle"
          @mousedown="startDrag($event, widget)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="12" r="1"/>
            <circle cx="9" cy="5" r="1"/>
            <circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="12" r="1"/>
            <circle cx="15" cy="5" r="1"/>
            <circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
        
        <!-- 透明度设置按钮 -->
        <div
          v-if="layoutStore.isEditing"
          class="opacity-btn"
          @click.stop="toggleOpacitySlider(widget.id)"
          title="调整透明度"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
        </div>

        <!-- 透明度滑块 -->
        <div
          v-if="layoutStore.isEditing && showOpacitySlider === widget.id"
          class="opacity-slider-panel"
          @mousedown.stop
          @click.stop
        >
          <div class="opacity-label">透明度: {{ Math.round(getWidgetOpacity(widget.id) * 100) }}%</div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            :value="getWidgetOpacity(widget.id)"
            @input="(e) => setWidgetOpacity(widget.id, parseFloat((e.target as HTMLInputElement).value))"
            class="opacity-slider"
          />
        </div>

        <div class="widget-content" :class="{ 'editing': layoutStore.isEditing }">
          <component :is="getWidgetComponent(widget.type)" />
        </div>
        
        <!-- 四边调整大小把手 -->
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-n"
          @mousedown="startResize($event, widget, 'n')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-s"
          @mousedown="startResize($event, widget, 's')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-w"
          @mousedown="startResize($event, widget, 'w')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-e"
          @mousedown="startResize($event, widget, 'e')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-nw"
          @mousedown="startResize($event, widget, 'nw')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-ne"
          @mousedown="startResize($event, widget, 'ne')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-sw"
          @mousedown="startResize($event, widget, 'sw')"
        ></div>
        <div
          v-if="layoutStore.isEditing"
          class="resize-handle resize-handle-se"
          @mousedown="startResize($event, widget, 'se')"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import type { Widget } from '@/types'

const SearchBox = defineAsyncComponent(() => import('./SearchBox.vue'))
const GitHubTrending = defineAsyncComponent(() => import('./GitHubTrending.vue'))
const ZhihuHot = defineAsyncComponent(() => import('./ZhihuHot.vue'))
const V2exHot = defineAsyncComponent(() => import('./V2exHot.vue'))
const Navigation = defineAsyncComponent(() => import('./Navigation.vue'))
const Poetry = defineAsyncComponent(() => import('./Poetry.vue'))
const ClockWeather = defineAsyncComponent(() => import('./ClockWeather.vue'))
const XueqiuHot = defineAsyncComponent(() => import('./XueqiuHot.vue'))

const layoutStore = useLayoutStore()
const gridContainer = ref<HTMLElement>()

let isDragging = false
let isResizing = false
let draggingId = ref<string | null>(null)
let dragWidget: Widget | null = null
let resizeWidget: Widget | null = null
let resizeDirection = ref<string>('se')
let startX = 0
let startY = 0
let startCol = 0
let startRow = 0
let startW = 0
let startH = 0

const widgetOpacity = computed(() => layoutStore.layout.widgetOpacity ?? 0.85)
const showOpacitySlider = ref<string | null>(null)

function getWidgetOpacity(id: string): number {
  return layoutStore.getWidgetOpacity(id)
}

function setWidgetOpacity(id: string, opacity: number) {
  layoutStore.setWidgetOpacity(id, opacity)
}

function toggleOpacitySlider(id: string) {
  showOpacitySlider.value = showOpacitySlider.value === id ? null : id
}

// 计算总行数用于调试显示
const totalRows = computed(() => {
  const maxY = Math.max(...layoutStore.visibleWidgets.map(w => w.y + w.h))
  return maxY + 2 // 多显示一行
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${layoutStore.layout.gridCols}, 1fr)`,
  gap: `16px`,
  padding: `24px 32px`,
  '--widget-opacity': widgetOpacity.value
} as any))

function getWidgetComponent(type: string) {
  const components: Record<string, any> = {
    search: SearchBox,
    github: GitHubTrending,
    zhihu: ZhihuHot,
    v2ex: V2exHot,
    navigation: Navigation,
    poetry: Poetry,
    clockWeather: ClockWeather,
    xueqiu: XueqiuHot
  }
  return components[type] || 'div'
}

function getItemStyle(widget: Widget) {
  const rowHeight = layoutStore.layout.gridRowHeight
  const opacity = layoutStore.isEditing ? getWidgetOpacity(widget.id) : layoutStore.getWidgetOpacity(widget.id)

  return {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
    minHeight: `${widget.h * rowHeight}px`,
    maxHeight: `${widget.h * rowHeight}px`,
    '--widget-opacity': opacity
  } as any
}

function startDrag(e: MouseEvent, widget: Widget) {
  if (!layoutStore.isEditing) return
  
  isDragging = true
  draggingId.value = widget.id
  dragWidget = widget
  startX = e.clientX
  startY = e.clientY
  startCol = widget.x
  startRow = widget.y
  
  e.preventDefault()
  e.stopPropagation()
}

function startResize(e: MouseEvent, widget: Widget, direction: string) {
  if (!layoutStore.isEditing) return

  isResizing = true
  resizeWidget = widget
  resizeDirection.value = direction
  startX = e.clientX
  startY = e.clientY
  startW = widget.w
  startH = widget.h
  startCol = widget.x
  startRow = widget.y

  e.preventDefault()
  e.stopPropagation()
}

function onMouseMove(e: MouseEvent) {
  if (!layoutStore.isEditing) return
  
  if (isDragging && dragWidget && gridContainer.value) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    
    const colWidth = gridContainer.value.offsetWidth / layoutStore.layout.gridCols
    const rowHeight = layoutStore.layout.gridRowHeight + layoutStore.layout.gap
    
    const newCol = Math.max(0, Math.min(layoutStore.layout.gridCols - dragWidget.w, startCol + Math.round(dx / colWidth)))
    const newRow = Math.max(0, startRow + Math.round(dy / rowHeight))
    
    if (newCol !== dragWidget.x || newRow !== dragWidget.y) {
      layoutStore.updateWidgetPosition(dragWidget.id, newCol, newRow)
    }
  }
  
  if (isResizing && resizeWidget && gridContainer.value) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    const colWidth = gridContainer.value.offsetWidth / layoutStore.layout.gridCols
    const rowHeight = layoutStore.layout.gridRowHeight + layoutStore.layout.gap

    const dir = resizeDirection.value
    let newW = startW
    let newH = startH
    let newX = startCol
    let newY = startRow

    // 处理水平方向调整
    if (dir.includes('e')) {
      newW = Math.max(2, Math.min(layoutStore.layout.gridCols - startCol, startW + Math.round(dx / colWidth)))
    } else if (dir.includes('w')) {
      const deltaW = Math.round(dx / colWidth)
      newW = Math.max(2, startW - deltaW)
      if (newW !== startW) {
        newX = Math.max(0, startCol + deltaW)
      }
    }

    // 处理垂直方向调整
    if (dir.includes('s')) {
      newH = Math.max(2, startH + Math.round(dy / rowHeight))
    } else if (dir.includes('n')) {
      const deltaH = Math.round(dy / rowHeight)
      newH = Math.max(2, startH - deltaH)
      if (newH !== startH) {
        newY = Math.max(0, startRow + deltaH)
      }
    }

    // 应用尺寸变化
    if (newW !== resizeWidget.w || newH !== resizeWidget.h) {
      layoutStore.updateWidgetSize(resizeWidget.id, newW, newH)
    }
    // 应用位置变化（当调整北边或西边时）
    if (newX !== resizeWidget.x || newY !== resizeWidget.y) {
      layoutStore.updateWidgetPosition(resizeWidget.id, newX, newY)
    }
  }
}

function onMouseUp() {
  let changed = false
  if (isDragging) {
    isDragging = false
    draggingId.value = null
    dragWidget = null
    changed = true
  }
  if (isResizing) {
    isResizing = false
    resizeWidget = null
    changed = true
  }
  // 拖拽或缩放完成后自动保存
  if (changed) {
    layoutStore.saveLayout()
  }
}

onMounted(() => {
  console.log('GridLayout mounted, widgets:', layoutStore.visibleWidgets.length)
  
  if (gridContainer.value) {
    layoutStore.setContainerWidth(gridContainer.value.offsetWidth)
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        layoutStore.setContainerWidth(entry.contentRect.width)
      }
    })
    
    resizeObserver.observe(gridContainer.value)
  }
  
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.grid-layout {
  @apply w-full;
  min-height: calc(100vh - 200px);
  padding: 24px 32px;
  gap: 16px;
}

.grid-item {
  @apply relative;
  transition: all 0.2s ease;
  background: transparent;
  border-radius: 16px;
}

.grid-item.editing {
  @apply ring-2 ring-blue-400 ring-opacity-70;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  animation: editingPulse 2s infinite;
}

@keyframes editingPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
}

.grid-item.dragging {
  @apply opacity-70 scale-95;
}

.widget-wrapper {
  @apply h-full flex flex-col;
  position: relative;
  border-radius: 16px;
}

.widget-transparent {
  background: transparent;
}

.widget-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  opacity: var(--widget-opacity, 0.85);
  position: relative;
}

.widget-content {
  flex: 1;
  min-height: 0;
}

.widget-content.editing {
  pointer-events: none;
}

/* 透明度按钮 */
.opacity-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 20;
}

.grid-item.editing:hover .opacity-btn {
  opacity: 1;
}

.opacity-btn:hover {
  background: var(--accent-color);
  color: white;
}

/* 透明度滑块面板 */
.opacity-slider-panel {
  position: absolute;
  top: 42px;
  right: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 30;
  min-width: 150px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.opacity-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-align: center;
}

.opacity-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  appearance: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.drag-handle {
  @apply absolute top-2 left-2 p-1 rounded cursor-move z-10;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
}

.grid-item.editing:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: var(--accent-color);
  color: white;
}

.resize-handle {
  @apply absolute z-10;
  opacity: 0;
  transition: opacity 0.2s;
}

.grid-item.editing:hover .resize-handle {
  opacity: 0.6;
}

.resize-handle:hover {
  opacity: 1 !important;
}

/* 四边调整把手 */
.resize-handle-n {
  @apply top-0 left-4 right-4 h-2 cursor-n-resize;
  background: var(--accent-color);
  border-radius: 2px;
}

.resize-handle-s {
  @apply bottom-0 left-4 right-4 h-2 cursor-s-resize;
  background: var(--accent-color);
  border-radius: 2px;
}

.resize-handle-w {
  @apply left-0 top-4 bottom-4 w-2 cursor-w-resize;
  background: var(--accent-color);
  border-radius: 2px;
}

.resize-handle-e {
  @apply right-0 top-4 bottom-4 w-2 cursor-e-resize;
  background: var(--accent-color);
  border-radius: 2px;
}

/* 四角调整把手 */
.resize-handle-nw {
  @apply top-0 left-0 w-4 h-4 cursor-nw-resize;
  background: var(--accent-color);
  border-radius: 16px 0 0 0;
}

.resize-handle-ne {
  @apply top-0 right-0 w-4 h-4 cursor-ne-resize;
  background: var(--accent-color);
  border-radius: 0 16px 0 0;
}

.resize-handle-sw {
  @apply bottom-0 left-0 w-4 h-4 cursor-sw-resize;
  background: var(--accent-color);
  border-radius: 0 0 0 16px;
}

.resize-handle-se {
  @apply bottom-0 right-0 w-4 h-4 cursor-se-resize;
  background: var(--accent-color);
  border-radius: 0 0 16px 0;
}

/* 调试网格线 */
.grid-debug-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 0;
}

.grid-row-line {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
  border-top: 1px dashed rgba(59, 130, 246, 0.3);
}

.row-label {
  font-size: 10px;
  color: rgba(59, 130, 246, 0.6);
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>