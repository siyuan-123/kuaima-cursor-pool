/**
 * 客服弹窗自检测试脚本
 * 使用方式：
 *   1) 打开 index.html
 *   2) 浏览器控制台粘贴并执行下面整个脚本
 *   3) 控制台会输出每一项检查结果（PASS / FAIL）
 *
 * 涵盖：
 *   - DOM 节点完整性
 *   - 初始状态（关闭/aria/滚动锁）
 *   - 打开/关闭三种路径（× 按钮、遮罩、ESC）
 *   - 焦点与 aria 状态切换
 *   - localStorage 已读标记
 *   - dock 切换行为
 */
(function () {
  'use strict';

  const results = [];
  function check(name, cond, detail) {
    results.push({ name: name, pass: !!cond, detail: detail || '' });
    const tag = cond ? 'PASS' : 'FAIL';
    const style = cond ? 'color:#10b981;font-weight:700' : 'color:#ef4444;font-weight:700';
    console.log('%c[' + tag + ']%c ' + name + (detail ? '  →  ' + detail : ''), style, 'color:inherit');
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  async function run() {
    console.group('客服弹窗自检测试');

    // 1) DOM 节点完整性
    const widget = document.querySelector('[data-floating-wechat]');
    const dock = document.querySelector('[data-floating-wechat-toggle]');
    const panel = document.querySelector('.floating-wechat__panel');
    const backdrop = document.querySelector('[data-floating-wechat-backdrop]');
    const closeBtn = document.querySelector('[data-floating-wechat-close]');
    const dot = document.querySelector('[data-floating-wechat-dot]');
    const hint = document.querySelector('[data-floating-wechat-hint]');
    const qrImg = document.querySelector('.floating-wechat__qr img');
    const copyBtn = document.querySelector('.floating-wechat__copy');

    check('1. widget 容器存在', !!widget);
    check('2. dock 触发按钮存在', !!dock);
    check('3. modal panel 存在', !!panel);
    check('4. backdrop 遮罩存在', !!backdrop);
    check('5. close 关闭按钮存在', !!closeBtn);
    check('6. dot 红点存在', !!dot);
    check('7. hint 气泡存在', !!hint);
    check('8. 二维码图片存在', !!qrImg, qrImg ? qrImg.getAttribute('src') : '');
    check('9. 复制 QQ 按钮存在', !!copyBtn);

    if (!widget) { console.groupEnd(); return; }

    // 2) 初始状态
    check('10. 默认无 is-modal-open', !widget.classList.contains('is-modal-open'));
    check('11. body 无 is-support-open', !document.body.classList.contains('is-support-open'));
    check('12. dock aria-expanded=false', dock.getAttribute('aria-expanded') === 'false');
    check('13. panel aria-hidden=true', panel.getAttribute('aria-hidden') === 'true');

    // 3) 全局 API
    check('14. KuaiMaOpenSupport 是全局函数', typeof window.KuaiMaOpenSupport === 'function');
    check('15. KuaiMaCloseSupport 是全局函数', typeof window.KuaiMaCloseSupport === 'function');

    // 4) 调用 OpenSupport 打开
    try { localStorage.removeItem('kuaima_support_seen'); } catch (e) {}
    window.KuaiMaOpenSupport({ focus: true });
    await wait(120);
    check('16. 调用后 is-modal-open 出现', widget.classList.contains('is-modal-open'));
    check('17. body 增加 is-support-open（锁滚）', document.body.classList.contains('is-support-open'));
    check('18. dock aria-expanded=true', dock.getAttribute('aria-expanded') === 'true');
    check('19. panel aria-hidden=false', panel.getAttribute('aria-hidden') === 'false');
    check('20. backdrop 不再 hidden', backdrop && !backdrop.hasAttribute('hidden'));
    check('21. localStorage 标记 kuaima_support_seen=1', (function () {
      try { return localStorage.getItem('kuaima_support_seen') === '1'; } catch (e) { return false; }
    })());
    check('22. 焦点在 close 按钮上', document.activeElement === closeBtn);

    // 5) 中央定位检查（PC）
    if (window.innerWidth >= 768) {
      const rect = panel.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const okX = Math.abs(cx - window.innerWidth / 2) < 12;
      const okY = Math.abs(cy - window.innerHeight / 2) < 80;
      check('23. PC 下 panel 居中', okX && okY,
        'cx=' + cx.toFixed(0) + ' cy=' + cy.toFixed(0) + ' / vw=' + window.innerWidth + ' vh=' + window.innerHeight);
    } else {
      const rect = panel.getBoundingClientRect();
      const stuckBottom = Math.abs(rect.bottom - window.innerHeight) < 6;
      check('23. 移动端 panel 贴底（抽屉）', stuckBottom, 'bottom=' + rect.bottom + ' vh=' + window.innerHeight);
    }

    // 6) 点击遮罩关闭
    backdrop.click();
    await wait(120);
    check('24. 点遮罩后关闭', !widget.classList.contains('is-modal-open'));
    check('25. body 解除 is-support-open', !document.body.classList.contains('is-support-open'));

    // 7) 再次打开 → ESC 关闭
    window.KuaiMaOpenSupport({ focus: false });
    await wait(120);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait(80);
    check('26. ESC 关闭弹窗', !widget.classList.contains('is-modal-open'));

    // 8) 再次打开 → × 按钮关闭
    window.KuaiMaOpenSupport({ focus: false });
    await wait(120);
    closeBtn.click();
    await wait(80);
    check('27. × 关闭弹窗', !widget.classList.contains('is-modal-open'));

    // 9) dock toggle 行为
    dock.click();
    await wait(120);
    check('28. dock 点击 → 打开', widget.classList.contains('is-modal-open'));
    dock.click();
    await wait(120);
    check('29. dock 再点击 → 关闭', !widget.classList.contains('is-modal-open'));

    // 10) #contact 锚点跳转触发（模拟）
    const heroBtn = document.querySelector('a[href="#contact"]');
    if (heroBtn) {
      heroBtn.click();
      await wait(180);
      check('30. 点击 a[href="#contact"] → 打开', widget.classList.contains('is-modal-open'));
      if (widget.classList.contains('is-modal-open')) window.KuaiMaCloseSupport();
    } else {
      check('30. 找到 #contact 入口链接', false, '页面未找到 a[href="#contact"]');
    }

    // 汇总
    await wait(50);
    const total = results.length;
    const passed = results.filter(function (r) { return r.pass; }).length;
    const failed = total - passed;
    console.log('%c—— 汇总 ——', 'color:#06b6d4;font-weight:800');
    console.log('总计 ' + total + ' / 通过 ' + passed + ' / 失败 ' + failed);
    if (failed) {
      console.log('%c失败项：', 'color:#ef4444;font-weight:700');
      results.filter(function (r) { return !r.pass; }).forEach(function (r) {
        console.log('  - ' + r.name + (r.detail ? '  (' + r.detail + ')' : ''));
      });
    }
    console.groupEnd();
    return { total: total, passed: passed, failed: failed, results: results };
  }

  return run();
})();
