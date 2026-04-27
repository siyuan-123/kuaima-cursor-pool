/**
 * 国际化模块（中英双语）
 * 通过 data-i18n / data-i18n-attr 自动绑定文本
 */
(function (global) {
  'use strict';

  const LANG_KEY = 'kuaima_lang';
  const SUPPORTED = ['zh', 'en'];
  const DEFAULT = 'zh';

  const dict = {
    zh: {
      brand: '快码 cursor 号池',
      // SEO
      'seo.home.title': '快码 Cursor 号池 | Cursor 无感换号账号池 · 按刀计费',
      'seo.home.description': '快码 Cursor 号池提供 Cursor 账号池、无感换号、账号自动切换和按刀计费方案，支持 Windows/macOS，适合 AI 编程用户快速上手。',
      'seo.tutorial.title': 'Cursor 无感换号使用教程 | 快码 Cursor 号池',
      'seo.tutorial.description': '快码 Cursor 号池使用教程：了解如何下载客户端、完成充值、开启 Cursor 无感换号，并在额度耗尽时自动切换账号继续编码。',
      // Nav
      'nav.home': '首页',
      'nav.tutorial': '使用教程',
      'nav.download': '下载',
      'nav.contact': '联系客服',
      // Hero
      'hero.badge': '官方账号 · 按刀计费 · 支持开票',
      'hero.title.line1': '一键无感换号',
      'hero.title.line2': '专注写代码，账号交给我们',
      'hero.title.line3': '支持开票',
      'hero.lead': '快码是 Cursor 的官方账号号池工具，无需手动登录，按实际消耗的刀数计费，再也不用为月费焦虑。',
      'hero.cta.windows': '下载 Windows 版',
      'hero.cta.macos': '下载 macOS 版',
      'hero.cta.tutorial': '查看使用教程',
      'hero.hint': '支持 Windows 10/11 与 macOS 11+，无需注册即可使用',
      // Features
      'features.eyebrow': '核心特性',
      'features.title': '为什么选择快码',
      'features.lead': '我们专注让 Cursor 用户摆脱账号管理的烦恼，把每一刀都用在刀刃上',
      'features.f1.title': '无感换号',
      'features.f1.desc': '账号额度耗尽时自动切换，零中断、零干扰，写代码的节奏不被打断',
      'features.f2.title': '官方账号',
      'features.f2.desc': '所有账号均为 Cursor 官方注册，稳定可靠，无封号风险',
      'features.f3.title': '官方账单计费',
      'features.f3.desc': '按 Cursor 官方账单的真实刀数结算，公开透明，绝无水分',
      'features.f4.title': '按刀计费',
      'features.f4.desc': '只为实际消耗付费，不再有月费包袱，用多少刀给多少钱',
      'features.f5.title': '支持开票',
      'features.f5.desc': '支持企业开具正规增值税发票，公司采购、对账、报销无忧',
      'features.f5.badge': '核心卖点',
      // Pricing
      'pricing.eyebrow': '计费理念',
      'pricing.title': '把每一分钱花在真正用到的地方',
      'pricing.lead': '没有月费、没有阶梯、没有强制订阅。你的支付只与「真实消耗的刀数」挂钩。',
      'pricing.point1.title': '官方账单为准',
      'pricing.point1.desc': '基于 Cursor 官方账单的真实数据结算，可在软件内随时查看',
      'pricing.point2.title': '无月费订阅',
      'pricing.point2.desc': '不充就不扣费，长期不用也不会有任何月费/包月扣费',
      'pricing.point3.title': '按需充值',
      'pricing.point3.desc': '想用多少充多少，余额永久有效，灵活掌控自己的预算',
      'pricing.point4.title': '透明无套路',
      'pricing.point4.desc': '不会有「服务费」「转账费」等隐形支出，所见即所得',
      // CTA
      'cta.title': '准备好开始了吗？',
      'cta.lead': '下载客户端，三步即可启用 Cursor 无感换号',
      'cta.tutorial': '阅读使用教程',
      'cta.download': '立即下载',
      // Footer
      'footer.brand.desc': '快码 cursor 号池 —— 让 AI 编程更纯粹。无感换号 · 官方账号 · 按刀计费。',
      'footer.col1.title': '产品',
      'footer.col1.win': 'Windows 版下载',
      'footer.col1.mac': 'macOS 版下载',
      'footer.col1.tutorial': '使用教程',
      'footer.col2.title': '联系',
      'footer.contact.label': '客服微信',
      'footer.copy': '复制',
      'footer.copied': '已复制',
      'footer.copyright': '© 2026 快码 cursor 号池. All rights reserved.',
      'footer.note': '与 Cursor 无官方关联，仅为第三方账号管理工具',
      // Tutorial
      'tutorial.title': '使用教程',
      'tutorial.lead': '三步上手快码，从充值到无感换号，全过程不超过 2 分钟',
      'tutorial.step1.title': '在线充值',
      'tutorial.step1.desc': '支持 24 小时在线充值，余额立刻到账，未使用部分支持提现，24 小时内提现完毕。',
      'tutorial.step2.title': '无感换号',
      'tutorial.step2.desc': '开启之后，自动接管账号配置，无需频繁切号，自动承接上下文，无缝写代码。',
      'tutorial.step3.title': '首次上号',
      'tutorial.step3.desc': '打开 Cursor 以及客户端，点击号池启用，便可一键上号。',
      'tutorial.cta.title': '看完教程，立即开始',
      'tutorial.cta.lead': '点击下方按钮下载客户端,开启你的无感写码之旅',
      'tutorial.back': '返回首页',
      // Toast
      'toast.copied': '微信号已复制到剪贴板',
      'toast.loading': '加载中...',
      // Misc
      'lang.zh': '中',
      'lang.en': 'EN'
    },

    en: {
      brand: 'KuaiMa · Cursor Pool',
      // SEO
      'seo.home.title': 'KuaiMa Cursor Pool | Seamless Cursor Account Switching',
      'seo.home.description': 'KuaiMa Cursor Pool helps Cursor users switch accounts seamlessly, manage account pools, and pay only for actual usage on Windows and macOS.',
      'seo.tutorial.title': 'Cursor Seamless Switching Tutorial | KuaiMa Cursor Pool',
      'seo.tutorial.description': 'Learn how to download KuaiMa, top up your balance, enable seamless Cursor account switching, and keep coding when quota runs out.',
      'nav.home': 'Home',
      'nav.tutorial': 'Tutorial',
      'nav.download': 'Download',
      'nav.contact': 'Contact',
      'hero.badge': 'Official Accounts · Pay-per-Dollar · Invoice Available',
      'hero.title.line1': 'Seamless Account Switching',
      'hero.title.line2': 'Focus on coding. We handle the accounts.',
      'hero.title.line3': 'Invoice Available',
      'hero.lead': 'KuaiMa is an official Cursor account pool tool. No manual login. Pay only for the dollars you actually consume. Never worry about monthly fees again.',
      'hero.cta.windows': 'Download for Windows',
      'hero.cta.macos': 'Download for macOS',
      'hero.cta.tutorial': 'View Tutorial',
      'hero.hint': 'Supports Windows 10/11 and macOS 11+. No sign-up required.',
      'features.eyebrow': 'Core Features',
      'features.title': 'Why Choose KuaiMa',
      'features.lead': 'We free Cursor users from account management headaches, so every dollar goes where it should.',
      'features.f1.title': 'Seamless Switching',
      'features.f1.desc': 'Switch accounts automatically when quota runs out. Zero interruption to your coding flow.',
      'features.f2.title': 'Official Accounts',
      'features.f2.desc': 'All accounts are registered through Cursor official channels. Stable and ban-free.',
      'features.f3.title': 'Official Billing',
      'features.f3.desc': 'Settled by real dollar amounts on Cursor official invoices. Transparent and verifiable.',
      'features.f4.title': 'Pay-per-Dollar',
      'features.f4.desc': 'Pay only for what you actually use. No monthly subscription. Spend exactly what you consume.',
      'features.f5.title': 'Invoice Available',
      'features.f5.desc': 'Issue official VAT invoices for businesses. Procurement, reconciliation and reimbursement made easy.',
      'features.f5.badge': 'Key Benefit',
      'pricing.eyebrow': 'Pricing Philosophy',
      'pricing.title': 'Every Cent Goes Where It Counts',
      'pricing.lead': 'No monthly fee, no tier traps, no forced subscription. You only pay for the dollars actually consumed.',
      'pricing.point1.title': 'Official Billing as Source',
      'pricing.point1.desc': 'Settled based on real Cursor invoices. Verifiable from within the app at any time.',
      'pricing.point2.title': 'No Monthly Subscription',
      'pricing.point2.desc': 'No top-up means no charge. No background billing if you go inactive.',
      'pricing.point3.title': 'Top-up On Demand',
      'pricing.point3.desc': 'Top up as much as you need. Balance never expires. You are always in control.',
      'pricing.point4.title': 'Transparent Pricing',
      'pricing.point4.desc': 'No hidden service fees, transfer fees or surcharges. What you see is what you pay.',
      'cta.title': 'Ready to Get Started?',
      'cta.lead': 'Download the client and enable seamless Cursor account switching in three steps.',
      'cta.tutorial': 'Read Tutorial',
      'cta.download': 'Download Now',
      'footer.brand.desc': 'KuaiMa Cursor Pool — keep AI coding pure. Seamless switching, official accounts, pay-per-dollar.',
      'footer.col1.title': 'Product',
      'footer.col1.win': 'Windows Download',
      'footer.col1.mac': 'macOS Download',
      'footer.col1.tutorial': 'Tutorial',
      'footer.col2.title': 'Contact',
      'footer.contact.label': 'WeChat Support',
      'footer.copy': 'Copy',
      'footer.copied': 'Copied',
      'footer.copyright': '© 2026 KuaiMa Cursor Pool. All rights reserved.',
      'footer.note': 'Not officially affiliated with Cursor. Third-party account management tool only.',
      'tutorial.title': 'How to Use',
      'tutorial.lead': 'Get started with KuaiMa in three steps. From top-up to seamless switching in under two minutes.',
      'tutorial.step1.title': 'Top up Online',
      'tutorial.step1.desc': '24/7 online top-up. Balance credited instantly. Unused funds are refundable and cashed out within 24 hours.',
      'tutorial.step2.title': 'Seamless Switching',
      'tutorial.step2.desc': 'Once enabled, KuaiMa takes over account config automatically. No more frequent switching, your context is preserved, code seamlessly.',
      'tutorial.step3.title': 'First-time Sign In',
      'tutorial.step3.desc': 'Open Cursor and the client, click "Pool Enable", and you are signed in with one click.',
      'tutorial.cta.title': 'Done Reading? Start Now',
      'tutorial.cta.lead': 'Hit the button below to download the client and begin your seamless coding journey.',
      'tutorial.back': 'Back to Home',
      'toast.copied': 'WeChat ID copied to clipboard',
      'toast.loading': 'Loading...',
      'lang.zh': 'CN',
      'lang.en': 'EN'
    }
  };

  function detectInitial() {
    const url = new URL(global.location.href);
    const queryLang = url.searchParams.get('lang');
    if (queryLang && SUPPORTED.includes(queryLang)) return queryLang;

    const stored = global.localStorage && localStorage.getItem(LANG_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    const browser = (navigator.language || 'zh').toLowerCase();
    if (browser.startsWith('en')) return 'en';
    return DEFAULT;
  }

  function get(key, lang) {
    const table = dict[lang] || dict[DEFAULT];
    return table[key] != null ? table[key] : key;
  }

  function applyTo(root, lang) {
    const targets = root.querySelectorAll('[data-i18n]');
    targets.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = get(key, lang);
    });

    const attrTargets = root.querySelectorAll('[data-i18n-attr]');
    attrTargets.forEach(el => {
      const config = el.getAttribute('data-i18n-attr');
      if (!config) return;
      config.split('|').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (!attr || !key) return;
        el.setAttribute(attr, get(key, lang));
      });
    });

    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    const titleKey = document.querySelector('meta[name="i18n-title"]');
    if (titleKey) {
      const tk = titleKey.getAttribute('content');
      if (tk) document.title = get(tk, lang);
    }

    const descKey = document.querySelector('meta[name="i18n-description"]');
    if (descKey) {
      const dk = descKey.getAttribute('content');
      const metaDesc = document.querySelector('meta[name="description"]');
      if (dk && metaDesc) metaDesc.setAttribute('content', get(dk, lang));
    }
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {}
    applyTo(document, lang);
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const target = btn.getAttribute('data-lang-btn');
      btn.classList.toggle('is-active', target === lang);
    });
    global.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function init() {
    const lang = detectInitial();
    setLang(lang);

    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-lang-btn');
        setLang(target);
      });
    });
  }

  global.I18n = {
    init,
    setLang,
    get,
    current() {
      return document.documentElement.getAttribute('data-lang') || DEFAULT;
    },
    supported: SUPPORTED.slice()
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
