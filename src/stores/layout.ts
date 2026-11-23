import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutConfig } from '@/types'
import { storage } from '@/utils/storage'
import { DEFAULT_LAYOUT } from '@/utils/layoutDefaults'
import { normalizeLayout, normalizeOpacity, canPlace, clamp, resolvePlacement } from '@/utils/layoutGeometry'
import type { Rect } from '@/utils/layoutGeometry'

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const same = (a: LayoutConfig, b: LayoutConfig) => JSON.stringify(a) === JSON.stringify(b)

export const useLayoutStore = defineStore('layout', () => {
  const committed = ref<LayoutConfig>(normalizeLayout(DEFAULT_LAYOUT))
  const draft = ref<LayoutConfig | null>(null)
  const layout = computed(() => draft.value ?? committed.value)
  const isEditing = computed(() => draft.value !== null)
  const isSaving = ref(false)
  const saveError = ref('')
  const selectedId = ref<string | null>(null)
  const interactionActive = ref(false)
  const feedback = ref('')
  const past = ref<LayoutConfig[]>([])
  const future = ref<LayoutConfig[]>([])
  let transaction: LayoutConfig | null = null
  const canUndo = computed(() => past.value.length > 0 && !interactionActive.value && !isSaving.value)
  const canRedo = computed(() => future.value.length > 0 && !interactionActive.value && !isSaving.value)
  const visibleWidgets = computed(() => layout.value.widgets.filter(widget => widget.visible))
  const selectedWidget = computed(() => layout.value.widgets.find(widget => widget.id === selectedId.value))
  const widgetOpacities = computed(() => layout.value.widgetOpacities ?? {})

  async function loadLayout() {
    committed.value = normalizeLayout(await storage.getLayout())
  }
  function startEditing() {
    if (isEditing.value) return
    draft.value = copy(committed.value)
    selectedId.value = visibleWidgets.value[0]?.id ?? null
    past.value = []; future.value = []; saveError.value = ''; feedback.value = ''
  }
  function beginChange() {
    if (draft.value && !isSaving.value && !transaction) transaction = copy(draft.value)
  }
  function endChange() {
    if (transaction && draft.value && !same(transaction, draft.value)) {
      past.value = [...past.value.slice(-49), transaction]
      future.value = []
      saveError.value = ''
    }
    transaction = null
  }
  function change(fn: (target: LayoutConfig) => void) {
    if (!draft.value || isSaving.value) return
    const ownTransaction = !transaction
    beginChange(); fn(draft.value)
    if (ownTransaction) endChange()
  }
  function undo() {
    if (!canUndo.value || !draft.value) return
    endChange()
    future.value.push(copy(draft.value))
    draft.value = past.value.pop()!
    feedback.value = ''; saveError.value = ''
  }
  function redo() {
    if (!canRedo.value || !draft.value) return
    endChange()
    past.value.push(copy(draft.value))
    draft.value = future.value.pop()!
    feedback.value = ''; saveError.value = ''
  }
  async function stopEditing() {
    if (!draft.value || isSaving.value || interactionActive.value) return false
    endChange()
    const snapshot = copy(draft.value)
    isSaving.value = true; saveError.value = ''
    try {
      await storage.setLayout(snapshot)
      committed.value = snapshot
      draft.value = null
      selectedId.value = null
      past.value = []; future.value = []
      return true
    } catch {
      saveError.value = '保存失败，编辑内容已保留，请重试'
      return false
    } finally { isSaving.value = false }
  }
  function cancelEditing() {
    if (isSaving.value) return
    draft.value = null; transaction = null; selectedId.value = null
    past.value = []; future.value = []; saveError.value = ''; feedback.value = ''
  }
  function applyRect(id: string, rect: Rect) {
    if (!draft.value || isSaving.value) return false
    const widgets = resolvePlacement(rect, id, layout.value)
    if (!widgets) { feedback.value = '此位置超出网格边界或小于组件最小尺寸'; return false }
    change(target => { target.widgets = widgets })
    feedback.value = ''
    return true
  }
  function toggleWidgetVisibility(id: string) {
    change(target => {
      const widget = target.widgets.find(item => item.id === id)
      if (!widget) return
      if (!widget.visible && !canPlace(widget, id, target)) {
        widget.y = Math.max(0, ...target.widgets.filter(item => item.visible).map(item => item.y + item.h))
      }
      widget.visible = !widget.visible
      if (!widget.visible && selectedId.value === id) selectedId.value = null
    })
  }
  function resetLayout() {
    if (!isEditing.value) startEditing()
    change(target => Object.assign(target, normalizeLayout(DEFAULT_LAYOUT)))
    selectedId.value = visibleWidgets.value[0]?.id ?? null
  }
  function updateWidgetOpacity(value: number) {
    change(target => { target.widgetOpacity = normalizeOpacity(value) })
  }
  function setWidgetOpacity(id: string, value: number) {
    change(target => { (target.widgetOpacities ??= {})[id] = normalizeOpacity(value) })
  }
  function clearWidgetOpacity(id: string) {
    change(target => { delete target.widgetOpacities?.[id] })
  }
  function getWidgetOpacity(id: string) {
    return widgetOpacities.value[id] ?? layout.value.widgetOpacity ?? 0.85
  }
  function setBackgroundBlur(value: number) {
    change(target => { target.backgroundBlur = clamp(value, 0, 40) })
  }
  return { layout, isEditing, isSaving, saveError, selectedId, selectedWidget, interactionActive,
    feedback, canUndo, canRedo, visibleWidgets, widgetOpacities, loadLayout, startEditing,
    stopEditing, cancelEditing, beginChange, endChange, undo, redo, applyRect,
    toggleWidgetVisibility, resetLayout, updateWidgetOpacity, setWidgetOpacity, clearWidgetOpacity,
    getWidgetOpacity, setBackgroundBlur }
})
