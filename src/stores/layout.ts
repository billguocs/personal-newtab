import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutConfig } from '@/types'
import { storage } from '@/utils/storage'

const DEFAULT_LAYOUT: LayoutConfig = {
  widgets: [
    { id: 'search', type: 'search', title: '搜索', x: 2, y: 2, w: 8, h: 5, visible: true },
    { id: 'navigation', type: 'navigation', title: '快速导航', x: 2, y: 8, w: 8, h: 3, visible: true },
    { id: 'github', type: 'github', title: 'GitHub趋势', x: 0, y: 12, w: 4, h: 8, visible: true },
    { id: 'zhihu', type: 'zhihu', title: '知乎热榜', x: 4, y: 12, w: 4, h: 8, visible: true },
    { id: 'v2ex', type: 'v2ex', title: 'V2EX热议', x: 8, y: 12, w: 4, h: 8, visible: true }
  ],
  gridCols: 12,
  gridRowHeight: 45,
  gap: 16,
  widgetOpacity: 0.85
}

export const useLayoutStore = defineStore('layout', () => {
  const layout = ref<LayoutConfig>(DEFAULT_LAYOUT)
  const isEditing = ref(false)
  const containerWidth = ref(1200)

  const visibleWidgets = computed(() => 
    layout.value.widgets.filter(w => w.visible)
  )

  const gridWidth = computed(() => 
    (containerWidth.value - (layout.value.gridCols - 1) * layout.value.gap) / layout.value.gridCols
  )

  async function loadLayout() {
    const saved = await storage.getLayout()
    
    // 智能合并布局：保留用户设置，同时添加新的默认组件
    const mergedWidgets = [...(saved?.widgets || [])]
    
    // 检查并添加默认布局中但用户配置中缺少的组件
    DEFAULT_LAYOUT.widgets.forEach(defaultWidget => {
      const exists = mergedWidgets.some(w => w.id === defaultWidget.id)
      if (!exists) {
        mergedWidgets.push({ ...defaultWidget })
      }
    })
    
    // 更新已有组件的位置和大小，避免重叠（只更新位置相关的属性）
    mergedWidgets.forEach(widget => {
      const defaultWidget = DEFAULT_LAYOUT.widgets.find(w => w.id === widget.id)
      if (defaultWidget) {
        // 如果组件位置与默认布局差异太大，可能是旧布局，需要更新
        const posDiff = Math.abs(widget.y - defaultWidget.y)
        if (posDiff > 5) {
          console.log(`更新 ${widget.id} 位置: y=${widget.y} -> ${defaultWidget.y}`)
          widget.x = defaultWidget.x
          widget.y = defaultWidget.y
          widget.w = defaultWidget.w
          widget.h = defaultWidget.h
        }
      }
    })
    
    layout.value = {
      ...DEFAULT_LAYOUT,
      ...saved,
      widgets: mergedWidgets
    }
    
    console.log('布局加载完成，组件数:', layout.value.widgets.length)
    console.log('可见组件:', layout.value.widgets.filter(w => w.visible).map(w => ({id: w.id, y: w.y, h: w.h})))
  }

  async function saveLayout() {
    await storage.setLayout(layout.value)
  }

  function updateWidgetPosition(id: string, x: number, y: number) {
    const widget = layout.value.widgets.find(w => w.id === id)
    if (widget) {
      widget.x = x
      widget.y = y
    }
  }

  function updateWidgetSize(id: string, w: number, h: number) {
    const widget = layout.value.widgets.find(w => w.id === id)
    if (widget) {
      widget.w = w
      widget.h = h
    }
  }

  function toggleWidgetVisibility(id: string) {
    const widget = layout.value.widgets.find(w => w.id === id)
    if (widget) {
      widget.visible = !widget.visible
    }
  }

  function resetLayout() {
    // 深拷贝默认布局，确保完全重置
    layout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
    saveLayout()
    console.log('布局已重置为默认值:', layout.value.widgets.map(w => ({id: w.id, y: w.y, h: w.h})))
  }

  function startEditing() {
    isEditing.value = true
  }

  function stopEditing() {
    isEditing.value = false
    saveLayout()
  }

  function setContainerWidth(width: number) {
    containerWidth.value = width
  }

  function updateWidgetOpacity(opacity: number) {
    layout.value.widgetOpacity = opacity
  }

  return {
    layout,
    isEditing,
    containerWidth,
    visibleWidgets,
    gridWidth,
    loadLayout,
    saveLayout,
    updateWidgetPosition,
    updateWidgetSize,
    toggleWidgetVisibility,
    resetLayout,
    startEditing,
    stopEditing,
    setContainerWidth,
    updateWidgetOpacity
  }
})