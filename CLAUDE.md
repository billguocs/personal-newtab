# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Chrome Manifest V3 新标签页扩展，通过 `chrome_url_overrides` 替换默认新标签页。技术栈为 Vue 3 + TypeScript + Vite + CRXJS，界面、注释和提交信息均使用中文。

## 常用命令

```bash
npm install            # 安装依赖
npm run dev            # Vite + CRXJS 开发服务器；在 chrome://extensions 加载 dist/ 目录
npm run build          # 先 vue-tsc 类型检查，再 vite build，产物在 dist/
npm run lint           # ESLint 检查并自动修复 .vue / .ts
npm run typecheck      # vue-tsc --noEmit
npm run test:layout    # Node 内置测试：网格边界、碰撞、布局草稿、撤销和持久化
```

布局回归测试使用 Node 内置 test runner，测试文件为 `tests/layout.test.cjs`，不额外依赖测试框架。布局改动运行 `npm run test:layout` 和 `npm run build`，再在 Chrome 中重新加载 `dist/` 检查交互。`dist/` 已被 gitignore，但仓库里存在本地构建产物。

## 入口与启动流程

`src/newtab/main.ts` → `App.vue`。`App.vue` 的 `onMounted` 按顺序加载：

1. `layoutStore.loadLayout()`（必须先完成，`GridLayout` 只在 `visibleWidgets.length > 0` 时渲染）
2. `settingsStore.loadSettings()`（含 Bing 壁纸与主题提取）
3. `hotlistStore.loadAll()`
4. `themeStore.loadTheme()`

同时 watch `settingsStore.isDark`，给 `<html>` 添加/移除 `.dark`。

## Widget 布局系统（最需要小心）

- 12 列 CSS Grid，`Widget.x/y` 从 **0** 开始，`GridLayout.getItemStyle()` 转成 CSS Grid 的 **1-based** 行列。
- 组件高度为 `h * gridRowHeight + (h - 1) * gap`（默认行高 45px、间距 16px），显式设置 `gridAutoRows`。`utils/layoutGeometry.ts` 是渲染、移动、八向缩放、最小尺寸和碰撞检测的唯一计算来源。
- `WidgetFrame.vue` 提供选中态和编辑把手；`composables/useWidgetInteraction.ts` 用 Pointer Events + 画布指针捕获处理鼠标/触屏，先显示落点预览，松手时只有不重叠的位置才能应用到草稿。北/西缩放固定对侧边缘。
- `layoutStore` 区分已提交布局与编辑草稿。只有“完成”成功保存后退出，“取消”恢复已提交值；保存失败保留草稿。支持分组撤销/重做（最多 50 步），禁止在保存期间修改或重复提交。
- 背景不透明度：全局 `layout.widgetOpacity`（默认 0.85）+ `layout.widgetOpacities[id]` 覆盖，删除覆盖即跟随全局；独立的 `backgroundBlur` 范围为 0–40px。设置面板为 `LayoutInspector.vue`。主题 alpha 不再叠乘卡片 alpha，`--card-bg` 使用主题的不透明底色。
- 编辑模式支持方向键移动、Shift+方向键缩放、Ctrl/Cmd+Z 撤销、Ctrl/Cmd+Shift+Z 重做；拖拽中 Escape 只取消本次手势，再按 Escape 取消整次编辑。窄屏编辑使用可横向滚动的桌面画布，阅读模式保持单列。

**新增一个 Widget 必须同步修改以下位置**，否则已保存布局会把它过滤掉或直接不渲染：

1. `src/types/index.ts`：`Widget['type']` 联合类型
2. 默认布局：`src/utils/layoutDefaults.ts` 中的 `DEFAULT_LAYOUT`（存储与 Store 共用）；最小尺寸在 `layoutGeometry.ts` 的 `MIN_SIZE` 中声明
3. `src/components/GridLayout.vue`：`defineAsyncComponent` 导入 + `getWidgetComponent()` 映射

`layoutStore.loadLayout()` 通过 `normalizeLayout()` 丢弃未知 id、补齐新增组件、校验坐标/尺寸/不透明度，保留旧布局有效的坐标与数值。

## 存储分层

| 位置 | 内容 |
| --- | --- |
| `chrome.storage.sync` | `settings`、`layout`、`navigationLinks`；主题在 `themeStore` 中直接读写 `currentTheme` / `extractedThemes`（绕过 `utils/storage.ts`） |
| `chrome.storage.local` | `customWallpaper`（Base64）、通用缓存（`getCachedData/setCachedData`）、`faviconCache`、`xueqiuCookie`、`xueqiuWatchlist` |
| `localStorage` | 每日诗词，key 为 `poetry_YYYY-MM-DD`，严格每天一首 |

- `getCachedData/setCachedData` 的 TTL 固定为 **30 分钟**，部分模块通过 `force=true` 跳过缓存。
- `getLayout()` 包含将 Chrome Sync 存成类数组对象（`{"0": {...}}`）转回数组的兼容逻辑，不要删除。
- 缓存 key 约定：`bingWallpaper`、`githubTrending_{period}_{language}`、`zhihuHot`、`v2exHot`、`xueqiuHot_v2_{market}`、`xueqiuQuotes`。

## 主题与样式

- 默认使用 `src/utils/themePresets.ts` 的固定中性色浅/深主题；首次升级通过 `appearanceVersion: 2` 切换新主题，旧配色保留在主题列表。壁纸取色仅作为可选方案。
- 列表默认背景透明，排名无色块，只有当前行 hover/focus 时显示 `--row-hover`；不要再给每行添加常驻胶囊底色。组件透明度只作用于卡片底色，悬停组件不改变透明度。
- `src/utils/themeExtractor.ts` 用 `node-vibrant/browser` 从壁纸取色，生成 3–5 个 `Theme`；`themeStore` 支持 preview（临时应用）和 applyTheme（持久化）。
- `applyThemeToCSS()` 同时写入 `--theme-*` 和旧变量 `--accent-color`、`--text-primary`、`--glass-bg`、`--bg-secondary` 等。**组件样式统一用旧变量**，才能同时兼容主题和深浅色。
- 深浅色由 `styles.css` 中的 `:root` / `.dark` 变量覆盖实现，不是 Tailwind 的 `dark:` 变体（配置里也没有 `darkMode: 'class'`）。
- 毛玻璃效果：`--glass-bg` + `--glass-border` + `backdrop-filter: blur()`；`styles.css` 的 `@layer components` 里有 `.glass`、`.widget-container` 等公共类。

## 数据层约定

- `src/api/*.ts` 每个模块自带「先查缓存、网络成功后写缓存」的模式；`force` 参数用于刷新按钮。
- `hotlistStore` 统一管理 GitHub / 知乎 / V2EX / 雪球的状态：`loadAll()` 加载首屏四项（雪球只加载沪深），`refreshAll()` 强制刷新全部。
- **雪球热榜**（`api/xueqiu.ts`）：
  - **无需用户配置 Cookie**。雪球接口要求 `xq_a_token` 等 Cookie，而浏览器 `fetch` 禁止手动设置 `Cookie` 请求头，因此采用：先请求 `https://www.xueqiu.com/` 让浏览器自动保存 Cookie，再用 `credentials: 'include'` 请求接口；接口返回 400/401/403 时重新访问首页建立会话并重试一次。
  - 依赖 `manifest.json` 中 `https://*.xueqiu.com/*` 的 host_permissions，缺少时 Cookie 无法建立、请求也会被 CORS 拦截。
  - 雪球接口对停牌/无行情的标的会返回 `current` / `percent` 为 `null`，组件里必须用 `formatPrice` / `formatPercent` 防御性格式化；直接 `.toFixed()` 会让整个组件渲染失败并显示空白。
- `manifest.json` 的 `host_permissions` 覆盖 bing / github / zhihu / v2ex / xueqiu；Open-Meteo、jinrishici 等接口依赖目标站允许 CORS。**新增会被扩展页拦截跨域的 API 时，需要补 `host_permissions`**。
- GitHub 趋势不是官方 trending 接口，而是用 Search API 按 `created:>{date}` + stars 排序近似。

## 其他约定

- 路径别名 `@` → `/src`（`vite.config.ts`）。
- 扩展名称/描述走 `public/_locales/{zh_CN,en}/messages.json` 的 `__MSG_*__`；应用内 i18n 已移除，`LangSwitcher.vue` 未挂载且不实际切换语言，不要照 README 的 Vue I18n 描述行事。
- 构建 target 为 `chrome88`。CI（`.github/workflows/build.yml`）在 push 到 `main`/`master` 时构建、打包 zip 并创建 Release。
