# -*- coding: utf-8 -*-
"""
简单 ping 本地服务器,验证 serve.py 已启动并能正常响应。
"""
import sys
import urllib.request


def ping(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'KuaiMa-Ping'})
    with urllib.request.urlopen(req, timeout=5) as r:
        body = r.read().decode('utf-8', errors='ignore')
        return r.getcode(), len(body), body


def main():
    targets = [
        ('http://localhost:8000/', '首页'),
        ('http://localhost:8000/tutorial.html', '教程页'),
        ('http://localhost:8000/assets/css/style.css', 'CSS'),
        ('http://localhost:8000/assets/js/i18n.js', 'i18n.js'),
        ('http://localhost:8000/assets/js/main.js', 'main.js'),
        ('http://localhost:8000/assets/images/logo.png', 'Logo'),
        ('http://localhost:8000/assets/images/recharge.gif', 'GIF1'),
        ('http://localhost:8000/sitemap.xml', 'sitemap'),
        ('http://localhost:8000/robots.txt', 'robots'),
    ]
    print('=' * 56)
    print('  本地服务器响应检测')
    print('=' * 56)
    all_ok = True
    for url, label in targets:
        try:
            code, length, body = ping(url)
            ok = 200 <= code < 300
            mark = '[PASS]' if ok else '[FAIL]'
            print(f"  {mark} {label:10} {code} {length:>10,} bytes  {url}")
            all_ok = all_ok and ok
        except Exception as e:
            all_ok = False
            print(f"  [FAIL] {label:10} ERR  {type(e).__name__}: {e}")

    try:
        _, _, body = ping('http://localhost:8000/')
        keywords = ['data-i18n="brand"', 'Aka-CncLC', 'feijipan', 'gradient-text']
        print('\n  --> 首页关键文案抽查:')
        for kw in keywords:
            ok = kw in body
            mark = '[PASS]' if ok else '[FAIL]'
            print(f"    {mark} 包含 {kw!r}")
            all_ok = all_ok and ok
    except Exception:
        pass

    print('=' * 56)
    print('  全部通过' if all_ok else '  存在失败项')
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
