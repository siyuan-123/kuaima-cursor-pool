# 快码 cursor 号池 · 官网

[English](#english) · [中文](#chinese)

<a id="chinese"></a>

## 简介

快码 cursor 号池 (KuaiMa Cursor Pool) 官方网站。一个零依赖、纯静态的中英双语展示型站点，主打 **暗黑科技风** + **青绿渐变** 视觉。

## 特性

- **纯静态**：HTML + CSS + Vanilla JS，零构建链
- **中英双语**：基于 `data-i18n` 的轻量 i18n 实现
- **响应式**：480 / 767 / 1023 多断点，含触屏 hover 防粘性优化
- **SEO 完备**：JSON-LD（SoftwareApplication / HowTo）、hreflang、canonical、OG/Twitter Card、sitemap.xml、robots.txt
- **GIF 教程**：原生 `loading="lazy"` 懒加载，图片自适应原始比例
- **客服微信**：一键复制（双路 fallback：clipboard API + execCommand）

## 本地运行

```bash
# 启动本地预览（多线程，自动开浏览器）
python serve.py

# 或自定义端口
python serve.py 8080
```

访问 http://localhost:8000/

## 项目结构

```
.
├── index.html              首页
├── tutorial.html           教程页
├── robots.txt              SEO
├── sitemap.xml             SEO
├── serve.py                本地预览服务
├── assets/
│   ├── css/style.css       全局样式
│   ├── js/i18n.js          中英双语字典+切换
│   ├── js/main.js          交互逻辑
│   └── images/             logo + 教程 GIF
├── tools/                  开发辅助脚本（不部署）
├── tests/                  自动化测试（不部署）
└── .github/workflows/
    └── deploy.yml          GitHub Pages 自动部署
```

## 部署

当前使用 Render Static Site 部署。发布时只需要静态资源：`index.html`、`tutorial.html`、`robots.txt`、`sitemap.xml` 和 `assets/`。

部署地址：https://kuaima-cursor-pool.onrender.com/

## 客户端下载

- Windows：https://wwaps.lanzoue.com/i7DfZ3o5iolg
- macOS：https://share.feijipan.com/s/J2xt9TWX

## 联系

客服微信：`Aka-CncLC`

---

<a id="english"></a>

## English

**KuaiMa Cursor Pool** official website. A zero-dependency, fully static bilingual (Chinese / English) marketing site with a dark-tech aesthetic and cyan-to-emerald gradient palette.

### Features

- **Static stack**: HTML + CSS + Vanilla JS, no build step
- **i18n**: Lightweight `data-i18n` based bilingual switcher
- **Responsive**: 480 / 767 / 1023 breakpoints, with touch hover-stickiness fix
- **SEO**: JSON-LD (SoftwareApplication / HowTo), hreflang, canonical, OG/Twitter, sitemap.xml, robots.txt
- **Lazy GIF tutorial**: Native `loading="lazy"`, images preserve original aspect ratio
- **Copy WeChat ID**: One-click copy with dual fallback (Clipboard API + execCommand)

### Run Locally

```bash
python serve.py
# visit http://localhost:8000/
```

### Deploy

The site is currently deployed as a Render Static Site. Only static assets are required for production.

Live: https://kuaima-cursor-pool.onrender.com/

### Contact

WeChat Support: `Aka-CncLC`

---

## License

仅作为产品官网展示使用，非开源代码项目。/ Used only as the product's marketing site, not an open-source library.

This site is **not officially affiliated with Cursor** (anysphere.com). It is a third-party account management tool for Cursor users.
