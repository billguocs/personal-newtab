import type { LayoutConfig, Widget } from '@/types'
import { DEFAULT_LAYOUT } from './layoutDefaults'

export type Rect = Pick<Widget, 'x' | 'y' | 'w' | 'h'>
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
export const MIN_SIZE: Record<Widget['type'], { w: number; h: number }> = {
  search: { w: 4, h: 3 }, navigation: { w: 3, h: 2 }, poetry: { w: 2, h: 3 },
  clockWeather: { w: 4, h: 3 }, github: { w: 3, h: 4 }, zhihu: { w: 3, h: 4 },
  v2ex: { w: 3, h: 4 }, xueqiu: { w: 5, h: 4 }
}
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
function finite(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
export function normalizeOpacity(value: unknown, fallback = 0.85) {
  return clamp(finite(value, fallback), 0.1, 1)
}
export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
export function canPlace(rect: Rect, id: string, layout: LayoutConfig) {
  return rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0 &&
    rect.x + rect.w <= layout.gridCols &&
    !layout.widgets.some(widget => widget.visible && widget.id !== id && overlaps(rect, widget))
}
// 当前组件固定在目标位置，其余组件按原来的行列顺序向下避让。
// 每次都从原布局计算，避免指针来回移动时把组件越推越远。
export function resolvePlacement(rect: Rect, id: string, layout: LayoutConfig): Widget[] | null {
  const active = layout.widgets.find(widget => widget.id === id)
  if (!active || ![rect.x, rect.y, rect.w, rect.h].every(Number.isSafeInteger) ||
    rect.x < 0 || rect.y < 0 || rect.w < MIN_SIZE[active.type].w ||
    rect.h < MIN_SIZE[active.type].h || rect.x + rect.w > layout.gridCols) return null
  const widgets = layout.widgets.map(widget => ({ ...widget }))
  const moved = widgets.find(widget => widget.id === id)!
  Object.assign(moved, { x: rect.x, y: rect.y, w: rect.w, h: rect.h })
  if (!moved.visible || ['x', 'y', 'w', 'h'].every(key => active[key as keyof Rect] === rect[key as keyof Rect])) return widgets
  const placed: Widget[] = [moved]
  const others = widgets.filter(widget => widget.visible && widget.id !== id)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
  for (const widget of others) {
    let blockers = placed.filter(other => overlaps(widget, other))
    while (blockers.length) {
      widget.y = Math.max(...blockers.map(other => other.y + other.h))
      blockers = placed.filter(other => overlaps(widget, other))
    }
    placed.push(widget)
  }
  return widgets
}
export function gridMetrics(contentWidth: number, layout: LayoutConfig) {
  const column = Math.max(1, (contentWidth - (layout.gridCols - 1) * layout.gap) / layout.gridCols)
  return { column, columnStep: column + layout.gap, rowStep: layout.gridRowHeight + layout.gap }
}
export function gridRect(rect: Rect, layout: LayoutConfig) {
  return {
    gridColumn: `${rect.x + 1} / span ${rect.w}`, gridRow: `${rect.y + 1} / span ${rect.h}`,
    height: `${rect.h * layout.gridRowHeight + (rect.h - 1) * layout.gap}px`
  }
}
export function moveRect(start: Rect, dx: number, dy: number, cols: number): Rect {
  return { ...start, x: clamp(start.x + dx, 0, cols - start.w), y: Math.max(0, start.y + dy) }
}
export function resizeRect(start: Widget, direction: ResizeDirection, dx: number, dy: number, cols: number): Rect {
  const min = MIN_SIZE[start.type]
  let { x, y, w, h } = start
  if (direction.includes('w')) {
    x = clamp(start.x + dx, 0, start.x + start.w - min.w)
    w = start.x + start.w - x
  } else if (direction.includes('e')) w = clamp(start.w + dx, min.w, cols - start.x)
  if (direction.includes('n')) {
    y = clamp(start.y + dy, 0, start.y + start.h - min.h)
    h = start.y + start.h - y
  } else if (direction.includes('s')) h = Math.max(min.h, start.h + dy)
  return { x, y, w, h }
}

// 只修复非法字段；旧布局的有效坐标和自定义不透明度继续保留。
export function normalizeLayout(raw: Partial<LayoutConfig> | null): LayoutConfig {
  const gridCols = clamp(Math.round(finite(raw?.gridCols, 12)), 6, 24)
  const saved = Array.isArray(raw?.widgets) ? raw.widgets : []
  const widgets = DEFAULT_LAYOUT.widgets.map(defaultWidget => {
    const old = saved.find(widget => widget && widget.id === defaultWidget.id)
    const min = MIN_SIZE[defaultWidget.type]
    const w = clamp(Math.round(finite(old?.w, defaultWidget.w)), min.w, gridCols)
    const h = Math.max(min.h, Math.round(finite(old?.h, defaultWidget.h)))
    return { ...defaultWidget, w, h,
      x: clamp(Math.round(finite(old?.x, defaultWidget.x)), 0, gridCols - w),
      y: Math.max(0, Math.round(finite(old?.y, defaultWidget.y))),
      visible: typeof old?.visible === 'boolean' ? old.visible : defaultWidget.visible }
  })
  const widgetOpacities: Record<string, number> = {}
  for (const widget of widgets) {
    const value = raw?.widgetOpacities?.[widget.id]
    if (typeof value === 'number' && Number.isFinite(value)) widgetOpacities[widget.id] = normalizeOpacity(value)
  }
  return { widgets, gridCols,
    gridRowHeight: clamp(finite(raw?.gridRowHeight, 45), 20, 100),
    gap: clamp(finite(raw?.gap, 16), 0, 48),
    widgetOpacity: normalizeOpacity(raw?.widgetOpacity), widgetOpacities,
    backgroundBlur: clamp(finite(raw?.backgroundBlur, 24), 0, 40) }
}
