import type { Plugin } from 'postcss'

// 在 Tailwind 展开 @apply 后统一处理，覆盖 px/rem、响应式字号及固定行高。
// em/% 已继承父字号，不再乘倍率，避免嵌套文字重复放大。
export function widgetTypography(): Plugin {
  return {
    postcssPlugin: 'widget-typography',
    OnceExit(root) {
      root.walkDecls(/^(font-size|line-height)$/, declaration => {
        const value = declaration.value
        if (value.includes('--widget-font-scale') || !/(?:[\d.](?:px|rem|pt|vw|vh)\b|var\()/.test(value)) return
        declaration.value = 'calc((' + value + ') * var(--widget-font-scale, 1))'
      })
    }
  }
}
