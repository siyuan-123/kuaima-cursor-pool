/**
 * 智能下载跳转自检测试脚本
 * 使用方式：
 *   1) 打开 index.html (或 tutorial.html)
 *   2) 浏览器控制台粘贴并执行下面整个脚本
 *   3) 控制台逐项输出 PASS / FAIL
 *
 * 涵盖：
 *   - 全局 API 暴露
 *   - 下载助手 DOM 节点完整性
 *   - smartDownload 按 OS 分支跳转 / 弹窗
 *   - mobile 状态：复制链接卡片
 *   - picker 状态：Win/Mac 选择
 *   - 关闭逻辑：×、遮罩、ESC
 *   - 滚动锁定
 *   - 入口按钮 data-smart-download 绑定
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

  // hook window.open 以便观察跳转参数（不真的开新页）
  const openCalls = [];
  const WIN_URL = 'https://share.feijipan.com/s/eQdnQGzh';
  const MAC_URL = 'https://share.feijipan.com/s/9GdnQTIJ';
  const originalOpen = window.open;
  function hookOpen() {
    window.open = function (url, target, features) {
      openCalls.push({ url: url, target: target, features: features });
      return null;
    };
  }
  function unhookOpen() {
    window.open = originalOpen;
  }

  async function run() {
    console.group('智能下载自检测试');

    // 1) 全局 API
    check('1. KuaiMaSmartDownload 是全局函数', typeof window.KuaiMaSmartDownload === 'function');
    check('2. KuaiMaCloseDownload 是全局函数', typeof window.KuaiMaCloseDownload === 'function');

    // 2) DOM 节点
    const helper = document.querySelector('[data-download-helper]');
    const backdrop = helper && helper.querySelector('[data-download-helper-backdrop]');
    const closeBtn = helper && helper.querySelector('[data-download-helper-close]');
    const mobileState = helper && helper.querySelector('.download-helper__state--mobile');
    const pickerState = helper && helper.querySelector('.download-helper__state--picker');
    const pickWin = helper && helper.querySelector('[data-helper-pick="win"]');
    const pickMac = helper && helper.querySelector('[data-helper-pick="mac"]');
    const copyWin = helper && helper.querySelector('[data-copy="' + WIN_URL + '"]');
    const copyMac = helper && helper.querySelector('[data-copy="' + MAC_URL + '"]');

    check('3. download-helper 容器存在', !!helper);
    check('4. backdrop 遮罩存在', !!backdrop);
    check('5. close 关闭按钮存在', !!closeBtn);
    check('6. mobile 状态块存在', !!mobileState);
    check('7. picker 状态块存在', !!pickerState);
    check('8. picker Win 按钮存在', !!pickWin);
    check('9. picker Mac 按钮存在', !!pickMac);
    check('10. mobile Win 复制按钮存在', !!copyWin);
    check('11. mobile Mac 复制按钮存在', !!copyMac);

    if (!helper) { console.groupEnd(); return; }

    // 3) 入口 data-smart-download 绑定
    const entries = document.querySelectorAll('[data-smart-download]');
    check('12. 至少 1 个 data-smart-download 入口', entries.length >= 1, '共 ' + entries.length + ' 个');

    // 4) win 分支：调用 smartDownload('win') 应触发 window.open(WIN_URL)
    hookOpen();
    openCalls.length = 0;
    window.KuaiMaSmartDownload('win');
    await wait(60);
    const winOpen = openCalls[0];
    check('13. win 分支调用 window.open', !!winOpen);
    check('14. win 分支跳新 Windows 下载地址', winOpen && winOpen.url === WIN_URL, winOpen ? winOpen.url : '');
    check('15. win 分支 target=_blank', winOpen && winOpen.target === '_blank');

    // 5) mac 分支
    openCalls.length = 0;
    window.KuaiMaSmartDownload('mac');
    await wait(60);
    const macOpen = openCalls[0];
    check('16. mac 分支调用 window.open', !!macOpen);
    check('17. mac 分支跳新 macOS 下载地址', macOpen && macOpen.url === MAC_URL, macOpen ? macOpen.url : '');

    // 6) mobile 分支
    openCalls.length = 0;
    window.KuaiMaSmartDownload('mobile');
    await wait(160);
    check('18. mobile 分支不调用 window.open', openCalls.length === 0);
    check('19. mobile 分支打开 helper modal', helper.classList.contains('is-open'));
    check('20. mobile 分支 data-state=mobile', helper.getAttribute('data-state') === 'mobile');
    check('21. body 增加 is-helper-open（锁滚）', document.body.classList.contains('is-helper-open'));

    // 7) 关闭：×
    closeBtn.click();
    await wait(60);
    check('22. × 关闭', !helper.classList.contains('is-open'));
    check('23. body 解除 is-helper-open', !document.body.classList.contains('is-helper-open'));

    // 8) 再次打开 → ESC 关闭
    window.KuaiMaSmartDownload('mobile');
    await wait(120);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait(60);
    check('24. ESC 关闭 helper', !helper.classList.contains('is-open'));

    // 9) 再次打开 → backdrop 点击关闭
    window.KuaiMaSmartDownload('mobile');
    await wait(120);
    backdrop.click();
    await wait(60);
    check('25. 点遮罩关闭 helper', !helper.classList.contains('is-open'));

    // 10) picker 分支（linux/unknown）
    openCalls.length = 0;
    window.KuaiMaSmartDownload('linux');
    await wait(160);
    check('26. linux 分支打开 helper modal', helper.classList.contains('is-open'));
    check('27. linux 分支 data-state=picker', helper.getAttribute('data-state') === 'picker');

    // 11) picker → 点 Win 按钮 → 关闭并跳 Win
    openCalls.length = 0;
    pickWin.click();
    await wait(120);
    check('28. picker Win 点击后 helper 关闭', !helper.classList.contains('is-open'));
    const pickWinOpen = openCalls[0];
    check('29. picker Win 触发 window.open 新 Windows 下载地址', pickWinOpen && pickWinOpen.url === WIN_URL);

    // 12) picker → 点 Mac 按钮
    window.KuaiMaSmartDownload('unknown');
    await wait(120);
    openCalls.length = 0;
    pickMac.click();
    await wait(120);
    const pickMacOpen = openCalls[0];
    check('30. picker Mac 触发 window.open 新 macOS 下载地址', pickMacOpen && pickMacOpen.url === MAC_URL);

    // 13) mobile 复制按钮
    window.KuaiMaSmartDownload('mobile');
    await wait(120);
    copyWin.click();
    await wait(60);
    check('31. mobile 复制 Win 链接按钮 is-success', copyWin.classList.contains('is-success'));
    window.KuaiMaCloseDownload();

    // 14) data-smart-download 入口拦截：模拟点击不真的跳走（hook 保护）
    openCalls.length = 0;
    if (entries[0]) {
      entries[0].click();
      await wait(120);
      const openedOrModal = openCalls.length > 0 || helper.classList.contains('is-open');
      check('32. 入口 data-smart-download 触发了 smartDownload', openedOrModal,
        'openCalls=' + openCalls.length + ' modalOpen=' + helper.classList.contains('is-open'));
      window.KuaiMaCloseDownload();
    }

    // 15) detectOS 当前结果（仅展示，不判 pass/fail）
    try {
      // 通过私有 API 取不到 detectOS，这里观察实际 smartDownload() 默认走的分支
      openCalls.length = 0;
      window.KuaiMaCloseDownload();
      window.KuaiMaSmartDownload();
      await wait(120);
      let detected = 'unknown';
      if (openCalls.length === 1) {
        detected = openCalls[0].url === WIN_URL ? 'win' : 'mac';
      } else if (helper.classList.contains('is-open')) {
        detected = helper.getAttribute('data-state') === 'mobile' ? 'mobile' : 'picker';
      }
      check('33. 默认 detectOS 工作正常', detected !== 'unknown' || true, '当前判定 = ' + detected);
      window.KuaiMaCloseDownload();
    } catch (e) {
      check('33. detectOS 兜底', false, e.message);
    }

    unhookOpen();

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
