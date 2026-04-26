# -*- coding: utf-8 -*-
"""
快码 cursor 号池 - 站点自动化测试脚本
============================================

功能:
1. 校验关键文件是否存在
2. 校验 HTML 结构 (DOCTYPE / lang / meta / 链接)
3. 校验关键文案 / SEO meta / hreflang / JSON-LD
4. 校验外链可达性 (下载链接)
5. 校验 i18n 字典中英文 key 一一对应
6. 校验静态资源 (logo / GIF) 存在且文件大小 > 0
7. 输出彩色摘要

运行:
    python tests/test_site.py
"""
import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASS = 0
FAIL = 0
RESULTS = []


def color(text, c):
    codes = {'g': '32', 'r': '31', 'y': '33', 'b': '36', 'm': '35'}
    if not sys.stdout.isatty():
        return text
    return f"\033[{codes.get(c, '0')}m{text}\033[0m"


def check(name, ok, detail=''):
    global PASS, FAIL
    if ok:
        PASS += 1
        print(f"  {color('[PASS]', 'g')} {name}")
    else:
        FAIL += 1
        print(f"  {color('[FAIL]', 'r')} {name}")
        if detail:
            print(f"        {color(detail, 'y')}")
    RESULTS.append((name, ok, detail))


def section(title):
    print(f"\n{color('==>', 'b')} {color(title, 'b')}")


def read_file(path: Path) -> str:
    return path.read_text(encoding='utf-8')


# ---------- 1. 文件存在性 ----------
def test_files_exist():
    section("1. 关键文件存在性检查")
    files = {
        'index.html': ROOT / 'index.html',
        'tutorial.html': ROOT / 'tutorial.html',
        'CSS': ROOT / 'assets' / 'css' / 'style.css',
        'i18n.js': ROOT / 'assets' / 'js' / 'i18n.js',
        'main.js': ROOT / 'assets' / 'js' / 'main.js',
        'logo.png': ROOT / 'assets' / 'images' / 'logo.png',
        'recharge.gif': ROOT / 'assets' / 'images' / 'recharge.gif',
        'enable-auto-switch.gif': ROOT / 'assets' / 'images' / 'enable-auto-switch.gif',
        'switch-account.gif': ROOT / 'assets' / 'images' / 'switch-account.gif',
        'robots.txt': ROOT / 'robots.txt',
        'sitemap.xml': ROOT / 'sitemap.xml',
        'serve.py': ROOT / 'serve.py'
    }
    for name, path in files.items():
        ok = path.exists() and path.stat().st_size > 0
        size = path.stat().st_size if path.exists() else 0
        check(f"{name} 存在", ok, f"size={size}")


# ---------- 2. HTML 结构 ----------
HTML_REQUIRED = {
    'index.html': [
        ('DOCTYPE', r'<!DOCTYPE html>'),
        ('html lang', r'<html\s+lang="zh-CN"'),
        ('viewport meta', r'<meta\s+name="viewport"'),
        ('description meta', r'<meta\s+name="description"'),
        ('keywords meta', r'<meta\s+name="keywords"'),
        ('canonical', r'<link\s+rel="canonical"'),
        ('hreflang zh', r'hreflang="zh-CN"'),
        ('hreflang en', r'hreflang="en"'),
        ('og:title', r'property="og:title"'),
        ('og:image', r'property="og:image"'),
        ('twitter:card', r'name="twitter:card"'),
        ('JSON-LD', r'application/ld\+json'),
        ('Logo', r'assets/images/logo\.png'),
        ('windows download', r'share\.feijipan\.com/s/0v4O75TM'),
        ('macos download', r'share\.feijipan\.com/s/ud4OdIFj'),
        ('微信号', r'Aka-CncLC'),
        ('品牌名', r'data-i18n="brand"'),
        ('i18n.js', r'assets/js/i18n\.js'),
        ('main.js', r'assets/js/main\.js'),
        ('lang switch', r'data-lang-btn="zh"'),
        ('lang switch en', r'data-lang-btn="en"'),
        ('contact section id', r'id="contact"'),
        ('download section id', r'id="download"'),
    ],
    'tutorial.html': [
        ('DOCTYPE', r'<!DOCTYPE html>'),
        ('html lang', r'<html\s+lang="zh-CN"'),
        ('canonical', r'<link\s+rel="canonical"'),
        ('hreflang zh', r'hreflang="zh-CN"'),
        ('hreflang en', r'hreflang="en"'),
        ('HowTo JSON-LD', r'"@type":\s*"HowTo"'),
        ('step 1 GIF', r'src="assets/images/recharge\.gif"'),
        ('step 2 GIF', r'src="assets/images/enable-auto-switch\.gif"'),
        ('step 3 GIF', r'src="assets/images/switch-account\.gif"'),
        ('原生懒加载', r'loading="lazy"'),
        ('返回首页 CTA', r'data-i18n="tutorial.back"'),
    ]
}


def test_html_structure():
    section("2. HTML 结构与 SEO 元素")
    for filename, rules in HTML_REQUIRED.items():
        path = ROOT / filename
        if not path.exists():
            check(f"{filename} 读取", False, "文件不存在")
            continue
        text = read_file(path)
        print(f"  {color('-->', 'b')} {filename}")
        for name, pattern in rules:
            ok = re.search(pattern, text) is not None
            check(f"  {name}", ok, f"未匹配模式: {pattern}" if not ok else '')


# ---------- 3. JSON-LD 合法性 ----------
def test_jsonld_valid():
    section("3. JSON-LD 结构化数据合法性")
    for filename in ['index.html', 'tutorial.html']:
        path = ROOT / filename
        if not path.exists():
            continue
        text = read_file(path)
        matches = re.findall(
            r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
            text, flags=re.DOTALL)
        check(f"{filename} 含 JSON-LD", len(matches) >= 1)
        for i, raw in enumerate(matches):
            try:
                data = json.loads(raw.strip())
                ok = '@context' in data and '@type' in data
                check(f"{filename} JSON-LD #{i+1} 合法", ok,
                      "缺少 @context/@type" if not ok else '')
            except json.JSONDecodeError as e:
                check(f"{filename} JSON-LD #{i+1} 合法", False, str(e))


# ---------- 4. i18n 字典完整性 ----------
def test_i18n_dict():
    section("4. i18n 字典中英文对齐")
    js_path = ROOT / 'assets' / 'js' / 'i18n.js'
    if not js_path.exists():
        check("i18n.js 读取", False, "文件不存在")
        return
    text = read_file(js_path)

    zh_block = re.search(r"zh:\s*\{(.*?)\n\s*\},\s*\n\s*en:", text, re.DOTALL)
    en_block = re.search(r"en:\s*\{(.*?)\n\s*\}\s*\n\s*\};", text, re.DOTALL)
    check("中文字典段落识别", zh_block is not None)
    check("英文字典段落识别", en_block is not None)
    if not (zh_block and en_block):
        return

    def keys_of(block):
        keys = set()
        for line in block.split('\n'):
            m = re.match(r"\s*['\"]?([\w.]+)['\"]?\s*:", line)
            if m:
                keys.add(m.group(1))
        return keys

    zh_keys = keys_of(zh_block.group(1))
    en_keys = keys_of(en_block.group(1))

    missing_in_en = zh_keys - en_keys
    missing_in_zh = en_keys - zh_keys
    check(f"英文翻译完整（中文 {len(zh_keys)} 项）",
          len(missing_in_en) == 0,
          f"英文缺失: {sorted(missing_in_en)[:5]}")
    check(f"中文翻译完整（英文 {len(en_keys)} 项）",
          len(missing_in_zh) == 0,
          f"中文缺失: {sorted(missing_in_zh)[:5]}")


# ---------- 5. data-i18n key 在字典中存在 ----------
def test_i18n_keys_referenced():
    section("5. HTML 中 data-i18n 引用的 key 是否都在字典里")
    js_path = ROOT / 'assets' / 'js' / 'i18n.js'
    if not js_path.exists():
        return
    js_text = read_file(js_path)
    zh_block = re.search(r"zh:\s*\{(.*?)\n\s*\},\s*\n\s*en:", js_text, re.DOTALL)
    if not zh_block:
        return
    dict_keys = set()
    for line in zh_block.group(1).split('\n'):
        m = re.match(r"\s*['\"]?([\w.]+)['\"]?\s*:", line)
        if m:
            dict_keys.add(m.group(1))

    for filename in ['index.html', 'tutorial.html']:
        path = ROOT / filename
        if not path.exists():
            continue
        text = read_file(path)
        used = set(re.findall(r'data-i18n="([\w.]+)"', text))
        missing = used - dict_keys
        check(f"{filename} 使用的 i18n key 全部在字典中（共 {len(used)}）",
              len(missing) == 0,
              f"未定义的 key: {sorted(missing)[:5]}")


# ---------- 6. 资源大小 sanity ----------
def test_assets_size():
    section("6. 静态资源体积合理性")
    expectations = {
        ROOT / 'assets' / 'images' / 'logo.png': (10_000, 2_000_000),
        ROOT / 'assets' / 'images' / 'recharge.gif': (100_000, 50_000_000),
        ROOT / 'assets' / 'images' / 'enable-auto-switch.gif': (100_000, 50_000_000),
        ROOT / 'assets' / 'images' / 'switch-account.gif': (100_000, 50_000_000),
        ROOT / 'assets' / 'css' / 'style.css': (1000, 200_000),
        ROOT / 'assets' / 'js' / 'i18n.js': (1000, 100_000),
        ROOT / 'assets' / 'js' / 'main.js': (500, 50_000),
        ROOT / 'index.html': (3000, 100_000),
        ROOT / 'tutorial.html': (2000, 100_000),
    }
    for path, (lo, hi) in expectations.items():
        size = path.stat().st_size if path.exists() else 0
        ok = lo <= size <= hi
        check(f"{path.name} 体积 {size:,} 字节 in [{lo:,}, {hi:,}]", ok)


# ---------- 7. 外链可达性 (HEAD) ----------
def test_external_links():
    section("7. 外部下载链接可达性 (HEAD 5s 超时)")
    links = [
        ('Windows 下载', 'https://share.feijipan.com/s/0v4O75TM'),
        ('macOS 下载', 'https://share.feijipan.com/s/ud4OdIFj'),
    ]
    for name, url in links:
        ok = False
        detail = ''
        try:
            req = urllib.request.Request(url, method='HEAD',
                headers={'User-Agent': 'Mozilla/5.0 KuaiMa-Site-Tester'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                code = resp.getcode()
                ok = 200 <= code < 400
                detail = f"HTTP {code}"
        except urllib.error.HTTPError as e:
            ok = e.code in (301, 302, 405, 403)
            detail = f"HTTP {e.code}"
        except Exception as e:
            detail = f"{type(e).__name__}: {e}"
        check(f"{name} 可达", ok, detail)


# ---------- 主流程 ----------
def main():
    print(color("\n+============================================+", 'b'))
    print(color("|  快码 cursor 号池 - 站点自动化测试套件     |", 'b'))
    print(color("+============================================+", 'b'))

    test_files_exist()
    test_html_structure()
    test_jsonld_valid()
    test_i18n_dict()
    test_i18n_keys_referenced()
    test_assets_size()
    test_external_links()

    print(f"\n{color('=' * 48, 'b')}")
    total = PASS + FAIL
    if FAIL == 0:
        print(color(f"通过 {PASS}/{total} - 全部测试通过", 'g'))
        sys.exit(0)
    else:
        print(color(f"通过 {PASS}/{total} - 失败 {FAIL} 项", 'r'))
        sys.exit(1)


if __name__ == '__main__':
    main()
