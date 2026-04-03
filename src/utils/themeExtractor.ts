import { Vibrant } from 'node-vibrant/browser'

export interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    accent: string
  }
  isDark: boolean
}

// 计算颜色亮度
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// 判断是否为暗色
function isDarkColor(r: number, g: number, b: number): boolean {
  return getLuminance(r, g, b) < 0.5
}

// 获取对比色（黑或白）
function getContrastColor(r: number, g: number, b: number): string {
  return isDarkColor(r, g, b) ? '#ffffff' : '#1a1a1a'
}

// 调整颜色亮度
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// 添加透明度
function addAlpha(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const R = (num >> 16) & 0xff
  const G = (num >> 8) & 0xff
  const B = num & 0xff
  return `rgba(${R}, ${G}, ${B}, ${alpha})`
}

// 生成主题名称
function generateThemeName(baseColor: string, isDark: boolean): string {
  const colorNames: Record<string, string> = {
    'ff0000': '红',
    '00ff00': '绿',
    '0000ff': '蓝',
    'ffff00': '黄',
    'ff00ff': '紫',
    '00ffff': '青',
    'ffa500': '橙',
    'ffc0cb': '粉',
    '800080': '紫',
    '008000': '绿',
    '000080': '蓝',
    '800000': '红',
    '808000': '橄榄',
    '008080': '青',
    'c0c0c0': '银',
    '808080': '灰',
    'ffffff': '白',
    '000000': '黑'
  }

  const num = parseInt(baseColor.replace('#', ''), 16)
  const R = (num >> 16) & 0xff
  const G = (num >> 8) & 0xff
  const B = num & 0xff

  // 找到最接近的颜色
  let closestName = ''
  let minDistance = Infinity

  for (const [hex, name] of Object.entries(colorNames)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const distance = Math.sqrt(
      Math.pow(R - r, 2) + Math.pow(G - g, 2) + Math.pow(B - b, 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      closestName = name
    }
  }

  const tone = isDark ? '暗' : '亮'
  return `${closestName}色${tone}调`
}

// 从颜色生成主题
function createThemeFromColor(
  primaryColor: string,
  backgroundColor: string,
  id: string
): Theme {
  const num = parseInt(primaryColor.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff

  const isDark = isDarkColor(r, g, b)
  const textColor = getContrastColor(r, g, b)
  const textSecondary = addAlpha(textColor, 0.7)

  // 背景色处理
  const bgNum = parseInt(backgroundColor.replace('#', ''), 16)
  const bgR = (bgNum >> 16) & 0xff
  const bgG = (bgNum >> 8) & 0xff
  const bgB = bgNum & 0xff
  const isBgDark = isDarkColor(bgR, bgG, bgB)

  // 生成表面色（比背景稍亮或稍暗）
  const surfaceAdjustment = isBgDark ? 20 : -20
  const surfaceColor = adjustBrightness(backgroundColor, surfaceAdjustment)

  // 边框色
  const borderColor = addAlpha(textColor, 0.15)

  return {
    id,
    name: generateThemeName(primaryColor, isDark),
    colors: {
      primary: primaryColor,
      background: addAlpha(backgroundColor, 0.85),
      surface: addAlpha(surfaceColor, 0.9),
      text: textColor,
      textSecondary: textSecondary,
      border: borderColor,
      accent: adjustBrightness(primaryColor, isDark ? 20 : -10)
    },
    isDark
  }
}

// 提取图片主题
export async function extractThemes(imageUrl: string): Promise<Theme[]> {
  try {
    const vibrant = Vibrant.from(imageUrl)

    const palette = await vibrant.getPalette()

    const themes: Theme[] = []
    const usedColors = new Set<string>()

    // 从调色板中提取颜色
    const swatches = [
      { swatch: palette.Vibrant, name: 'vibrant' },
      { swatch: palette.Muted, name: 'muted' },
      { swatch: palette.DarkVibrant, name: 'darkVibrant' },
      { swatch: palette.DarkMuted, name: 'darkMuted' },
      { swatch: palette.LightVibrant, name: 'lightVibrant' },
      { swatch: palette.LightMuted, name: 'lightMuted' }
    ]

    for (const { swatch, name } of swatches) {
      if (!swatch) continue

      const hex = swatch.hex
      if (usedColors.has(hex)) continue
      usedColors.add(hex)

      // 根据颜色亮度决定背景色
      const num = parseInt(hex.replace('#', ''), 16)
      const r = (num >> 16) & 0xff
      const g = (num >> 8) & 0xff
      const b = num & 0xff
      const isDark = isDarkColor(r, g, b)

      // 背景色：与主色对比
      const backgroundColor = isDark ? '#1a1a1a' : '#f5f5f5'

      themes.push(createThemeFromColor(hex, backgroundColor, `theme-${name}`))
    }

    // 如果没有提取到足够的主题，添加默认主题
    if (themes.length < 3) {
      // 添加蓝色主题
      if (!usedColors.has('#3b82f6')) {
        themes.push(createThemeFromColor('#3b82f6', '#f5f5f5', 'theme-blue'))
      }
      // 添加紫色主题
      if (!usedColors.has('#8b5cf6')) {
        themes.push(createThemeFromColor('#8b5cf6', '#1a1a1a', 'theme-purple'))
      }
      // 添加绿色主题
      if (!usedColors.has('#10b981')) {
        themes.push(createThemeFromColor('#10b981', '#f5f5f5', 'theme-green'))
      }
    }

    // 避免未使用变量警告
    void isDarkColor

    return themes.slice(0, 5) // 最多返回5个主题
  } catch (error) {
    console.error('提取主题颜色失败:', error)
    // 返回默认主题
    return [
      createThemeFromColor('#3b82f6', '#f5f5f5', 'theme-default'),
      createThemeFromColor('#8b5cf6', '#1a1a1a', 'theme-dark'),
      createThemeFromColor('#10b981', '#f5f5f5', 'theme-nature')
    ]
  }
}

// 应用主题到 CSS 变量
export function applyThemeToCSS(theme: Theme): void {
  const root = document.documentElement

  root.style.setProperty('--theme-primary', theme.colors.primary)
  root.style.setProperty('--theme-background', theme.colors.background)
  root.style.setProperty('--theme-surface', theme.colors.surface)
  root.style.setProperty('--theme-text', theme.colors.text)
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--theme-border', theme.colors.border)
  root.style.setProperty('--theme-accent', theme.colors.accent)

  // 同时更新现有的变量以保持兼容性
  root.style.setProperty('--accent-color', theme.colors.primary)
  root.style.setProperty('--text-primary', theme.colors.text)
  root.style.setProperty('--text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--glass-bg', theme.colors.surface)
  root.style.setProperty('--glass-border', theme.colors.border)
  root.style.setProperty('--bg-secondary', theme.colors.background)
}
