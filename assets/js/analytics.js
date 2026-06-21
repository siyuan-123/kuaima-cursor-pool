(function () {
  'use strict';

  /**
   * 快码官网轻量埋点脚本
   * - 自动采集 PV、停留时长、滚动深度、详细点击事件
   * - visitorId 存 localStorage，sessionId 存 sessionStorage
   * - 上报接口可在页面中通过 window.KUAI_MA_ANALYTICS_ENDPOINT 覆盖
   */

  var DEFAULT_ENDPOINT = 'https://track.666166.top/api/track';
  var endpoint = window.KUAI_MA_ANALYTICS_ENDPOINT || DEFAULT_ENDPOINT;
  var heartbeatIntervalMs = Number(window.KUAI_MA_ANALYTICS_HEARTBEAT || 15000);
  var maxTextLength = 120;
  var startAt = Date.now();
  var lastHeartbeatAt = 0;
  var leaveSentAt = 0;
  var maxScrollPercent = 0;
  var pageViewSent = false;
  var visitorId = getOrCreateVisitorId();
  var sessionId = getOrCreateSessionId();

  if (!endpoint) return;

  ready(function () {
    updateScrollPercent();
    sendEvent('page_view', {
      loadTimeMs: getLoadTime(),
      viewport: getViewport(),
      screen: getScreen(),
      colorDepth: window.screen && window.screen.colorDepth,
      timezone: safeTimezone(),
      devicePixelRatio: window.devicePixelRatio || 1
    });
    pageViewSent = true;

    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', throttle(updateScrollPercent, 500), { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('beforeunload', handleLeave);

    if (heartbeatIntervalMs >= 5000) {
      window.setInterval(function () {
        if (document.visibilityState === 'hidden') return;
        sendHeartbeat(false);
      }, heartbeatIntervalMs);
    }
  });

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function getOrCreateVisitorId() {
    return getStorageId('kuaima_visitor_id', getSafeStorage('localStorage'), 'v');
  }

  function getOrCreateSessionId() {
    return getStorageId('kuaima_session_id', getSafeStorage('sessionStorage'), 's');
  }

  function getSafeStorage(name) {
    try {
      return window[name] || null;
    } catch (e) {
      return null;
    }
  }

  function getStorageId(key, storage, prefix) {
    try {
      var value = storage && storage.getItem(key);
      if (value) return value;
      value = prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
      if (storage) storage.setItem(key, value);
      return value;
    } catch (e) {
      return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
    }
  }

  function handleClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var clickable = target.closest('a, button, [role="button"], [data-copy], [data-lang-btn]');
    if (!clickable) return;

    var rect = safeRect(clickable);
    var href = clickable.href || clickable.getAttribute('href') || '';
    var category = classifyClick(clickable, href);

    sendEvent('click', {
      category: category,
      label: getElementLabel(clickable),
      targetText: trimText(clickable.innerText || clickable.textContent || ''),
      targetUrl: href,
      tagName: String(clickable.tagName || '').toLowerCase(),
      id: clickable.id || '',
      className: trimText(clickable.className || ''),
      dataI18n: clickable.getAttribute('data-i18n') || '',
      dataCopy: clickable.hasAttribute('data-copy') ? 'yes' : 'no',
      langButton: clickable.getAttribute('data-lang-btn') || '',
      x: typeof event.clientX === 'number' ? event.clientX : null,
      y: typeof event.clientY === 'number' ? event.clientY : null,
      elementTop: rect ? Math.round(rect.top + window.scrollY) : null,
      elementLeft: rect ? Math.round(rect.left + window.scrollX) : null,
      viewport: getViewport(),
      scrollPercent: maxScrollPercent
    });
  }

  function classifyClick(el, href) {
    var text = ((el.innerText || el.textContent || '') + ' ' + (el.getAttribute('data-i18n') || '') + ' ' + href).toLowerCase();
    if (el.hasAttribute('data-copy')) return 'copy_contact';
    if (el.hasAttribute('data-lang-btn')) return 'switch_language';
    if (href.indexOf('#contact') >= 0 || text.indexOf('contact') >= 0 || text.indexOf('客服') >= 0) return 'contact';
    if (href.indexOf('#download') >= 0) return 'download_section';
    if (/lanzou|feijipan|download|windows|macos|立即下载|下载/.test(text)) return 'download';
    if (/tutorial|教程|douyin|抖音/.test(text)) return 'tutorial';
    if (/^https?:\/\//i.test(href) && href.indexOf(location.hostname) === -1) return 'external_link';
    if (href && href.charAt(0) === '#') return 'anchor';
    return 'normal_click';
  }

  function getElementLabel(el) {
    return el.getAttribute('data-analytics-label') ||
      el.getAttribute('aria-label') ||
      el.getAttribute('data-i18n') ||
      el.getAttribute('title') ||
      trimText(el.innerText || el.textContent || '') ||
      el.id ||
      String(el.tagName || '').toLowerCase();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      sendHeartbeat(true);
    } else {
      sendEvent('page_visible', {
        durationMs: Date.now() - startAt,
        scrollPercent: maxScrollPercent
      });
    }
  }

  function handleLeave() {
    var now = Date.now();
    if (leaveSentAt && now - leaveSentAt < 2000) return;
    leaveSentAt = now;
    sendEvent('page_leave', {
      durationMs: now - startAt,
      scrollPercent: maxScrollPercent
    }, true);
  }

  function sendHeartbeat(forceBeacon) {
    var now = Date.now();
    if (!forceBeacon && now - lastHeartbeatAt < heartbeatIntervalMs - 1000) return;
    lastHeartbeatAt = now;
    sendEvent('heartbeat', {
      durationMs: now - startAt,
      scrollPercent: maxScrollPercent,
      visibilityState: document.visibilityState
    }, forceBeacon);
  }

  function sendEvent(eventName, data, preferBeacon) {
    var now = Date.now();
    var payload = {
      event: eventName,
      visitorId: visitorId,
      sessionId: sessionId,
      ts: now,
      page: location.pathname || '/',
      url: location.href,
      title: document.title,
      referrer: document.referrer || '',
      language: navigator.language || '',
      languages: navigator.languages || [],
      userAgent: navigator.userAgent || '',
      durationMs: data && typeof data.durationMs === 'number' ? Math.max(0, Math.round(data.durationMs)) : null,
      scrollPercent: data && typeof data.scrollPercent === 'number' ? data.scrollPercent : maxScrollPercent,
      data: data || {}
    };

    if (!pageViewSent && eventName !== 'page_view') {
      payload.data.beforePageView = true;
    }

    var body = JSON.stringify(payload);

    if (preferBeacon && navigator.sendBeacon) {
      try {
        // 跨域 sendBeacon 使用 text/plain，避免部分浏览器因非简单请求而丢弃关闭页上报。
        var blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
        if (navigator.sendBeacon(endpoint, blob)) return;
      } catch (e) {}
    }

    try {
      fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: !!preferBeacon
      }).catch(function () {});
    } catch (e) {}
  }

  function updateScrollPercent() {
    var doc = document.documentElement || document.body;
    var scrollTop = window.scrollY || doc.scrollTop || 0;
    var scrollHeight = Math.max(
      document.body ? document.body.scrollHeight : 0,
      doc ? doc.scrollHeight : 0
    );
    var viewportHeight = window.innerHeight || doc.clientHeight || 1;
    var total = Math.max(1, scrollHeight - viewportHeight);
    var percent = Math.min(100, Math.max(0, Math.round((scrollTop / total) * 100)));
    maxScrollPercent = Math.max(maxScrollPercent, percent);
  }

  function getLoadTime() {
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (nav) return Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0);
      if (performance.timing) return Math.max(0, performance.timing.loadEventEnd - performance.timing.navigationStart);
    } catch (e) {}
    return null;
  }

  function safeTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }

  function getViewport() {
    return {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0
    };
  }

  function getScreen() {
    return {
      width: window.screen ? window.screen.width : 0,
      height: window.screen ? window.screen.height : 0
    };
  }

  function safeRect(el) {
    try { return el.getBoundingClientRect(); } catch (e) { return null; }
  }

  function trimText(value) {
    value = String(value || '').replace(/\s+/g, ' ').trim();
    return value.length > maxTextLength ? value.slice(0, maxTextLength) + '…' : value;
  }

  function throttle(fn, wait) {
    var timer = null;
    var last = 0;
    return function () {
      var now = Date.now();
      var args = arguments;
      if (now - last >= wait) {
        last = now;
        fn.apply(null, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          timer = null;
          last = Date.now();
          fn.apply(null, args);
        }, wait - (now - last));
      }
    };
  }
})();
