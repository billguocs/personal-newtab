# Personal New Tab - 个性化新标签页

一个简洁美观的 Chrome 新标签页扩展，支持自定义壁纸、多搜索引擎、AI 交互、热榜等功能。

## ✨ 功能特性

### 1. 壁纸系统
- 🖼️ **Bing 每日一图** - 自动获取 Bing 每日精美壁纸
- 📤 **自定义壁纸** - 支持上传本地图片作为背景
- 🎨 **毛玻璃效果** - 组件使用玻璃态设计，与壁纸完美融合

### 2. 智能搜索
- 🔍 **多搜索引擎** - 支持百度、Google、必应、DuckDuckGo
- 🤖 **AI 交互模式** - 一键切换 AI 模式，支持：
  - 通义千问 (Qwen)
  - Gemini
  - ChatGPT
  - Claude
  - Kimi
- ⚡ **快速切换** - 搜索框内直接切换搜索引擎或 AI 平台

### 3. 热榜资讯
- 🐙 **GitHub Trending** - 查看今日/本周/本月热门仓库
- 💡 **知乎热榜** - 实时获取知乎热门话题
- 💬 **V2EX 热议** - 获取 V2EX 社区热门讨论
- 🔄 **手动刷新** - 每个热榜都支持手动刷新获取最新数据

### 4. 布局系统
- 📐 **网格布局** - 采用 CSS Grid 实现灵活的网格布局
- 🖱️ **拖拽调整** - 支持拖拽组件调整位置
- 📏 **自由缩放** - 支持调整组件大小（宽度和高度）
- 👁️ **显示控制** - 可自由开启/关闭不需要的组件
- ☁️ **云端同步** - 布局配置通过 Chrome 同步存储多端同步

### 5. 主题系统
- 🌓 **自动暗色模式** - 根据系统主题自动切换
- 🎨 **深浅主题** - 支持浅色和深色两种主题模式

### 6. 国际化
- 🇨🇳 **中文支持** - 默认中文界面
- 🇺🇸 **英文支持** - 一键切换英文界面
- 🔄 **实时切换** - 切换语言后立即生效

## 🚀 安装方法

### 方式一：从 GitHub Release 安装（推荐）

1. 访问 [Releases](../../releases) 页面
2. 下载最新的 `personal-newtab.zip` 文件
3. 解压到任意文件夹
4. 打开 Chrome，访问 `chrome://extensions/`
5. 开启右上角的「开发者模式」
6. 点击「加载已解压的扩展程序」
7. 选择解压后的文件夹

### 方式二：开发者模式安装（本地编译）

1. 克隆或下载本项目到本地
```bash
git clone https://github.com/your-username/personal-newtab.git
cd personal-newtab
```

2. 安装依赖
```bash
npm install
```

3. 构建扩展
```bash
npm run build
```

4. 在 Chrome 中加载扩展
   - 打开 Chrome，访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目中的 `dist` 文件夹

## 🤖 自动构建

本项目已配置 GitHub Actions 自动构建流水线：

- **触发条件**：
  - 每次推送到 `main` 或 `master` 分支
  - 每次 Pull Request 到 `main` 或 `master` 分支
  - 手动触发（workflow_dispatch）

- **构建流程**：
  1. 检出代码
  2. 设置 Node.js 环境
  3. 安装依赖
  4. 编译扩展
  5. 打包为 zip 文件
  6. 上传构建产物
  7. 自动创建 Release（仅 push 到 main 分支时）

- **获取构建产物**：
  - 每次构建完成后，可在 Actions 页面的 Artifacts 中下载
  - Release 页面会自动发布最新版本

## 🛠️ 开发指南

### 技术栈
- **框架**: Vue 3 + TypeScript
- **构建**: Vite + CRXJS
- **状态管理**: Pinia
- **样式**: TailwindCSS
- **国际化**: Vue I18n

### 项目结构
```
personal-newtab/
├── src/
│   ├── api/           # API 接口
│   ├── assets/        # 静态资源
│   ├── components/    # Vue 组件
│   ├── i18n/         # 国际化配置
│   ├── newtab/       # 新标签页入口
│   ├── stores/       # Pinia Store
│   ├── types/        # TypeScript 类型
│   └── utils/        # 工具函数
├── public/           # 公共资源
├── manifest.json     # 扩展配置
└── vite.config.ts    # Vite 配置
```

### 常用命令
```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## 📱 使用说明

### 首次使用
1. 安装扩展后，打开新标签页即可看到新界面
2. 默认显示 Bing 每日一图作为背景
3. 搜索框默认使用百度搜索引擎

### 自定义壁纸
1. 点击右上角的设置图标
2. 选择「自定义壁纸」
3. 点击「上传图片」选择本地图片
4. 支持随时切换回「Bing 每日一图」

### 使用 AI 模式
1. 在搜索框上方点击「AI 模式」按钮
2. 输入你的问题
3. 选择要使用的 AI 平台（通义千问、ChatGPT 等）
4. 按回车键会自动跳转到对应的 AI 网站并预填充问题

### 调整布局
1. 点击左下角的「编辑布局」按钮
2. 在底部面板中可以：
   - 点击组件名称显示/隐藏组件
   - 拖拽组件左上角的把手移动位置
   - 拖拽组件右下角的把手调整大小
3. 点击「保存布局」保存更改
4. 点击「重置布局」恢复默认布局

### 刷新热榜
每个热榜组件（GitHub、知乎、V2EX）右上角都有刷新按钮，点击可立即获取最新数据。

### 切换语言
点击左上角的「中文/English」按钮可在中英文界面间切换。

## ⚙️ 配置说明

扩展使用 Chrome Storage API 存储配置：

- **settings** - 存储在 `chrome.storage.sync`
  - 壁纸类型和自定义壁纸数据
  - 默认搜索引擎
  - 语言设置
  - 显示选项（时钟、日期）

- **layout** - 存储在 `chrome.storage.sync`
  - 组件位置和大小
  - 组件显示/隐藏状态
  - 网格配置

- **缓存数据** - 存储在 `chrome.storage.local`
  - Bing 壁纸（每日缓存）
  - 热榜数据（按策略缓存）

## 📝 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🖼️ 支持 Bing 每日一图和自定义壁纸
- 🔍 支持多搜索引擎和 AI 交互
- 📊 集成 GitHub、知乎、V2EX 热榜
- 📐 支持网格布局和拖拽调整
- 🌓 支持自动暗色模式
- 🌍 支持中英文切换

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Pinia](https://pinia.vuejs.org/) - Vue 的状态管理库
- [CRXJS](https://crxjs.dev/) - Chrome 扩展开发工具
