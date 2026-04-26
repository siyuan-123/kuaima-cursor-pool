# -*- coding: utf-8 -*-
"""
快码 cursor 号池 - 本地预览服务器
================================
默认端口 8000,启动后会自动打开浏览器。

用法:
    python serve.py            # 端口 8000
    python serve.py 8080       # 自定义端口
    python serve.py 8000 --no-browser   # 不自动开浏览器
"""
import http.server
import os
import socket
import socketserver
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 8000


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.json': 'application/json; charset=utf-8',
        '.gif': 'image/gif',
        '.png': 'image/png'
    }

    def log_message(self, fmt, *args):
        sys.stdout.write(
            f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}\n")

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()


def is_port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False


def find_port(start: int) -> int:
    for p in range(start, start + 50):
        if is_port_free(p):
            return p
    raise RuntimeError(f"未能找到可用端口 (尝试 {start} - {start + 50})")


def parse_args():
    args = sys.argv[1:]
    port = DEFAULT_PORT
    open_browser = True
    for a in args:
        if a == '--no-browser':
            open_browser = False
        elif a.isdigit():
            port = int(a)
        else:
            print(f"忽略未知参数: {a}")
    return port, open_browser


def main():
    port, open_browser = parse_args()
    os.chdir(ROOT)

    if not is_port_free(port):
        print(f"[警告] 端口 {port} 被占用,自动寻找空闲端口...")
        port = find_port(port + 1)

    url = f"http://localhost:{port}/"

    handler = QuietHandler
    http.server.ThreadingHTTPServer.allow_reuse_address = True

    with http.server.ThreadingHTTPServer(('0.0.0.0', port), handler) as httpd:
        httpd.daemon_threads = True
        print('=' * 56)
        print(f"  快码 cursor 号池 - 本地预览服务器已启动")
        print('=' * 56)
        print(f"  根目录    : {ROOT}")
        print(f"  本地访问  : {url}")
        print(f"  教程页    : {url}tutorial.html")
        print(f"  英文版    : {url}?lang=en")
        print(f"  退出      : Ctrl + C")
        print('=' * 56)

        if open_browser:
            def delayed_open():
                time.sleep(0.6)
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
            threading.Thread(target=delayed_open, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[退出] 已停止服务器。")


if __name__ == '__main__':
    main()
