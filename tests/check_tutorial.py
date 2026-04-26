# -*- coding: utf-8 -*-
"""单独验证教程页响应。"""
import urllib.request

r = urllib.request.urlopen('http://localhost:8000/tutorial.html', timeout=10)
body = r.read().decode('utf-8')
print('STATUS:', r.getcode())
print('LENGTH:', len(body))
print('has recharge.gif:', 'recharge.gif' in body)
print('has loading=lazy:', 'loading="lazy"' in body)
print('has step__media (no is-loading):', '<div class="step__media">' in body)
