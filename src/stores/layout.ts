import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutConfig } from '@/types'
import { storage } from '@/utils/storage'

const DEFAULT_LAYOUT: LayoutConfig = {
  widgets: [
    { id: 'poetry', type: 'poetry', title: '每日诗词', x: 0, y: 0, w: 3, h: 4, visible: true },
    { id: 'clockWeather', type: 'clockWeather', title: '时钟天气', x: 3, y: 0, w: 6, h: 4, visible: true },
    { id: 'search', type: 'search', title: '搜索', x: 2, y: 4, w: 8, h: 5, visible: true },
    { id: 'navigation', type: 'navigation', title: '快速导航', x: 2, y: 9, w: 8, h: 3, visible: true },
    { id: 'github', type: 'github', title: 'GitHub趋势', x: 0, y: 12, w: 4, h: 8, visible: true },
    { id: 'zhihu', type: 'zhihu', title: '知乎热榜', x: 4, y: 12, w: 4, h: 8, visible: true },
    { id: 'v2ex', type: 'v2ex', title: 'V2EX热议', x: 8, y: 12, w: 4, h: 8, visible: true },
    { id: 'xueqiu', type: 'xueqiu', title: '雪球热榜', x: 0, y: 20, w: 6, h: 10, visible: true }
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
  // 每个组件的独立透明度配置
  const widgetOpacities = ref<Record<string, number>>({})

  const visibleWidgets = computed(() => 
    layout.value.widgets.filter(w => w.visible)
  )

  const gridWidth = computed(() => 
    (containerWidth.value - (layout.value.gridCols - 1) * layout.value.gap) / layout.value.gridCols
  )

  async function loadLayout() {
    const saved = await storage.getLayout()

    console.log('从 storage 加载的布局:', saved)

    // 如果没有保存的布局，使用默认布局
    if (!saved || !saved.widgets || saved.widgets.length === 0) {
      console.log('没有保存的布局，使用默认布局')
      layout.value = JSON.parse(JSON.stringify(DEFAULT_LAYOUT))
      return
    }

    // 使用保存的 widgets 完全替换默认 widgets
    // 只保留默认布局中存在且保存布局中也存在的组件
    const defaultWidgetIds = new Set(DEFAULT_LAYOUT.widgets.map(w => w.id))
    const validSavedWidgets = saved.widgets.filter(w => defaultWidgetIds.has(w.id))

    // 检查是否有新组件在默认布局中但不在保存的布局中
    const savedWidgetIds = new Set(validSavedWidgets.map(w => w.id))
    const mergedWidgets = [...validSavedWidgets]
    DEFAULT_LAYOUT.widgets.forEach(defaultWidget => {
      if (!savedWidgetIds.has(defaultWidget.id)) {
        mergedWidgets.push({ ...defaultWidget })
      }
    })

    layout.value = {
      gridCols: saved.gridCols ?? DEFAULT_LAYOUT.gridCols,
      gridRowHeight: saved.gridRowHeight ?? DEFAULT_LAYOUT.gridRowHeight,
      gap: saved.gap ?? DEFAULT_LAYOUT.gap,
      widgetOpacity: saved.widgetOpacity ?? DEFAULT_LAYOUT.widgetOpacity,
      widgets: mergedWidgets
    }

    // 加载保存的透明度配置
    if (saved?.widgetOpacities) {
      widgetOpacities.value = saved.widgetOpacities
    }

    console.log('布局加载完成，组件数:', layout.value.widgets.length)
    console.log('可见组件:', layout.value.widgets.filter(w => w.visible).map(w => ({id: w.id, x: w.x, y: w.y, w: w.w, h: w.h})))
  }

  async function saveLayout() {
    const dataToSave = {
      ...layout.value,
      widgetOpacities: widgetOpacities.value
    }
    console.log('[LayoutStore] 保存布局, widgets:', JSON.stringify(dataToSave.widgets.map(w => ({id: w.id, x: w.x, y: w.y, w: w.w, h: w.h}))))
    await storage.setLayout(dataToSave)
    console.log('[LayoutStore] 布局已保存')
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

  function setWidgetOpacity(id: string, opacity: number) {
    widgetOpacities.value[id] = opacity
  }

  function getWidgetOpacity(id: string): number {
    return widgetOpacities.value[id] ?? layout.value.widgetOpacity ?? 0.85
  }

  function updateWidgetOrder(newWidgets: typeof layout.value.widgets) {
    layout.value.widgets = newWidgets
  }

  return {
    layout,
    isEditing,
    containerWidth,
    widgetOpacities,
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
    updateWidgetOpacity,
    setWidgetOpacity,
    getWidgetOpacity,
    updateWidgetOrder
  }
})