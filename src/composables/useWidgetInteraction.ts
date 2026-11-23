import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'
import type { Widget } from '@/types'
import { useLayoutStore } from '@/stores/layout'
import { gridMetrics, moveRect, resizeRect, canPlace } from '@/utils/layoutGeometry'
import type { Rect, ResizeDirection } from '@/utils/layoutGeometry'

export function useWidgetInteraction(container: Ref<HTMLElement | undefined>) {
  const store = useLayoutStore()
  const preview = ref<{ id: string; rect: Rect; valid: boolean } | null>(null)
  let gesture: {
    widget: Widget; direction?: ResizeDirection; x: number; y: number;
    pointerId: number; handle: HTMLElement; columnStep: number; rowStep: number
  } | null = null
  let lastPointer: PointerEvent | null = null

  function start(event: PointerEvent, widget: Widget, direction?: ResizeDirection) {
    if (!store.isEditing || store.isSaving || gesture || !container.value || event.button !== 0) return
    event.preventDefault(); event.stopPropagation()
    const style = getComputedStyle(container.value)
    const width = container.value.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const metrics = gridMetrics(width, store.layout)
    // 捕获在稳定的画布上，避免控件更新或 DOM 排序使把手丢失捕获。
    const handle = container.value
    store.selectedId = widget.id
    const bounds = container.value.getBoundingClientRect()
    gesture = { widget: { ...widget }, direction, x: event.clientX - bounds.left,
      y: event.clientY - bounds.top, pointerId: event.pointerId, handle, ...metrics }
    lastPointer = event
    preview.value = { id: widget.id, rect: { ...widget }, valid: true }
    store.interactionActive = true
    handle.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId || !container.value) return
    lastPointer = event
    const bounds = container.value.getBoundingClientRect()
    const dx = Math.round((event.clientX - bounds.left - gesture.x) / gesture.columnStep)
    const dy = Math.round((event.clientY - bounds.top - gesture.y) / gesture.rowStep)
    const rect = gesture.direction
      ? resizeRect(gesture.widget, gesture.direction, dx, dy, store.layout.gridCols)
      : moveRect(gesture.widget, dx, dy, store.layout.gridCols)
    preview.value = { id: gesture.widget.id, rect, valid: canPlace(rect, gesture.widget.id, store.layout) }
  }
  function cancel() {
    const previous = gesture
    gesture = null; lastPointer = null; preview.value = null; store.interactionActive = false
    if (previous?.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId)
  }
  function end(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointerId) return
    move(event)
    const result = preview.value
    cancel()
    if (result) store.applyRect(result.id, result.rect)
  }
  function pointerCancel(event: PointerEvent) {
    if (gesture?.pointerId === event.pointerId) cancel()
  }
  function escape(event: KeyboardEvent) {
    if (gesture && event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); cancel()
    }
  }
  function scroll() { if (lastPointer) move(lastPointer) }
  function keyboard(event: KeyboardEvent, widget: Widget) {
    if (!store.isEditing || store.isSaving || store.interactionActive) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    if ((event.target as HTMLElement).matches('input, select, textarea')) return
    event.preventDefault(); event.stopPropagation()
    const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    const rect = event.shiftKey ? resizeRect(widget, 'se', dx, dy, store.layout.gridCols)
      : moveRect(widget, dx, dy, store.layout.gridCols)
    store.applyRect(widget.id, rect)
  }
  watch(() => store.isEditing, editing => { if (!editing) cancel() })
  onMounted(() => {
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', pointerCancel)
    window.addEventListener('lostpointercapture', pointerCancel)
    window.addEventListener('blur', cancel)
    window.addEventListener('resize', cancel)
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('keydown', escape, true)
  })
  onBeforeUnmount(() => {
    cancel()
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', pointerCancel)
    window.removeEventListener('lostpointercapture', pointerCancel)
    window.removeEventListener('blur', cancel)
    window.removeEventListener('resize', cancel)
    window.removeEventListener('scroll', scroll, true)
    window.removeEventListener('keydown', escape, true)
  })
  return { preview, start, keyboard, cancel }
}
