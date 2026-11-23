import type { Theme } from './themeExtractor'

// 固定中性底色，壁纸取色仅作为可选主题，不改变默认阅读体验。
export const LIGHT_THEME: Theme = {
  id: 'quiet-light', name: '清透浅色', isDark: false,
  colors: {
    primary: '#4f6bed', accent: '#4f6bed', background: '#eef2f7', surface: '#f8fafc',
    text: '#1e293b', textSecondary: '#64748b', border: 'rgba(100, 116, 139, 0.14)'
  }
}
export const DARK_THEME: Theme = {
  id: 'quiet-dark', name: '静谧深色', isDark: true,
  colors: {
    primary: '#91a4ff', accent: '#91a4ff', background: '#202b3d', surface: '#172033',
    text: '#e2e8f0', textSecondary: '#94a3b8', border: 'rgba(148, 163, 184, 0.16)'
  }
}
export const BUILTIN_THEMES = [LIGHT_THEME, DARK_THEME]
