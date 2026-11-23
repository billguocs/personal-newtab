import { normalizeLayout } from './layoutGeometry'

export const SYNC_CONFIG_KEYS = ['layout', 'settings', 'navigationLinks', 'currentTheme', 'extractedThemes', 'appearanceVersion']
export const LOCAL_CONFIG_KEYS = ['customWallpaper', 'xueqiuWatchlist']
type Data = Record<string, any>
export interface ConfigBackup { app: 'personal-newtab'; version: 1; exportedAt?: string; sync: Data; local: Data }
const object = (value: unknown): value is Data => !!value && typeof value === 'object' && !Array.isArray(value)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const color = /^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i
export function isValidTheme(value: unknown) {
  return object(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    typeof value.isDark === 'boolean' && object(value.colors) &&
    ['primary', 'background', 'surface', 'text', 'textSecondary', 'border', 'accent'].every(key => typeof value.colors[key] === 'string' && color.test(value.colors[key]))
}

// 导入只接收配置白名单，拒绝损坏的数据；不包含 Cookie、行情缓存或访问令牌。
export function parseConfigBackup(value: unknown): ConfigBackup {
  if (!object(value) || value.app !== 'personal-newtab' || value.version !== 1 || !object(value.sync) || !object(value.local)) throw new Error('不是受支持的配置备份文件')
  const sync: Data = {}, local: Data = {}
  for (const key of SYNC_CONFIG_KEYS) if (Object.prototype.hasOwnProperty.call(value.sync, key)) sync[key] = copy(value.sync[key])
  for (const key of LOCAL_CONFIG_KEYS) if (Object.prototype.hasOwnProperty.call(value.local, key)) local[key] = copy(value.local[key])
  if (!Object.keys(sync).length && !Object.keys(local).length) throw new Error('备份中没有可恢复的配置')
  if ('layout' in sync) {
    if (!object(sync.layout) || !object(sync.layout.widgets) && !Array.isArray(sync.layout.widgets)) throw new Error('布局数据格式无效')
    const widgets = Array.isArray(sync.layout.widgets) ? sync.layout.widgets : Object.keys(sync.layout.widgets).filter(key => /^\d+$/.test(key)).sort((a, b) => Number(a) - Number(b)).map(key => sync.layout.widgets[key])
    if (widgets.some((widget: unknown) => !object(widget) || typeof widget.id !== 'string')) throw new Error('布局组件数据无效')
    sync.layout = normalizeLayout({ ...sync.layout, widgets })
  }
  if ('settings' in sync) {
    const settings = sync.settings
    if (!object(settings) || !['bing', 'custom'].includes(settings.wallpaperType) || typeof settings.searchEngine !== 'string' || !['zh_CN', 'en'].includes(settings.language) || typeof settings.showClock !== 'boolean' || typeof settings.showDate !== 'boolean') throw new Error('基础设置数据无效')
    sync.settings = { wallpaperType: settings.wallpaperType, searchEngine: settings.searchEngine, language: settings.language, showClock: settings.showClock, showDate: settings.showDate, customWallpaper: null }
  }
  if ('navigationLinks' in sync) {
    const links = sync.navigationLinks?.data ?? sync.navigationLinks
    if (!object(links) && !Array.isArray(links)) throw new Error('导航数据无效')
    sync.navigationLinks = Object.values(links).map(link => {
      if (!object(link) || typeof link.id !== 'string' || typeof link.name !== 'string' || typeof link.url !== 'string') throw new Error('导航条目无效')
      const url = new URL(link.url)
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('导航只支持 HTTP 或 HTTPS 网址')
      return { id: link.id, name: link.name, url: url.href, ...(typeof link.icon === 'string' ? { icon: link.icon } : {}) }
    })
  }
  if ('currentTheme' in sync && !isValidTheme(sync.currentTheme)) throw new Error('主题数据无效')
  if ('extractedThemes' in sync && (!Array.isArray(sync.extractedThemes) || !sync.extractedThemes.every(isValidTheme))) throw new Error('主题列表数据无效')
  if ('appearanceVersion' in sync && sync.appearanceVersion !== 2) delete sync.appearanceVersion
  if ('customWallpaper' in local && local.customWallpaper !== null && (typeof local.customWallpaper !== 'string' || !/^(https?:\/\/|data:image\/(png|jpe?g|webp|gif|avif|bmp);base64,)/i.test(local.customWallpaper))) throw new Error('壁纸格式无效')
  if ('xueqiuWatchlist' in local) {
    const list = local.xueqiuWatchlist
    if (!object(list) && !Array.isArray(list)) throw new Error('自选股数据无效')
    if (!Object.values(list).every(item => typeof item === 'string')) throw new Error('自选股代码无效')
    local.xueqiuWatchlist = [...new Set(Object.values(list).map(item => (item as string).trim()).filter(Boolean))]
  }
  assertSyncSize(sync)
  return { app: 'personal-newtab', version: 1, sync, local }
}

export function assertSyncSize(data: Data) {
  const encoder = new TextEncoder()
  for (const [key, value] of Object.entries(data)) {
    if (encoder.encode(key + JSON.stringify(value)).length > 8192) throw new Error(`配置项 ${key} 超过 Chrome 同步的 8KB 限制，请减少条目后重试`)
  }
}

export async function exportConfigBackup(): Promise<ConfigBackup> {
  const [sync, local] = await Promise.all([chrome.storage.sync.get(SYNC_CONFIG_KEYS), chrome.storage.local.get(LOCAL_CONFIG_KEYS)])
  return { app: 'personal-newtab', version: 1, exportedAt: new Date().toISOString(), sync, local }
}

export async function importConfigBackup(backup: ConfigBackup) {
  const validated = parseConfigBackup(backup)
  const previous = await exportConfigBackup()
  try {
    if (Object.keys(validated.local).length) await chrome.storage.local.set(validated.local)
    if (Object.keys(validated.sync).length) await chrome.storage.sync.set(validated.sync)
  } catch (error) {
    // 只回滚本次写入的键，保留导入期间不相关的数据。
    try {
      for (const area of ['local', 'sync'] as const) {
        const touched = Object.keys(validated[area])
        if (!touched.length) continue
        const restore = Object.fromEntries(touched.filter(key => key in previous[area]).map(key => [key, previous[area][key]]))
        const remove = touched.filter(key => !(key in previous[area]))
        if (Object.keys(restore).length) await chrome.storage[area].set(restore)
        if (remove.length) await chrome.storage[area].remove(remove)
      }
    } catch { throw new Error('导入失败，自动还原未完成。请保留导入前下载的备份并重试恢复') }
    throw error
  }
}

export function downloadConfigBackup(backup: ConfigBackup) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = `personal-newtab-${Date.now()}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
