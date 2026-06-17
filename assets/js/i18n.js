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
      'seo.home.title': 'Cursor 号池｜按需租用，额度无限续杯 | 快码',
      'seo.home.description': '快码 Cursor 号池支持按需租用 Cursor 账号，额度随用随取，无限续杯，普通 Auto 模型 0.1 元/刀，高级模型 1 元/刀，联系客服领取试用。',
      'seo.tutorial.title': 'Cursor 号池视频教程 | 快码 Cursor 号池',
      'seo.tutorial.description': '快码 Cursor 号池视频教程：软件下载安装与设置、号池运作与理解，点击跳转抖音教程，快速了解按需租用与额度续杯。',
      // Nav
      'nav.home': '首页',
      'nav.tutorial': '使用教程',
      'nav.download': '下载',
      'nav.contact': '联系客服',
      // Hero
      'hero.badge': '无限续杯 · 无限额度 · 按额度收费',
      'hero.title.line1': 'Cursor 号池｜按需租用',
      'hero.title.line2': '额度无限续杯',
      'hero.title.line3': '联系客服，领取试用！',
      'hero.lead': 'Cursor 号池，额度随用随取。不再反复注册账号，不再盯着额度焦虑。用的时候租一个账号，不用时自动归还号池，按实际使用额度计费。',
      'hero.cta.contact': '联系客服领取试用',
      'hero.cta.windows': '下载 Windows 版',
      'hero.cta.macos': '下载 macOS 版',
      'hero.cta.tutorial': '查看使用教程',
      'hero.price.auto.label': '普通 Auto 模型',
      'hero.price.auto.value': '仅 0.1 元 / 刀',
      'hero.price.advanced.label': '高级模型',
      'hero.price.advanced.value': '1 元 / 刀',
      'hero.price.mode.label': '计费方式',
      'hero.price.mode.value': '无限续杯 · 按额度收费',
      'hero.hint': '不确定是否适合？先加客服领取试用，跑通后再充值。',
      // WeChat Floating Support
      'wechat.aria': '微信客服',
      'wechat.toggle': '展开客服二维码',
      'wechat.close': '收起客服二维码',
      'wechat.handle': '客服',
      'wechat.eyebrow': '微信客服',
      'wechat.title': '扫码添加客服',
      'wechat.promo': '联系客服 · 领取试用',
      'wechat.desc': '试用、下载、充值或使用问题，扫码添加客服。备用 QQ：1051522712。',
      'wechat.copy': '复制备用QQ',
      'wechat.alt': '快码客服微信二维码',
      // Features
      'pool.eyebrow': '模式说明',
      'pool.title': '什么是 Cursor 号池？',
      'pool.lead': 'Cursor 号池是一个 Cursor 账号租赁平台，用的时候分配账号，不用时自动归还号池。',
      'pool.desc1': '当你需要使用 Cursor 时，系统会从号池中分配一个可用账号给你；使用结束后，账号会自动返回号池，继续供后续使用。',
      'pool.desc2': '你无需长期持有账号，也不用自己频繁注册、切换或管理额度，只需要专注写代码。',
      'pool.flow1.title': '需要时租用',
      'pool.flow1.desc': '从号池获取可用账号',
      'pool.flow2.title': '额度随用随取',
      'pool.flow2.desc': '不足时可持续续杯',
      'pool.flow3.title': '不用自动归还',
      'pool.flow3.desc': '减少账号管理成本',
      'features.eyebrow': '核心收益',
      'features.title': '为什么选择号池模式？',
      'features.lead': '把账号和额度问题交给号池，把注意力留给开发。',
      'features.recharge.title': '在线充值',
      'features.recharge.desc': '随冲随用，支持自助提现，24小时内到账',
      'features.f1.title': '避免反复注册账号',
      'features.f1.desc': '不用再为了额度问题频繁注册新账号，减少繁琐流程，把时间留给开发。',
      'features.f2.title': '避免写代码时分心看额度',
      'features.f2.desc': '使用过程中无需一直关注账号额度是否快用完，额度不足时可持续续杯。',
      'features.f3.title': '避免关键时刻没额度可用',
      'features.f3.desc': '无论是白天开发，还是凌晨赶项目，都可以随时从号池获取可用额度。',
      'features.f3.badge': '降低焦虑',
      'features.f4.title': '按额度收费',
      'features.f4.desc': '只为实际消耗付费，不再有月费包袱，用多少刀给多少钱。',
      'features.f5.title': '可用账号随取',
      'features.f5.desc': '需要时分配账号，不用时自动归还号池，减少账号管理负担。',
      'features.f5.badge': '核心卖点',
      // Pricing
      'pricing.eyebrow': '价格透明',
      'pricing.title': '先明确价格，再放心使用',
      'pricing.lead': '不包月、不强制订阅，按实际使用额度收费。普通 Auto 模型仅 0.1 元 / 刀，高级模型 1 元 / 刀。',
      'pricing.point1.title': '普通 Auto 模型',
      'pricing.point1.desc': '仅 0.1 元 / 刀，适合日常代码补全、问答和轻量开发。',
      'pricing.point2.title': '高级模型',
      'pricing.point2.desc': '1 元 / 刀，适合复杂任务、长上下文和更高质量模型需求。',
      'pricing.point3.title': '无限续杯',
      'pricing.point3.desc': '额度不足时可持续续杯，减少开发中断和额度焦虑。',
      'pricing.point4.title': '按额度收费',
      'pricing.point4.desc': '用多少算多少，不用不消耗，适合临时项目和长期开发。',
      // CTA
      'cta.title': '先试用，再决定',
      'cta.lead': '如果你还不确定怎么用，直接联系客服领取试用，客服会帮你完成首次上手。',
      'cta.contact': '联系客服领取试用',
      'cta.tutorial': '先看教程',
      'cta.download': '下载客户端',
      // Footer
      'footer.brand.desc': '快码 cursor 号池 —— 按需租用 · 无限续杯 · 按额度收费。',
      'footer.col1.title': '产品',
      'footer.col1.win': 'Windows 版下载',
      'footer.col1.mac': 'macOS 版下载',
      'footer.col1.tutorial': '使用教程',
      'footer.col2.title': '联系',
      'footer.contact.label': '备用 QQ',
      'footer.copy': '复制QQ',
      'footer.copied': '已复制',
      'footer.copyright': '© 2026 快码 cursor 号池. All rights reserved.',
      'footer.note': '与 Cursor 无官方关联，仅为第三方账号管理工具',
      // Tutorial
      'tutorial.eyebrow': '使用教程',
      'tutorial.title': 'Cursor 号池视频教程',
      'tutorial.lead': '直接点击下方抖音教程，先看下载安装与号池运作；看不懂也可以直接联系客服领取试用。',
      'tutorial.video1.title': '软件的下载安装与设置',
      'tutorial.video1.desc': '从下载客户端到基础设置，跟着视频完成第一次上手。',
      'tutorial.video2.title': '号池的运作与理解',
      'tutorial.video2.desc': '理解账号如何分配、额度如何续杯，以及为什么可以减少注册和切号焦虑。',
      'tutorial.video.watch': '点击观看抖音教程',
      'tutorial.step1.title': '软件下载安装',
      'tutorial.step1.desc': '通过抖音视频完成客户端下载安装与基础设置。',
      'tutorial.step2.title': '理解号池运作',
      'tutorial.step2.desc': '通过抖音视频了解账号分配、额度续杯和按额度计费。',
      'tutorial.step3.title': '联系客服试用',
      'tutorial.step3.desc': '不确定怎么操作时，直接联系客服领取试用。',
      'tutorial.cta.title': '看不懂？直接联系客服',
      'tutorial.cta.lead': '你不需要自己研究太久，联系客服领取试用，先跑通一次再决定是否充值。',
      'tutorial.back': '返回首页',
      // Toast
      'toast.copied': '联系方式已复制到剪贴板',
      'toast.loading': '加载中...',
      // Misc
      'lang.zh': '中',
      'lang.en': 'EN'
    },

    en: {
      brand: 'KuaiMa · Cursor Pool',
      // SEO
      'seo.home.title': 'Cursor Pool Rental | On-demand Accounts and Unlimited Quota Refill',
      'seo.home.description': 'KuaiMa Cursor Pool offers on-demand Cursor account rental, quota on demand, unlimited refills, Auto model at ¥0.1 per dollar and advanced models at ¥1 per dollar. Contact support for a trial.',
      'seo.tutorial.title': 'Cursor Pool Video Tutorial | KuaiMa Cursor Pool',
      'seo.tutorial.description': 'KuaiMa Cursor Pool video tutorials: software download and setup, how the account pool works, and how on-demand rental and quota refills are used.',
      'nav.home': 'Home',
      'nav.tutorial': 'Tutorial',
      'nav.download': 'Download',
      'nav.contact': 'Contact',
      'hero.badge': 'Unlimited Refill · Unlimited Quota · Pay by Usage',
      'hero.title.line1': 'Cursor Pool｜On-demand Rental',
      'hero.title.line2': 'Unlimited Quota Refill',
      'hero.title.line3': 'Contact support for a trial!',
      'hero.lead': 'Cursor Pool gives you quota when you need it. No repeated account registration, no quota anxiety. Rent an account when coding, return it to the pool when done, and pay by actual usage.',
      'hero.cta.contact': 'Contact Support for Trial',
      'hero.cta.windows': 'Download for Windows',
      'hero.cta.macos': 'Download for macOS',
      'hero.cta.tutorial': 'View Tutorial',
      'hero.price.auto.label': 'Auto Model',
      'hero.price.auto.value': 'Only ¥0.1 / dollar',
      'hero.price.advanced.label': 'Advanced Models',
      'hero.price.advanced.value': '¥1 / dollar',
      'hero.price.mode.label': 'Billing',
      'hero.price.mode.value': 'Unlimited refill · Pay by quota',
      'hero.hint': 'Not sure yet? Add support for a trial first, then top up after it works for you.',
      'wechat.aria': 'WeChat Support',
      'wechat.toggle': 'Open support QR code',
      'wechat.close': 'Collapse support QR code',
      'wechat.handle': 'Support',
      'wechat.eyebrow': 'WeChat Support',
      'wechat.title': 'Scan to add support',
      'wechat.promo': 'Contact support · Get a trial',
      'wechat.desc': 'For trial, download, top-up or setup questions, scan the QR code. Backup QQ: 1051522712.',
      'wechat.copy': 'Copy backup QQ',
      'wechat.alt': 'KuaiMa WeChat support QR code',
      'pool.eyebrow': 'How It Works',
      'pool.title': 'What is Cursor Pool?',
      'pool.lead': 'Cursor Pool is a Cursor account rental platform. Get an account when needed, and return it automatically when done.',
      'pool.desc1': 'When you need Cursor, the system assigns an available account from the pool. After use, the account returns to the pool for later users.',
      'pool.desc2': 'You do not need to hold accounts long term or repeatedly register, switch and manage quota yourself. Just focus on coding.',
      'pool.flow1.title': 'Rent when needed',
      'pool.flow1.desc': 'Get an available account from the pool',
      'pool.flow2.title': 'Quota on demand',
      'pool.flow2.desc': 'Refill continuously when quota is low',
      'pool.flow3.title': 'Return when done',
      'pool.flow3.desc': 'Reduce account management overhead',
      'features.eyebrow': 'Core Benefits',
      'features.title': 'Why choose the pool model?',
      'features.lead': 'Leave accounts and quota to the pool, and keep your attention on development.',
      'features.recharge.title': 'Online Top-Up',
      'features.recharge.desc': 'Top up and use instantly, with self-service withdrawals arriving within 24 hours.',
      'features.f1.title': 'Avoid repeated registration',
      'features.f1.desc': 'No more registering new accounts just for quota. Reduce busywork and save time for development.',
      'features.f2.title': 'Stop watching quota while coding',
      'features.f2.desc': 'No need to keep checking whether the quota is running out. Refill continuously when needed.',
      'features.f3.title': 'Avoid running out at critical moments',
      'features.f3.desc': 'Whether daytime development or late-night project rush, you can get available quota from the pool.',
      'features.f3.badge': 'Less Anxiety',
      'features.f4.title': 'Pay by quota',
      'features.f4.desc': 'Pay only for actual usage, without monthly pressure. Spend according to real consumption.',
      'features.f5.title': 'Accounts on demand',
      'features.f5.desc': 'Get an account when needed and return it to the pool when done, reducing account management effort.',
      'features.f5.badge': 'Key Benefit',
      'pricing.eyebrow': 'Transparent Pricing',
      'pricing.title': 'Know the price first, then use with confidence',
      'pricing.lead': 'No monthly lock-in and no forced subscription. Pay by actual quota usage. Auto model is only ¥0.1 per dollar, advanced models are ¥1 per dollar.',
      'pricing.point1.title': 'Auto Model',
      'pricing.point1.desc': 'Only ¥0.1 per dollar, suitable for daily completion, Q&A and lightweight development.',
      'pricing.point2.title': 'Advanced Models',
      'pricing.point2.desc': '¥1 per dollar, suitable for complex tasks, longer context and higher-quality model needs.',
      'pricing.point3.title': 'Unlimited Refill',
      'pricing.point3.desc': 'Refill continuously when quota is low, reducing development interruption and quota anxiety.',
      'pricing.point4.title': 'Pay by Quota',
      'pricing.point4.desc': 'Pay for what you use. No usage means no consumption, good for temporary projects and long-term development.',
      'cta.title': 'Try first, decide later',
      'cta.lead': 'If you are not sure how to use it, contact support for a trial. Support will help you get started.',
      'cta.contact': 'Contact Support for Trial',
      'cta.tutorial': 'View Tutorial First',
      'cta.download': 'Download Client',
      'footer.brand.desc': 'KuaiMa Cursor Pool — on-demand rental, unlimited refill, pay by quota.',
      'footer.col1.title': 'Product',
      'footer.col1.win': 'Windows Download',
      'footer.col1.mac': 'macOS Download',
      'footer.col1.tutorial': 'Tutorial',
      'footer.col2.title': 'Contact',
      'footer.contact.label': 'Backup QQ',
      'footer.copy': 'Copy QQ',
      'footer.copied': 'Copied',
      'footer.copyright': '© 2026 KuaiMa Cursor Pool. All rights reserved.',
      'footer.note': 'Not officially affiliated with Cursor. Third-party account management tool only.',
      'tutorial.eyebrow': 'Tutorial',
      'tutorial.title': 'Cursor Pool Video Tutorial',
      'tutorial.lead': 'Click the Douyin tutorials below to learn download/setup and how the pool works. If it is still unclear, contact support for a trial.',
      'tutorial.video1.title': 'Software Download and Setup',
      'tutorial.video1.desc': 'Follow the video from client download to basic setup and complete your first start.',
      'tutorial.video2.title': 'How the Pool Works',
      'tutorial.video2.desc': 'Understand account assignment, quota refill, and why this reduces registration and switching anxiety.',
      'tutorial.video.watch': 'Watch Douyin Tutorial',
      'tutorial.step1.title': 'Software Download',
      'tutorial.step1.desc': 'Use the Douyin video to complete client download and basic setup.',
      'tutorial.step2.title': 'Understand Pool Logic',
      'tutorial.step2.desc': 'Use the Douyin video to understand account assignment, quota refill and pay-by-quota billing.',
      'tutorial.step3.title': 'Contact Support for Trial',
      'tutorial.step3.desc': 'If you are not sure how to operate it, contact support for a trial.',
      'tutorial.cta.title': 'Still unclear? Contact support',
      'tutorial.cta.lead': 'You do not need to study for long. Contact support for a trial, verify it once, then decide whether to top up.',
      'tutorial.back': 'Back to Home',
      'toast.copied': 'Contact copied to clipboard',
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
