# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Chrome 浏览器新标签页扩展，使用 Vue 3 + TypeScript + Vite 构建。扩展替换 Chrome 默认新标签页，提供个性化界面，包括壁纸、搜索、热榜、天气、导航等功能。

## 常用命令

```bash
# 开发模式（带热重载）
npm run dev

# 构建生产版本（输出到 dist/ 目录）
npm run build

# 代码检查与自动修复
npm run lint

# TypeScript 类型检查
npm run typecheck
```

## 技术栈

- **框架**: Vue 3 (Composition API) + TypeScript
- **构建工具**: Vite + CRXJS (用于 Chrome 扩展开发)
- **状态管理**: Pinia
- **样式**: TailwindCSS + 自定义 CSS 变量
- **拖拽布局**: vue-draggable-plus

## 项目结构

```
src/
├── api/           # 外部 API 接口（Bing、GitHub、知乎、V2EX、天气、诗词、股票）
├── components/    # Vue 组件
├── newtab/        # 新标签页入口（main.ts + App.vue + index.html）
├── stores/        # Pinia Store（settings、layout、hotlist、poetry、stock）
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数（storage、helpers、constants）
└── assets/        # 样式文件（tailwind.css、styles.css）
```

## 架构要点

### Chrome 扩展配置
- `manifest.json` 定义扩展权限（storage、bookmarks）和主机权限
- 使用 `chrome_url_overrides` 替换新标签页
- 通过 `chrome.storage.sync` 实现配置多端同步
- 通过 `chrome.storage.local` 缓存数据（壁纸、热榜等）

### 存储系统 (`src/utils/storage.ts`)
- `getSettings/setSettings`: 用户设置（壁纸类型、搜索引擎、语言等）
- `getLayout/setLayout`: 组件布局配置（位置、大小、可见性）
- `getCachedData/setCachedData`: 带过期时间的缓存（默认30分钟）
- `getNavigationLinks/setNavigationLinks`: 导航链接持久化
- `getWallpaper/setWallpaper`: 自定义壁纸数据（Base64）

### 状态管理
- **settingsStore**: 壁纸、搜索引擎、语言、时钟显示设置
- **layoutStore**: 网格布局、组件位置/大小、编辑模式
- **hotlistStore**: GitHub/知乎/V2EX 热榜数据缓存

### 布局系统
- 使用 CSS Grid 实现12列网格布局
- 组件支持拖拽调整位置和大小
- 默认组件：search、navigation、github、zhihu、v2ex、poetry、stock
- 布局配置自动保存到 Chrome Storage

### 组件类型定义 (`src/types/index.ts`)
```typescript
interface Widget {
  id: string
  type: 'search' | 'github' | 'zhihu' | 'v2ex' | 'navigation' | 'poetry' | 'stock'
  title: string
  x: number      // 网格列位置
  y: number      // 网格行位置
  w: number      // 宽度（列数）
  h: number      // 高度（行数）
  visible: boolean
}
```

### API 接口
- `bing.ts`: 获取 Bing 每日壁纸
- `github.ts`: GitHub Trending API
- `zhihu.ts`: 知乎热榜 API
- `v2ex.ts`: V2EX 热议 API
- `weather.ts`: 天气数据 API
- `poetry.ts`: 每日古诗词 API
- `stock.ts`: 股票数据 API

### 样式系统
- 使用 CSS 变量定义主题色（支持深浅色模式）
- 毛玻璃效果：`backdrop-filter: blur()`
- 响应式布局适配不同屏幕尺寸
