<template>
  <aside v-if="store.isEditing" class="layout-inspector" aria-label="组件布局设置">
    <fieldset :disabled="store.isSaving || store.interactionActive">
      <div class="inspector-heading"><strong>{{ store.selectedWidget?.title || '布局设置' }}</strong><button @click="store.selectedId = null" v-if="store.selectedWidget" aria-label="取消选择组件">×</button></div>
      <p class="inspector-hint">选中组件后拖动把手；方向键移动，Shift + 方向键缩放。</p>
      <label class="setting-row">默认背景不透明度 <output>{{ percent(store.layout.widgetOpacity ?? .85) }}%</output></label>
      <input aria-label="默认背景不透明度" type="range" min=".1" max="1" step=".05" :value="store.layout.widgetOpacity"
        @pointerdown="store.beginChange()" @input="globalOpacity" @change="store.endChange()" @blur="store.endChange()" />
      <template v-if="store.selectedWidget">
        <label class="inherit-row"><input type="checkbox" :checked="!hasOverride" @change="toggleInheritance" /> 跟随全局不透明度</label>
        <label class="setting-row">当前组件 <output>{{ percent(store.getWidgetOpacity(store.selectedWidget.id)) }}%</output></label>
        <input aria-label="当前组件背景不透明度" type="range" min=".1" max="1" step=".05"
          :value="store.getWidgetOpacity(store.selectedWidget.id)" @pointerdown="store.beginChange()"
          @input="widgetOpacity" @change="store.endChange()" @blur="store.endChange()" />
      </template>
      <label class="setting-row">背景模糊 <output>{{ store.layout.backgroundBlur ?? 24 }}px</output></label>
      <input aria-label="背景模糊" type="range" min="0" max="40" step="2" :value="store.layout.backgroundBlur ?? 24"
        @pointerdown="store.beginChange()" @input="blur" @change="store.endChange()" @blur="store.endChange()" />
      <details><summary>显示 / 隐藏组件</summary><div class="widget-options">
        <label v-for="widget in store.layout.widgets" :key="widget.id"><input type="checkbox" :checked="widget.visible" @change="store.toggleWidgetVisibility(widget.id)" />{{ widget.title }}</label>
      </div></details>
      <button class="reset-layout" @click="store.resetLayout()">恢复默认布局和不透明度</button>
    </fieldset>
  </aside>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
const store = useLayoutStore()
const hasOverride = computed(() => store.selectedId !== null && Object.prototype.hasOwnProperty.call(store.widgetOpacities, store.selectedId))
const percent = (value: number) => Math.round(value * 100)
const value = (event: Event) => Number((event.target as HTMLInputElement).value)
function globalOpacity(event: Event) { store.beginChange(); store.updateWidgetOpacity(value(event)) }
function widgetOpacity(event: Event) {
  if (store.selectedId) { store.beginChange(); store.setWidgetOpacity(store.selectedId, value(event)) }
}
function blur(event: Event) { store.beginChange(); store.setBackgroundBlur(value(event)) }
function toggleInheritance(event: Event) {
  if (!store.selectedId) return
  if ((event.target as HTMLInputElement).checked) store.clearWidgetOpacity(store.selectedId)
  else store.setWidgetOpacity(store.selectedId, store.getWidgetOpacity(store.selectedId))
}
</script>
<style scoped>
.layout-inspector { position: fixed; left: 20px; bottom: 20px; z-index: 60; width: 288px; max-height: 55vh; overflow-y: auto; padding: 16px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); box-shadow: 0 8px 32px rgba(15,23,42,.16); font-size: 12px; }
fieldset { padding: 0; min-width: 0; } .inspector-heading { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
.inspector-heading button { font-size: 20px; line-height: 1; padding: 0 4px; }
.inspector-hint { margin: 8px 0 12px; color: var(--text-secondary); line-height: 1.6; }
.setting-row { display: flex; justify-content: space-between; margin-top: 10px; } output { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
input[type="range"] { width: 100%; margin: 8px 0; accent-color: var(--accent-color); touch-action: pan-x; }
.inherit-row { display: flex; gap: 6px; margin-top: 8px; align-items: center; } input[type="checkbox"] { accent-color: var(--accent-color); }
summary { cursor: pointer; margin-top: 12px; } .widget-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 12px; } .widget-options label { display: flex; gap: 5px; align-items: center; }
.reset-layout { margin-top: 16px; color: var(--text-secondary); text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 600px) { .layout-inspector { left: 12px; right: 12px; bottom: 12px; width: auto; max-height: 38vh; } }
</style>
