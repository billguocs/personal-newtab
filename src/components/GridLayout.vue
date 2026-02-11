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
      :class="['grid-item', { editing: layoutStore.isEditing, dragging: draggingId === widget.id }]"
      :style="getItemStyle(widget)"
      :data-id="widget.id"
      :data-type="widget.type"
    >
      <div class="widget-wrapper widget-container">
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
        
        <component :is="getWidgetComponent(widget.type)" />
        
        <div 
          v-if="layoutStore.isEditing" 
          class="resize-handle"
          @mousedown="startResize($event, widget)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import type { Widget } from '@/types'
import SearchBox from './SearchBox.vue'
import GitHubTrending from './GitHubTrending.vue'
import ZhihuHot from './ZhihuHot.vue'
import V2exHot from './V2exHot.vue'
import Navigation from './Navigation.vue'

const layoutStore = useLayoutStore()
const gridContainer = ref<HTMLElement>()

let isDragging = false
let isResizing = false
let draggingId = ref<string | null>(null)
let dragWidget: Widget | null = null
let resizeWidget: Widget | null = null
let startX = 0
let startY = 0
let startCol = 0
let startRow = 0
let startW = 0
let startH = 0

const widgetOpacity = computed(() => layoutStore.layout.widgetOpacity ?? 0.85)

// 计算总行数用于调试显示
const totalRows = computed(() => {
  const maxY = Math.max(...layoutStore.visibleWidgets.map(w => w.y + w.h))
  return maxY + 2 // 多显示一行
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${layoutStore.layout.gridCols}, 1fr)`,
  gap: `${layoutStore.layout.gap}px`,
  padding: `${layoutStore.layout.gap}px`,
  '--widget-opacity': widgetOpacity.value
} as any))

function getWidgetComponent(type: string) {
  const components: Record<string, any> = {
    search: SearchBox,
    github: GitHubTrending,
    zhihu: ZhihuHot,
    v2ex: V2exHot,
    navigation: Navigation
  }
  return components[type] || 'div'
}

function getItemStyle(widget: Widget) {
  const rowHeight = layoutStore.layout.gridRowHeight
  
  return {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
    minHeight: `${widget.h * rowHeight}px`
  }
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

function startResize(e: MouseEvent, widget: Widget) {
  if (!layoutStore.isEditing) return
  
  isResizing = true
  resizeWidget = widget
  startX = e.clientX
  startY = e.clientY
  startW = widget.w
  startH = widget.h
  
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
    
    const newW = Math.max(2, Math.min(layoutStore.layout.gridCols - resizeWidget.x, startW + Math.round(dx / colWidth)))
    const newH = Math.max(2, startH + Math.round(dy / rowHeight))
    
    if (newW !== resizeWidget.w || newH !== resizeWidget.h) {
      layoutStore.updateWidgetSize(resizeWidget.id, newW, newH)
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
  @apply w-full max-w-7xl mx-auto;
  min-height: calc(100vh - 200px);
}

.grid-item {
  @apply relative;
  transition: all 0.2s ease;
}

.grid-item.editing {
  @apply ring-2 ring-blue-400 ring-opacity-50;
}

.grid-item.dragging {
  @apply opacity-70 scale-95;
}

.widget-wrapper {
  @apply h-full flex flex-col;
  position: relative;
  opacity: var(--widget-opacity, 0.85);
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
  @apply absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10;
  background: linear-gradient(135deg, transparent 50%, var(--accent-color) 50%);
  border-radius: 0 0 16px 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.grid-item.editing:hover .resize-handle {
  opacity: 0.6;
}

.resize-handle:hover {
  opacity: 1 !important;
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