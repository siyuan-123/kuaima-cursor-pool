/**
 * 全局交互入口
 *  - GIF / 元素懒加载（IntersectionObserver，作为 native lazy 的 fallback）
 *  - 系统检测：Mac 优先显示 macOS 按钮
 *  - 客服联系方式一键复制（按钮自身反馈）
 *  - 移动端导航开合
 *  - 锚点平滑滚动（含 #top 回顶）
 */
(function () {
  'use strict';

  var initialized = false;

  // 下载链接配置（统一改动这里即可，所有入口同步生效）
  var DOWNLOAD_URLS = {
    win: 'https://wwaps.lanzoue.com/i7DfZ3o5iolg',
    mac: 'https://share.feijipan.com/s/ud4OdIFj'
  };

  function init() {
    if (initialized) return;
    initialized = true;

    initLazyMedia();
    initCopyButtons();
    initFloatingWechat();
    initMenuToggle();
    initOSDetection();
    initSmartDownload();
    initDownloadHelper();
    initLangChangeReset();
    initSmoothAnchor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /** ---------------------- 锚点跳转 ---------------------- */
  function initSmoothAnchor() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;

        if (href === '#top') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (history.replaceState) history.replaceState(null, '', ' ');
          return;
        }

        if (href === '#contact' && typeof window.KuaiMaOpenSupport === 'function') {
          e.preventDefault();
          window.KuaiMaOpenSupport({ focus: true });
          if (history.replaceState) history.replaceState(null, '', '#contact');
          return;
        }

        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (history.replaceState) history.replaceState(null, '', href);
      });
    });
  }

  /** ---------------------- 懒加载 ---------------------- */
  function initLazyMedia() {
    const targets = document.querySelectorAll('[data-src]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => loadMedia(el));
      return;
    }

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMedia(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '300px 0px',
      threshold: 0.01
    });

    targets.forEach(el => io.observe(el));

    setTimeout(() => {
      document.querySelectorAll('[data-src]').forEach(el => {
        if (el.classList.contains('is-loading')) {
          loadMedia(el);
        }
      });
    }, 4000);
  }

  function loadMedia(container) {
    const src = container.getAttribute('data-src');
    if (!src) return;
    const altText = container.getAttribute('data-alt') || '';

    const img = new Image();
    img.alt = altText;
    img.loading = 'lazy';
    img.decoding = 'async';

    img.addEventListener('load', () => {
      container.classList.remove('is-loading');
      container.appendChild(img);
    });

    img.addEventListener('error', () => {
      container.classList.remove('is-loading');
      container.classList.add('is-error');
      container.setAttribute('data-loading-text', '加载失败，请刷新');
    });

    img.src = src;
  }

  /** ---------------------- 复制联系方式 ---------------------- */
  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const text = btn.getAttribute('data-copy') || '';
        markCopied(btn);
        copyToClipboard(text);
      });
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {}
  }

  function markCopied(btn) {
    btn.classList.add('is-success');
    const originalKey = btn.getAttribute('data-i18n') || 'footer.copy';
    btn.textContent = translate('footer.copied');
    if (btn._copyResetTimer) clearTimeout(btn._copyResetTimer);
    btn._copyResetTimer = setTimeout(() => {
      btn.classList.remove('is-success');
      btn.textContent = translate(originalKey);
    }, 1800);
  }

  /** ---------------------- 悬浮客服 + 中央弹窗 ---------------------- */
  function initFloatingWechat() {
    const widget = document.querySelector('[data-floating-wechat]');
    if (!widget) return;

    const toggle = widget.querySelector('[data-floating-wechat-toggle]');
    const panel = widget.querySelector('.floating-wechat__panel');
    const close = widget.querySelector('[data-floating-wechat-close]');
    const backdrop = widget.querySelector('[data-floating-wechat-backdrop]');
    const hint = widget.querySelector('[data-floating-wechat-hint]');
    if (!toggle || !panel) return;

    const SEEN_KEY = 'kuaima_support_seen';
    const FOCUSABLE_SEL = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;
    let hintTimer = 0;

    function isSeen() {
      try {
        return window.localStorage && window.localStorage.getItem(SEEN_KEY) === '1';
      } catch (err) {
        return false;
      }
    }

    function markSeen() {
      try {
        if (window.localStorage) window.localStorage.setItem(SEEN_KEY, '1');
      } catch (err) {
        // 静默忽略：隐私模式下 localStorage 可能不可用
      }
      widget.classList.add('is-seen');
    }

    function setHintVisible(visible) {
      widget.classList.toggle('is-hint-visible', !!visible);
      if (hint) hint.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    function setOpen(open) {
      widget.classList.toggle('is-modal-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (backdrop) {
        if (open) backdrop.removeAttribute('hidden');
        else backdrop.setAttribute('hidden', '');
      }
      document.body.classList.toggle('is-support-open', open);
    }

    function openSupport(options) {
      const opts = options || {};
      lastFocused = document.activeElement;
      setHintVisible(false);
      window.clearTimeout(hintTimer);
      markSeen();
      setOpen(true);

      if (opts.focus !== false) {
        const focusTarget = close || panel.querySelector(FOCUSABLE_SEL) || panel;
        window.setTimeout(() => {
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus({ preventScroll: true });
          }
        }, 60);
      }
    }

    function closeSupport() {
      if (!widget.classList.contains('is-modal-open')) return;
      setOpen(false);
      const target = lastFocused && document.contains(lastFocused) ? lastFocused : toggle;
      if (target && typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
    }

    window.KuaiMaOpenSupport = openSupport;
    window.KuaiMaCloseSupport = closeSupport;

    setOpen(false);

    toggle.addEventListener('click', e => {
      e.preventDefault();
      if (widget.classList.contains('is-modal-open')) closeSupport();
      else openSupport({ focus: true });
    });

    if (close) {
      close.addEventListener('click', e => {
        e.preventDefault();
        closeSupport();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => closeSupport());
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && widget.classList.contains('is-modal-open')) {
        closeSupport();
      }
    });

    if (window.location.hash === '#contact') {
      window.setTimeout(() => openSupport({ focus: false }), 160);
    }

    if (!isSeen()) {
      hintTimer = window.setTimeout(() => {
        if (!widget.classList.contains('is-modal-open')) {
          setHintVisible(true);
          hintTimer = window.setTimeout(() => setHintVisible(false), 3200);
        }
      }, 600);
    } else {
      widget.classList.add('is-seen');
    }
  }

  /** ---------------------- 移动端菜单 ---------------------- */
  function initMenuToggle() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('primaryNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /** ---------------------- 系统检测 ---------------------- */
  function initOSDetection() {
    const ua = navigator.userAgent || '';
    const platform = (navigator.platform || '').toLowerCase();
    const isMac = /mac/.test(platform) || /macintosh/i.test(ua);
    const isWin = /win/.test(platform) || /windows/i.test(ua);

    const winBtn = document.querySelector('[data-download="windows"]');
    const macBtn = document.querySelector('[data-download="macos"]');
    if (!winBtn || !macBtn) return;

    if (isMac) {
      reorderDownload(macBtn, winBtn);
    } else if (isWin) {
      reorderDownload(winBtn, macBtn);
    }
  }

  function reorderDownload(primary, secondary) {
    primary.classList.remove('btn-secondary');
    primary.classList.add('btn-primary');
    secondary.classList.remove('btn-primary');
    secondary.classList.add('btn-secondary');

    const parent = primary.parentNode;
    if (parent && parent.firstElementChild !== primary) {
      parent.insertBefore(primary, parent.firstElementChild);
    }
  }

  /** ---------------------- 智能下载跳转 ---------------------- */
  function detectOS() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();
    const uaData = navigator.userAgentData || null;

    // 新版 UA Client Hints 优先
    if (uaData && uaData.platform) {
      const p = uaData.platform.toLowerCase();
      if (uaData.mobile) return 'mobile';
      if (p.indexOf('mac') !== -1) return 'mac';
      if (p.indexOf('win') !== -1) return 'win';
      if (p.indexOf('linux') !== -1) return 'linux';
    }

    // 移动端嗅探（含 Android / iOS / Windows Phone / 通用 mobile 标识）
    if (/iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini/i.test(ua)) {
      return 'mobile';
    }
    // iPad 13+ 在桌面模式下伪装成 Macintosh，借助 maxTouchPoints 区分
    if (/ipad/i.test(ua) || (platform.indexOf('mac') !== -1 && navigator.maxTouchPoints > 1)) {
      return 'mobile';
    }
    // Android 平板
    if (/android/i.test(ua)) {
      return 'mobile';
    }

    if (/mac/.test(platform) || /macintosh/i.test(ua)) return 'mac';
    if (/win/.test(platform) || /windows/i.test(ua)) return 'win';
    if (/linux/.test(platform) || /linux/i.test(ua) || /cros/i.test(ua)) return 'linux';
    return 'unknown';
  }

  function smartDownload(preferOS) {
    const os = preferOS || detectOS();

    if (os === 'win' || os === 'mac') {
      window.open(DOWNLOAD_URLS[os], '_blank', 'noopener,noreferrer');
      return os;
    }
    if (os === 'mobile') {
      openDownloadHelper('mobile');
      return os;
    }
    // linux / unknown 走选择器
    openDownloadHelper('picker');
    return os;
  }

  window.KuaiMaSmartDownload = smartDownload;

  function openDownloadHelper(state) {
    const helper = document.querySelector('[data-download-helper]');
    if (!helper) {
      // 没有助手 DOM 时降级：直接打开 win 链接
      window.open(DOWNLOAD_URLS.win, '_blank', 'noopener,noreferrer');
      return;
    }
    helper.setAttribute('data-state', state || 'picker');
    helper.classList.add('is-open');
    document.body.classList.add('is-helper-open');

    const closeBtn = helper.querySelector('[data-download-helper-close]');
    if (closeBtn) {
      window.setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
    }
  }

  function closeDownloadHelper() {
    const helper = document.querySelector('[data-download-helper]');
    if (!helper) return;
    helper.classList.remove('is-open');
    document.body.classList.remove('is-helper-open');
  }

  window.KuaiMaCloseDownload = closeDownloadHelper;

  function initSmartDownload() {
    // 拦截所有标记了 data-smart-download 的入口
    document.querySelectorAll('[data-smart-download]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        smartDownload();
      });
    });
  }

  function initDownloadHelper() {
    const helper = document.querySelector('[data-download-helper]');
    if (!helper) return;

    const backdrop = helper.querySelector('[data-download-helper-backdrop]');
    const closeBtns = helper.querySelectorAll('[data-download-helper-close]');

    closeBtns.forEach(btn => btn.addEventListener('click', closeDownloadHelper));
    if (backdrop) backdrop.addEventListener('click', closeDownloadHelper);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && helper.classList.contains('is-open')) {
        closeDownloadHelper();
      }
    });

    // picker 模式中的 Win/Mac 选择按钮
    helper.querySelectorAll('[data-helper-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const os = btn.getAttribute('data-helper-pick');
        closeDownloadHelper();
        if (os === 'win' || os === 'mac') {
          window.open(DOWNLOAD_URLS[os], '_blank', 'noopener,noreferrer');
        }
      });
    });

    // mobile 模式中的复制链接按钮（复用 data-copy 走 copy-btn 流程）
    // 复制反馈由 initCopyButtons 接管，这里只兜底
  }

  /** ---------------------- 语言切换响应 ---------------------- */
  function initLangChangeReset() {
    window.addEventListener('langchange', () => {
      document.querySelectorAll('.copy-btn.is-success').forEach(btn => {
        btn.classList.remove('is-success');
        const key = btn.getAttribute('data-i18n') || 'footer.copy';
        btn.textContent = translate(key);
      });
    });
  }

  function translate(key) {
    if (window.I18n && typeof I18n.get === 'function') {
      const current = I18n.current();
      return I18n.get(key, current);
    }
    return key;
  }
})();
