# 个人新标签页扩展

一个简洁、美观的Chrome浏览器新标签页扩展。

## 主要功能

1. **个性化壁纸**
   - 支持Bing每日一图
   - 支持自定义上传壁纸

2. **智能搜索**
   - 多搜索引擎支持（百度、Google、必应等）
   - AI交互模式（通义千问、ChatGPT、Gemini等）

3. **热榜聚合**
   - GitHub Trending
   - 知乎热榜
   - V2EX热议

4. **自定义布局**
   - 拖拽调整组件位置
   - 自由调整组件大小
   - 支持组件显示/隐藏
   - 配置多端同步

5. **其他特性**
   - 自动暗色模式
   - 中英文切换
   - 毛玻璃视觉效果

## 安装方法

1. 克隆代码库
2. 运行 `npm install`
3. 运行 `npm run build`
4. 在Chrome中打开 `chrome://extensions/`
5. 开启开发者模式
6. 点击"加载已解压的扩展程序"
7. 选择 `dist` 目录

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 技术栈

- Vue 3 + TypeScript
- Vite + CRXJS
- Pinia
- TailwindCSS
- Vue I18n
