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

  function init() {
    if (initialized) return;
    initialized = true;

    initLazyMedia();
    initCopyButtons();
    initFloatingWechat();
    initMenuToggle();
    initOSDetection();
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
      container.setAttribute('data-loading-text', '加载失败,请刷新');
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

  /** ---------------------- 悬浮客服二维码 ---------------------- */
  function initFloatingWechat() {
    const widget = document.querySelector('[data-floating-wechat]');
    if (!widget) return;

    const toggle = widget.querySelector('[data-floating-wechat-toggle]');
    const panel = widget.querySelector('.floating-wechat__panel');
    const close = widget.querySelector('[data-floating-wechat-close]');
    if (!toggle || !panel) return;

    function setOpen(open) {
      widget.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    setOpen(widget.classList.contains('is-open'));

    toggle.addEventListener('click', e => {
      e.preventDefault();
      setOpen(!widget.classList.contains('is-open'));
    });

    if (close) {
      close.addEventListener('click', e => {
        e.preventDefault();
        setOpen(false);
        toggle.focus();
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') setOpen(false);
    });

    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      widget.addEventListener('mouseenter', () => setOpen(true));
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
