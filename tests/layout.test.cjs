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
const backup = load('src/utils/configBackup.ts')
const { DEFAULT_LAYOUT } = load('src/utils/layoutDefaults.ts')
const clone = value => JSON.parse(JSON.stringify(value))
test('字号兼容旧布局，过滤无效组件与数值，并限制缩放范围', () => {
  assert.deepEqual(geometry.normalizeLayout(DEFAULT_LAYOUT).widgetFontScales, {})
  const layout = geometry.normalizeLayout({ ...DEFAULT_LAYOUT, widgetFontScales: {
    poetry: 3, github: 0.1, zhihu: NaN, v2ex: '1.5', clock: 1.456, missing: 1.5
  } })
  assert.deepEqual(layout.widgetFontScales, { poetry: 2, clock: 1.46, github: 0.5 })
})

test('字号独立调整，支持撤销、重做、取消、保存、备份迁移和恢复默认', async () => {
  const { store, writes } = setup()
  await store.loadLayout()
  store.startEditing()
  store.beginChange()
  store.setWidgetFontScale('poetry', 1.25)
  store.setWidgetFontScale('poetry', 1.5)
  store.endChange()
  assert.equal(store.getWidgetFontScale('poetry'), 1.5)
  assert.equal(store.getWidgetFontScale('github'), 1)
  assert.equal(writes.length, 0)
  store.undo()
  assert.equal(store.getWidgetFontScale('poetry'), 1)
  store.redo()
  assert.equal(store.getWidgetFontScale('poetry'), 1.5)
  store.cancelEditing()
  assert.equal(store.getWidgetFontScale('poetry'), 1)
  store.startEditing()
  store.setWidgetFontScale('poetry', 1.5)
  assert.equal(await store.stopEditing(), true)
  assert.equal(writes[0].widgetFontScales.poetry, 1.5)
  const restored = backup.parseConfigBackup({ app: 'personal-newtab', version: 1, sync: { layout: writes[0] }, local: {} })
  assert.equal(restored.sync.layout.widgetFontScales.poetry, 1.5)
  const reloaded = setup(restored.sync.layout).store
  await reloaded.loadLayout()
  assert.equal(reloaded.getWidgetFontScale('poetry'), 1.5)
  store.startEditing()
  store.setWidgetFontScale('poetry', 1)
  assert.deepEqual(clone(store.layout.widgetFontScales), {})
  store.undo()
  store.resetLayout()
  assert.equal(store.getWidgetFontScale('poetry'), 1)
})

test('构建时缩放 Tailwind 与固定字号/行高，避免 em 嵌套重复缩放', async () => {
  const postcss = require('postcss')
  const tailwind = require('tailwindcss')
  const { widgetTypography } = loader()('tooling/widgetTypography.ts')
  const css = '.tailwind { @apply text-sm; } .clock { font-size: min(var(--clock-size), 56px); line-height: 1.05; } .colon { font-size: .65em; }'
  const result = await postcss([tailwind({ content: [{ raw: '<div></div>' }], corePlugins: { preflight: false } }), widgetTypography()]).process(css, { from: undefined })
  const values = []
  result.root.walkDecls(decl => values.push([decl.prop, decl.value]))
  assert.ok(values.some(([key, value]) => key === 'font-size' && value === 'calc((0.875rem) * var(--widget-font-scale, 1))'))
  assert.ok(values.some(([key, value]) => key === 'line-height' && value === 'calc((1.25rem) * var(--widget-font-scale, 1))'))
  assert.ok(values.some(([key, value]) => key === 'font-size' && value === 'calc((min(var(--clock-size), 56px)) * var(--widget-font-scale, 1))'))
  assert.ok(values.some(([key, value]) => key === 'font-size' && value === '.65em'))
  assert.ok(values.some(([key, value]) => key === 'line-height' && value === '1.05'))
})
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

test('编辑草稿不写存储；取消完整还原；越界拒绝应用', async () => {
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
  assert.equal(store.applyRect('poetry', { x: -1, y: 0, w: 3, h: 4 }), false)
  assert.equal(writes.length, 0)
  store.cancelEditing()
  assert.deepEqual(clone(store.layout), before)
})

function assertNoOverlap(widgets) {
  const visible = widgets.filter(widget => widget.visible)
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      assert.equal(geometry.overlaps(visible[i], visible[j]), false, `${visible[i].id} / ${visible[j].id}`)
    }
  }
}

function legacyClockLayout(overrides = {}) {
  const raw = clone(DEFAULT_LAYOUT)
  raw.widgets = raw.widgets.filter(w => !['clock', 'weather'].includes(w.id))
  raw.widgets.splice(1, 0, { id: 'clockWeather', type: 'clockWeather', title: '时钟天气', x: 3, y: 0, w: 6, h: 4, visible: true, ...overrides })
  raw.widgetOpacities = { clockWeather: 0.1 }
  raw.widgetFontScales = { clockWeather: 1.5 }
  return raw
}

test('合并时钟天气迁移成左右独立组件，继承外观且重复加载不改变位置', () => {
  const raw = legacyClockLayout({ x: 4, y: 1, w: 7, h: 3 })
  raw.widgets = raw.widgets.filter(w => ['poetry', 'clockWeather'].includes(w.id))
  const result = geometry.normalizeLayout(raw)
  const clock = result.widgets.find(w => w.id === 'clock')
  const weather = result.widgets.find(w => w.id === 'weather')
  assert.deepEqual([clock.x, clock.y, clock.w, clock.h], [4, 1, 3, 3])
  assert.deepEqual([weather.x, weather.y, weather.w, weather.h], [7, 1, 4, 3])
  assert.equal(result.widgets.some(w => w.id === 'clockWeather'), false)
  assert.equal(result.widgetOpacities.clock, 0.1)
  assert.equal(result.widgetOpacities.weather, 0.1)
  assert.equal(result.widgetFontScales.clock, 1.5)
  assert.equal(result.widgetFontScales.weather, 1.5)
  assertNoOverlap(result.widgets)
  assert.deepEqual(geometry.normalizeLayout(result), result)
  assert.equal(raw.widgets[1].id, 'clockWeather')
})

test('狭窄旧组件改为上下排列并自动避让，隐藏状态也能迁移', () => {
  const raw = legacyClockLayout({ w: 4 })
  const result = geometry.normalizeLayout(raw)
  assert.deepEqual(result.widgets.filter(w => ['clock', 'weather'].includes(w.id)).map(w => [w.id, w.x, w.y, w.w, w.h]), [
    ['clock', 3, 0, 4, 4], ['weather', 3, 4, 4, 4]
  ])
  assert.equal(result.widgets.find(w => w.id === 'search').y, 8)
  assertNoOverlap(result.widgets)
  assert.deepEqual(geometry.normalizeLayout(result), result)
  const hidden = geometry.normalizeLayout(legacyClockLayout({ w: 4, visible: false }))
  assert.equal(hidden.widgets.find(w => w.id === 'clock').visible, false)
  assert.equal(hidden.widgets.find(w => w.id === 'weather').visible, false)
  assert.equal(hidden.widgets.find(w => w.id === 'search').y, 4)
})

test('已保存的独立配置优先于旧组件，两个组件的编辑、备份恢复互不干扰', async () => {
  const raw = legacyClockLayout()
  raw.widgets.push({ ...DEFAULT_LAYOUT.widgets.find(w => w.id === 'clock'), x: 9, y: 0, visible: false })
  raw.widgetFontScales.clock = 2
  raw.widgetOpacities.clock = 0.4
  const { store, writes } = setup(raw)
  await store.loadLayout()
  assert.equal(store.layout.widgets.find(w => w.id === 'clock').x, 9)
  assert.equal(store.layout.widgets.find(w => w.id === 'clock').visible, false)
  assert.equal(store.getWidgetFontScale('clock'), 2)
  assert.equal(store.getWidgetFontScale('weather'), 1.5)
  store.startEditing()
  store.setWidgetFontScale('weather', 0.75)
  store.setWidgetOpacity('weather', 0.2)
  store.toggleWidgetVisibility('weather')
  await store.stopEditing()
  assert.equal(writes[0].widgetFontScales.clock, 2)
  assert.equal(writes[0].widgetOpacities.clock, 0.4)
  const imported = backup.parseConfigBackup({ app: 'personal-newtab', version: 1, sync: { layout: writes[0] }, local: {} })
  assert.equal(imported.sync.layout.widgetFontScales.weather, 0.75)
  assert.equal(imported.sync.layout.widgetOpacities.weather, 0.2)
  assert.equal(imported.sync.layout.widgets.find(w => w.id === 'weather').visible, false)
  const migratedBackup = backup.parseConfigBackup({ app: 'personal-newtab', version: 1, sync: { layout: legacyClockLayout() }, local: {} })
  assert.equal(migratedBackup.sync.layout.widgetFontScales.weather, 1.5)
})

test('移动顶层组件时连锁向下避让，保留列、尺寸和无关组件', () => {
  const widget = (id, x, y, w = 4, visible = true) => ({ id, type: 'poetry', x, y, w, h: 4, visible })
  const layout = { ...DEFAULT_LAYOUT, widgets: [widget('active', 0, 0), widget('a', 0, 4), widget('b', 4, 4), widget('c', 0, 8, 8), widget('side', 8, 4), widget('hidden', 0, 4, 4, false)] }
  const before = clone(layout)
  const rect = { x: 0, y: 4, w: 8, h: 4 }
  const result = geometry.resolvePlacement(rect, 'active', layout)
  assert.deepEqual(result.map(w => [w.id, w.y]), [['active', 4], ['a', 8], ['b', 8], ['c', 12], ['side', 4], ['hidden', 4]])
  assertNoOverlap(result)
  assert.deepEqual(layout, before)
  assert.deepEqual(geometry.resolvePlacement(rect, 'active', layout), result)
  const reversed = geometry.resolvePlacement(rect, 'active', { ...layout, widgets: [...layout.widgets].reverse() })
  assert.deepEqual([...reversed].sort((a, b) => a.id.localeCompare(b.id)), [...result].sort((a, b) => a.id.localeCompare(b.id)))
})

test('缩放也能推开组件，紧贴不移动；隐藏组件不参与避让', () => {
  const layout = clone(DEFAULT_LAYOUT)
  const poetry = layout.widgets.find(w => w.id === 'poetry')
  const unchanged = geometry.resolvePlacement(poetry, 'poetry', layout)
  assert.deepEqual(unchanged, layout.widgets)
  const result = geometry.resolvePlacement({ ...poetry, h: 10 }, 'poetry', layout)
  assertNoOverlap(result)
  assert.equal(result.find(w => w.id === 'clock').y, 0)
  assert.equal(result.find(w => w.id === 'weather').y, 0)
  assert.equal(result.find(w => w.id === 'search').y, 10)
  assert.equal(geometry.resolvePlacement({ ...poetry, w: 1 }, 'poetry', layout), null)
  assert.equal(geometry.resolvePlacement({ ...poetry, x: 12 }, 'poetry', layout), null)
  assert.equal(geometry.resolvePlacement({ ...poetry, y: Infinity }, 'poetry', layout), null)
})

test('连续移动和缩放后所有可见组件仍在边界内且互不重叠', () => {
  let layout = clone(DEFAULT_LAYOUT)
  let seed = 20261123
  const random = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max }
  for (let i = 0; i < 200; i++) {
    const widget = layout.widgets[random(layout.widgets.length)]
    const min = geometry.MIN_SIZE[widget.type]
    const w = min.w + random(12 - min.w + 1)
    const rect = { x: random(13 - w), y: random(30), w, h: min.h + random(8) }
    layout = { ...layout, widgets: geometry.resolvePlacement(rect, widget.id, layout) }
    assertNoOverlap(layout.widgets)
    assert.ok(layout.widgets.every(w => w.x >= 0 && w.x + w.w <= 12 && w.y >= 0))
  }
})

test('连锁避让作为一个操作撤销、重做并保存，取消还原全部坐标', async () => {
  const { store, writes } = setup()
  await store.loadLayout(); store.startEditing()
  const before = clone(store.layout)
  assert.equal(store.applyRect('poetry', { x: 2, y: 5, w: 3, h: 4 }), true)
  const after = clone(store.layout)
  assertNoOverlap(after.widgets)
  assert.notDeepEqual(after.widgets.find(w => w.id === 'search'), before.widgets.find(w => w.id === 'search'))
  assert.equal(writes.length, 0)
  store.undo()
  assert.deepEqual(clone(store.layout), before)
  assert.equal(store.canUndo, false)
  store.redo()
  assert.deepEqual(clone(store.layout), after)
  store.cancelEditing()
  assert.deepEqual(clone(store.layout), before)
  store.startEditing()
  store.applyRect('poetry', { x: 2, y: 5, w: 3, h: 4 })
  assert.equal(await store.stopEditing(), true)
  assert.deepEqual(writes[0], after)
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

test('manifest 固定的公钥可解析且扩展 ID 不随机器路径改变', () => {
  const crypto = require('node:crypto')
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'))
  const key = Buffer.from(manifest.key, 'base64')
  assert.equal(crypto.createPublicKey({ key, type: 'spki', format: 'der' }).asymmetricKeyType, 'rsa')
  const id = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, digit => String.fromCharCode(97 + parseInt(digit, 16)))
  assert.equal(id, 'elkbjgjhmajcjfijincfgfikepllokga')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
  assert.equal(pkg.version, manifest.version)
  assert.equal(lock.version, manifest.version)
  assert.equal(lock.packages[''].version, manifest.version)
})

test('同步期间保留布局编辑草稿，取消后使用远端新布局', async () => {
  let remote = clone(DEFAULT_LAYOUT)
  setActivePinia(createPinia())
  const storage = { getLayout: async () => clone(remote), setLayout: async value => { remote = clone(value) } }
  const store = loader({ '@/utils/storage': { storage } })('src/stores/layout.ts').useLayoutStore()
  await store.loadLayout(); store.startEditing()
  store.setWidgetOpacity('poetry', 0.3)
  remote.widgetOpacity = 0.6
  remote.widgets[0].y = 40
  await store.loadLayout()
  assert.equal(store.getWidgetOpacity('poetry'), 0.3)
  assert.equal(store.layout.widgets[0].y, 0)
  assert.ok(store.feedback.includes('草稿已保留'))
  store.cancelEditing()
  assert.equal(store.layout.widgets[0].y, 40)
  assert.equal(store.getWidgetOpacity('poetry'), 0.6)
})

test('同步监听只响应指定存储区与键，卸载移除监听', () => {
  const previous = global.chrome
  let listener, calls = 0
  global.chrome = { storage: { onChanged: { addListener: value => { listener = value }, removeListener: value => { assert.equal(value, listener); listener = null } } } }
  try {
    const stop = load('src/utils/storageChanges.ts').subscribeStorage('sync', ['layout'], () => calls++)
    listener({ layout: { newValue: {} } }, 'local')
    listener({ settings: { newValue: {} } }, 'sync')
    listener({ layout: { newValue: {} } }, 'sync')
    assert.equal(calls, 1)
    stop(); assert.equal(listener, null)
  } finally { global.chrome = previous }
})

test('旧配置备份兼容数字键数组，白名单排除令牌，拒绝无效导航和超限数据', () => {
  const value = { app: 'personal-newtab', version: 1, sync: { layout: clone(DEFAULT_LAYOUT), navigationLinks: { '0': { id: '1', name: '示例', url: 'https://example.com' } }, token: 'excluded' }, local: { xueqiuWatchlist: { '0': ' SH600000 ', '1': 'SH600000' }, xueqiuCookie: 'excluded' } }
  value.sync.layout.widgets = Object.fromEntries(value.sync.layout.widgets.map((item, index) => [index, item]))
  const parsed = backup.parseConfigBackup(value)
  assert.equal(Array.isArray(parsed.sync.layout.widgets), true)
  assert.equal(parsed.sync.navigationLinks[0].url, 'https://example.com/')
  assert.deepEqual(parsed.local.xueqiuWatchlist, ['SH600000'])
  assert.equal(parsed.sync.token, undefined)
  assert.equal(parsed.local.xueqiuCookie, undefined)
  const invalid = clone(value)
  invalid.sync.navigationLinks['0'].url = 'javascript:alert(1)'
  assert.throws(() => backup.parseConfigBackup(invalid), /HTTP/)
  assert.throws(() => backup.parseConfigBackup({}), /备份/)
  assert.throws(() => backup.assertSyncSize({ navigationLinks: '中'.repeat(3000) }), /8KB/)
})

test('导入前校验且失败回滚，空导航和独立不透明度可恢复', async () => {
  const previous = global.chrome
  const data = { sync: { navigationLinks: [{ id: 'old', name: '旧导航', url: 'https://example.com' }] }, local: { customWallpaper: 'https://example.com/old.png' } }
  const initial = clone(data)
  let fail = true, writes = 0
  const area = name => ({
    get: async keys => Object.fromEntries(keys.filter(key => key in data[name]).map(key => [key, clone(data[name][key])])),
    set: async value => { writes++; if (name === 'sync' && fail) { fail = false; throw new Error('quota') } Object.assign(data[name], clone(value)) },
    remove: async keys => keys.forEach(key => delete data[name][key])
  })
  global.chrome = { storage: { sync: area('sync'), local: area('local') } }
  try {
    const original = await backup.exportConfigBackup()
    assert.equal(original.app, 'personal-newtab')
    const layout = clone(DEFAULT_LAYOUT); layout.widgetOpacities = { poetry: 0.1 }
    const imported = { app: 'personal-newtab', version: 1, sync: { navigationLinks: [], layout }, local: { customWallpaper: 'https://example.com/new.png', xueqiuWatchlist: ['SH600000'] } }
    await assert.rejects(backup.importConfigBackup(imported), /quota/)
    assert.deepEqual(data, initial)
    const count = writes
    await assert.rejects(backup.importConfigBackup({ ...imported, sync: { navigationLinks: null } }))
    assert.equal(writes, count)
    await backup.importConfigBackup(imported)
    assert.deepEqual(data.sync.navigationLinks, [])
    assert.equal(data.sync.layout.widgetOpacities.poetry, 0.1)
    assert.deepEqual(data.local.xueqiuWatchlist, ['SH600000'])
  } finally { global.chrome = previous }
})

test('主题首次加载不写默认值，远端主题更新不打断当前预览', async () => {
  const previousChrome = global.chrome, previousWindow = global.window
  let saved = {}, writes = 0
  const applied = []
  global.chrome = { storage: { sync: { get: async () => clone(saved), set: async value => { writes++; saved = clone(value) } } } }
  global.window = { matchMedia: () => ({ matches: false }) }
  setActivePinia(createPinia())
  try {
    const store = loader({ '@/utils/themeExtractor': { extractThemes: async () => [], applyThemeToCSS: theme => applied.push(theme.id) } })('src/stores/theme.ts').useThemeStore()
    await store.loadTheme()
    assert.equal(writes, 0)
    const preview = { ...clone(store.currentTheme), id: 'preview' }
    store.preview(preview)
    saved = { appearanceVersion: 2, currentTheme: { ...clone(store.currentTheme), id: 'remote' } }
    await store.loadTheme()
    assert.equal(store.activeTheme.id, 'preview')
    assert.equal(applied.at(-1), 'preview')
    store.cancelPreview()
    assert.equal(store.activeTheme.id, 'remote')
    assert.equal(applied.at(-1), 'remote')
    store.preview(preview)
    global.chrome.storage.sync.set = async () => { throw new Error('quota exceeded') }
    assert.equal(await store.applyTheme(preview), false)
    assert.equal(store.currentTheme.id, 'remote')
    assert.equal(store.previewTheme.id, 'preview')
    assert.match(store.saveError, /quota/)
    saved = { appearanceVersion: 2, currentTheme: { id: 'broken' }, extractedThemes: [null, { id: 'broken' }] }
    await store.loadTheme()
    store.cancelPreview()
    assert.equal(store.activeTheme.id, 'quiet-light')
  } finally { global.chrome = previousChrome; global.window = previousWindow }
})
