<template>
  <section class="grid-item" :class="{ editing, selected, moving }" :data-id="widget.id" :data-type="widget.type"
    :tabindex="editing ? 0 : undefined" :aria-label="editing ? widget.title + '，方向键移动，Shift 加方向键缩放' : undefined"
    @pointerdown="editing && emit('select')" @focusin="editing && emit('select')" @keydown="emit('keyboard', $event)">
    <div class="widget-wrapper" :class="['search', 'poetry', 'clockWeather'].includes(widget.type) ? 'widget-transparent' : 'widget-container'">
      <div v-if="editing && selected" class="frame-controls">
        <button class="drag-handle" :disabled="disabled" :aria-label="'移动' + widget.title" title="拖动移动；方向键微调"
          @pointerdown="emit('start', $event)" @keydown="emit('keyboard', $event)">⠿ {{ widget.title }}</button>
        <span>{{ widget.w }} × {{ widget.h }}</span>
      </div>
      <div class="widget-content" :class="{ editing }" :inert="editing || undefined"><slot /></div>
      <template v-if="editing && selected">
        <button v-for="direction in directions" :key="direction" :class="['resize-handle', 'resize-' + direction]"
          :aria-label="'调整' + widget.title + '大小：' + direction" :disabled="disabled" tabindex="-1"
          @pointerdown="emit('start', $event, direction)" />
      </template>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Widget } from '@/types'
import type { ResizeDirection } from '@/utils/layoutGeometry'
defineProps<{ widget: Widget; editing: boolean; selected: boolean; moving: boolean; disabled: boolean }>()
const emit = defineEmits<{
  select: []; start: [event: PointerEvent, direction?: ResizeDirection]; keyboard: [event: KeyboardEvent]
}>()
const directions: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
</script>
<style scoped>
.grid-item { position: relative; min-width: 0; border-radius: 20px; }
.widget-wrapper { position: relative; height: 100%; display: flex; flex-direction: column; border-radius: inherit; }
.widget-container { isolation: isolate; background: transparent; border: 1px solid var(--glass-border); backdrop-filter: blur(var(--widget-blur, 24px)) saturate(0.85); box-shadow: 0 8px 28px rgba(15,23,42,.07); }
.widget-container::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--card-bg, var(--glass-bg)); opacity: var(--widget-opacity, .85); }
.widget-content { flex: 1; min-height: 0; }
.widget-content.editing { pointer-events: none; user-select: none; }
.grid-item.editing :deep(.clock-weather-widget) { min-height: 0; }
.grid-item.editing { outline: 1px dashed var(--border-color); outline-offset: 3px; }
.grid-item.selected { outline: 2px solid var(--accent-color); z-index: 2; }
.grid-item.moving { outline-style: dashed; }
.frame-controls { position: absolute; top: 6px; left: 6px; right: 6px; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 8px; pointer-events: none; color: var(--text-secondary); font-size: 11px; }
.frame-controls span { background: var(--bg-primary); padding: 4px 6px; border-radius: 6px; }
.drag-handle { pointer-events: auto; touch-action: none; cursor: grab; padding: 5px 9px; border-radius: 7px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 12px; opacity: 1; }
.drag-handle:active { cursor: grabbing; }
.resize-handle { position: absolute; z-index: 6; touch-action: none; background: var(--accent-color); border-radius: 3px; }
.resize-n, .resize-s { left: calc(50% - 16px); width: 32px; height: 6px; cursor: ns-resize; }
.resize-n { top: -3px; } .resize-s { bottom: -3px; }
.resize-e, .resize-w { top: calc(50% - 16px); width: 6px; height: 32px; cursor: ew-resize; }
.resize-e { right: -3px; } .resize-w { left: -3px; }
.resize-ne, .resize-nw, .resize-se, .resize-sw { width: 10px; height: 10px; border: 2px solid var(--bg-primary); }
.resize-ne, .resize-nw { top: -5px; } .resize-se, .resize-sw { bottom: -5px; }
.resize-ne, .resize-se { right: -5px; } .resize-nw, .resize-sw { left: -5px; }
.resize-ne, .resize-sw { cursor: nesw-resize; } .resize-nw, .resize-se { cursor: nwse-resize; }
</style>
