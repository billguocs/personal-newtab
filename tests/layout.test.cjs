const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { createPinia, setActivePinia } = require('pinia')
const { isProxy } = require('vue')

// 使用项目已有的 TypeScript 编译器加载纯逻辑，无额外测试依赖。
function loader(overrides = {}) {
  const cache = new Map()
  function load(filename) {
    filename = path.resolve(filename)
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
    }).outputText
    const localRequire = specifier => {
      if (overrides[specifier]) return overrides[specifier]
      if (specifier.startsWith('@/')) return load(path.join('src', specifier.slice(2)) + '.ts')
      if (specifier.startsWith('.')) return load(path.resolve(path.dirname(filename), specifier) + '.ts')
      return require(specifier)
    }
    new Function('require', 'module', 'exports', source)(localRequire, module, module.exports)
    return module.exports
  }
  return load
}
const load = loader()
const geometry = load('src/utils/layoutGeometry.ts')
const { DEFAULT_LAYOUT } = load('src/utils/layoutDefaults.ts')
const clone = value => JSON.parse(JSON.stringify(value))
function setup(saved = DEFAULT_LAYOUT) {
  const writes = []
  let fail = false
  const storage = { getLayout: async () => clone(saved), setLayout: async value => {
    if (fail) throw new Error('quota')
    assert.equal(isProxy(value), false)
    writes.push(clone(value))
  } }
  setActivePinia(createPinia())
  const store = loader({ '@/utils/storage': { storage } })('src/stores/layout.ts').useLayoutStore()
  return { store, writes, rejectWrites: value => { fail = value } }
}

test('非默认 gap 的坐标、列步长及跨行高度保持一致', () => {
  const layout = { ...DEFAULT_LAYOUT, gap: 24, gridRowHeight: 40 }
  const metrics = geometry.gridMetrics(1176, layout)
  assert.equal(metrics.column, 76)
  assert.equal(metrics.columnStep, 100)
  assert.equal(metrics.rowStep, 64)
  assert.equal(geometry.gridRect({ x: 2, y: 1, w: 3, h: 4 }, layout).height, '232px')
})

test('八向缩放不越界，并固定对侧边缘；移动受容器边界限制', () => {
  const widget = { id: 'a', type: 'github', x: 4, y: 5, w: 4, h: 6, visible: true }
  for (const direction of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    for (const delta of [-100, -3, 0, 3, 100]) {
      const rect = geometry.resizeRect(widget, direction, delta, delta, 12)
      assert.ok(rect.x >= 0 && rect.y >= 0 && rect.w >= 3 && rect.h >= 4 && rect.x + rect.w <= 12)
      if (direction.includes('w')) assert.equal(rect.x + rect.w, widget.x + widget.w)
      if (direction.includes('n')) assert.equal(rect.y + rect.h, widget.y + widget.h)
    }
  }
  assert.deepEqual(geometry.moveRect(widget, 100, -100, 12), { ...widget, x: 8, y: 0 })
})

test('允许紧贴，不允许相交；隐藏组件不阻塞落点', () => {
  const layout = { ...DEFAULT_LAYOUT, widgets: [{ id: 'b', x: 4, y: 0, w: 4, h: 4, visible: true }] }
  assert.equal(geometry.canPlace({ x: 0, y: 0, w: 4, h: 4 }, 'a', layout), true)
  assert.equal(geometry.canPlace({ x: 1, y: 0, w: 4, h: 4 }, 'a', layout), false)
  layout.widgets[0].visible = false
  assert.equal(geometry.canPlace({ x: 1, y: 0, w: 4, h: 4 }, 'a', layout), true)
})

test('旧坐标、独立不透明度兼容；非法数值归一化', () => {
  const saved = clone(DEFAULT_LAYOUT)
  saved.widgets[0].y = 42
  saved.widgetOpacities = { poetry: 0.1, github: NaN, missing: 0.5 }
  saved.backgroundBlur = 80
  const normalized = geometry.normalizeLayout(saved)
  assert.equal(normalized.widgets[0].y, 42)
  assert.deepEqual(normalized.widgetOpacities, { poetry: 0.1 })
  assert.equal(normalized.backgroundBlur, 40)
  assert.equal(geometry.normalizeOpacity(Infinity), 0.85)
})

test('真实存储读取兼容旧数字键数组格式', async () => {
  const previous = global.chrome
  const original = clone(DEFAULT_LAYOUT)
  const widgets = Object.fromEntries(original.widgets.map((widget, index) => [index, widget]))
  global.chrome = { storage: { sync: { get: async () => ({ layout: { ...original, widgets, widgetOpacities: { poetry: 0.1 } } }) } } }
  try {
    const actual = await loader()('src/utils/storage.ts').storage.getLayout()
    assert.equal(Array.isArray(actual.widgets), true)
    assert.deepEqual(actual.widgets, original.widgets)
    assert.equal(geometry.normalizeLayout(actual).widgetOpacities.poetry, 0.1)
  } finally { global.chrome = previous }
})

test('编辑草稿不写存储；取消完整还原；碰撞拒绝应用', async () => {
  const { store, writes } = setup()
  await store.loadLayout()
  const before = clone(store.layout)
  store.startEditing()
  const moved = geometry.moveRect(store.layout.widgets[0], 9, 0, 12)
  assert.equal(store.applyRect('poetry', moved), true)
  store.undo()
  assert.equal(store.applyRect('poetry', { x: 0, y: 30, w: 3, h: 4 }), true)
  store.setWidgetOpacity('poetry', 0.1)
  store.setBackgroundBlur(8)
  assert.equal(store.applyRect('poetry', { x: 3, y: 0, w: 3, h: 4 }), false)
  assert.equal(writes.length, 0)
  store.cancelEditing()
  assert.deepEqual(clone(store.layout), before)
})

test('滑块一轮交互只生成一次撤销，重做分支正确截断', async () => {
  const { store } = setup()
  await store.loadLayout(); store.startEditing()
  store.beginChange()
  for (const value of [0.2, 0.3, 0.4]) store.setWidgetOpacity('poetry', value)
  store.endChange()
  assert.equal(store.canUndo, true)
  store.undo()
  assert.equal(store.getWidgetOpacity('poetry'), 0.85)
  assert.equal(store.canUndo, false)
  store.redo()
  assert.equal(store.getWidgetOpacity('poetry'), 0.4)
  store.undo(); store.setBackgroundBlur(10)
  assert.equal(store.canRedo, false)
})

test('保存失败保留草稿，可重试；成功只写一次普通快照', async () => {
  const { store, writes, rejectWrites } = setup()
  await store.loadLayout(); store.startEditing(); store.setWidgetOpacity('github', 0.1)
  rejectWrites(true)
  assert.equal(await store.stopEditing(), false)
  assert.equal(store.isEditing, true)
  assert.ok(store.saveError)
  assert.equal(store.getWidgetOpacity('github'), 0.1)
  rejectWrites(false)
  assert.equal(await store.stopEditing(), true)
  assert.equal(store.isEditing, false)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].widgetOpacities.github, 0.1)
})

test('跟随全局、隐藏/恢复、重置均支持撤销且未保存前不写入', async () => {
  const { store, writes } = setup()
  await store.loadLayout(); store.startEditing()
  store.setWidgetOpacity('poetry', 0.1)
  store.updateWidgetOpacity(0.5)
  assert.equal(store.getWidgetOpacity('poetry'), 0.1)
  store.clearWidgetOpacity('poetry')
  assert.equal(store.getWidgetOpacity('poetry'), 0.5)
  store.undo(); assert.equal(store.getWidgetOpacity('poetry'), 0.1)
  store.toggleWidgetVisibility('poetry')
  assert.equal(store.visibleWidgets.some(w => w.id === 'poetry'), false)
  store.undo(); assert.equal(store.visibleWidgets.some(w => w.id === 'poetry'), true)
  store.resetLayout()
  assert.deepEqual(clone(store.widgetOpacities), {})
  store.undo(); assert.equal(store.getWidgetOpacity('poetry'), 0.1)
  assert.equal(writes.length, 0)
})

test('重复保存请求被阻止，保存期间不能丢弃或修改草稿', async () => {
  let complete, count = 0
  setActivePinia(createPinia())
  const storage = { getLayout: async () => clone(DEFAULT_LAYOUT), setLayout: () => { count++; return new Promise(resolve => { complete = resolve }) } }
  const store = loader({ '@/utils/storage': { storage } })('src/stores/layout.ts').useLayoutStore()
  await store.loadLayout(); store.startEditing()
  const saving = store.stopEditing()
  assert.equal(await store.stopEditing(), false)
  store.cancelEditing(); store.updateWidgetOpacity(0.1)
  assert.equal(store.isEditing, true)
  assert.equal(store.layout.widgetOpacity, 0.85)
  assert.equal(count, 1)
  complete(); await saving
  assert.equal(store.isEditing, false)
})
