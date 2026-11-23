<template>
  <div class="layout-viewport" :class="{ 'is-editing': store.isEditing }">
    <div ref="container" class="grid-layout" :class="{ 'editing-grid': store.isEditing }" :style="gridStyle">
      <WidgetFrame v-for="widget in displayedWidgets" :key="widget.id" :widget="widget"
        :editing="store.isEditing" :selected="store.selectedId === widget.id" :moving="preview?.id === widget.id"
        :disabled="store.isSaving" :font-scale="store.getWidgetFontScale(widget.id)" :style="itemStyle(widget)" @select="store.selectedId = widget.id"
        @start="(event, direction) => start(event, widget, direction)" @keyboard="keyboard($event, widget)">
        <component :is="components[widget.type]" />
      </WidgetFrame>
      <div v-if="preview" class="placement-preview" :class="{ invalid: !preview.valid }" :style="gridRect(preview.rect, store.layout)" aria-hidden="true">
        <span>{{ preview.valid ? (displacedCount ? `松开确认，${displacedCount} 个组件自动让位` : '松开确认位置') : '位置无效，松开将还原' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import type { CSSProperties } from 'vue'
import type { Widget } from '@/types'
import { useLayoutStore } from '@/stores/layout'
import { gridRect } from '@/utils/layoutGeometry'
import { useWidgetInteraction } from '@/composables/useWidgetInteraction'
import WidgetFrame from './WidgetFrame.vue'
const components = {
  search: defineAsyncComponent(() => import('./SearchBox.vue')),
  navigation: defineAsyncComponent(() => import('./Navigation.vue')),
  github: defineAsyncComponent(() => import('./GitHubTrending.vue')),
  zhihu: defineAsyncComponent(() => import('./ZhihuHot.vue')),
  v2ex: defineAsyncComponent(() => import('./V2exHot.vue')),
  poetry: defineAsyncComponent(() => import('./Poetry.vue')),
  clock: defineAsyncComponent(() => import('./Clock.vue')),
  weather: defineAsyncComponent(() => import('./WeatherWidget.vue')),
  xueqiu: defineAsyncComponent(() => import('./XueqiuHot.vue'))
}
const store = useLayoutStore()
const container = ref<HTMLElement>()
const { preview, start, keyboard } = useWidgetInteraction(container)
const displayedWidgets = computed(() => (preview.value?.widgets ?? store.layout.widgets).filter(widget => widget.visible))
const displacedCount = computed(() => displayedWidgets.value.filter(widget => {
  const original = store.layout.widgets.find(item => item.id === widget.id)
  return widget.id !== preview.value?.id && original && (widget.x !== original.x || widget.y !== original.y)
}).length)
const gridStyle = computed(() => ({
  gridTemplateColumns: 'repeat(' + store.layout.gridCols + ', minmax(0, 1fr))',
  gridAutoRows: store.layout.gridRowHeight + 'px', gap: store.layout.gap + 'px',
  '--column-step': 'calc((100% + ' + store.layout.gap + 'px) / ' + store.layout.gridCols + ')',
  '--row-step': (store.layout.gridRowHeight + store.layout.gap) + 'px',
  minHeight: store.isEditing ? (Math.max(8, ...displayedWidgets.value.map(w => w.y + w.h), preview.value ? preview.value.rect.y + preview.value.rect.h : 0) + 2) * (store.layout.gridRowHeight + store.layout.gap) + 'px' : undefined
}) as CSSProperties)
function itemStyle(widget: Widget): CSSProperties {
  return { ...gridRect(widget, store.layout), '--widget-opacity': store.getWidgetOpacity(widget.id), '--widget-blur': (store.layout.backgroundBlur ?? 24) + 'px' } as CSSProperties
}
</script>
<style scoped>
.grid-layout { display: grid; position: relative; width: 100%; padding: 24px 32px 100px; align-content: start; }
.editing-grid { padding-top: 100px; padding-bottom: 340px; }
.editing-grid::before { content: ''; position: absolute; inset: 100px 32px 0; pointer-events: none; background-image: linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px); background-size: var(--column-step) var(--row-step); }
.placement-preview { z-index: 10; border: 2px dashed var(--accent-color); border-radius: 20px; background: var(--row-hover); pointer-events: none; display: flex; align-items: center; justify-content: center; color: var(--accent-color); }
.placement-preview span { background: var(--bg-primary); border-radius: 8px; padding: 8px 12px; font-size: 12px; }
.placement-preview.invalid { border-color: #dc2626; background: rgba(220,38,38,.12); color: #dc2626; }
@media (max-width: 900px) {
  .grid-layout:not(.editing-grid) { --standalone-min-height: 230px; display: flex; flex-direction: column; padding: 20px 16px 100px; }
  .grid-layout:not(.editing-grid) :deep(.grid-item) { height: auto !important; }
  .grid-layout:not(.editing-grid) :deep(.grid-item:is([data-type="github"], [data-type="zhihu"], [data-type="v2ex"], [data-type="xueqiu"])) { height: 420px !important; }
  .grid-layout:not(.editing-grid) :deep([data-type="poetry"]) { height: 180px !important; }
  .grid-layout:not(.editing-grid) :deep(.grid-item:is([data-type="clock"], [data-type="weather"])) { min-height: 230px; }
  .layout-viewport.is-editing { overflow-x: auto; }
  .editing-grid { min-width: 900px; }
}
</style>
