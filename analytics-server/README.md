# 快码官网埋点统计服务

这是给当前静态官网配套的轻量自建埋点服务，支持：

- 访客 UV、访问 PV、会话数
- 每 5 分钟趋势、每小时趋势
- 平均停留时间
- 详细点击事件：下载、联系客服、复制 QQ、教程、外链、语言切换等
- 完整 IP 记录与 IP 统计
- 事件明细查看与 CSV 导出

## 当前域名与后台账号

前端埋点脚本已经默认上报到：

```text
https://track.666166.top/api/track
```

统计后台地址：

```text
https://track.666166.top/dashboard
```

后台登录：

```text
账号：admin
密码：#8dk2SCLtf^Wo6k%P+4mx!JP
```

配置已经写入：

```text
analytics-server/.env
```

> `.env` 已加入 `.gitignore`，用于部署私密配置。不要公开上传到公共仓库。

## 目录

```text
analytics-server/
├── server.py                 # Python 标准库服务端，自动读取 .env
├── .env                      # 实际部署配置，含后台密码，不入库
├── .env.example              # 配置模板，可入库
├── public/dashboard.html     # 统计后台页面
└── data/                     # SQLite 数据库目录，运行后生成 analytics.db
```

## 本地运行

```bash
cd analytics-server
python server.py
```

服务会自动读取 `analytics-server/.env`。

本地地址：

```text
埋点接口：http://127.0.0.1:8088/api/track
统计后台：http://127.0.0.1:8088/dashboard
```

## 服务器部署

在服务器 `43.156.19.2` 上，假设项目目录是 `/www/kuaima-cursor-pool`：

```bash
cd /www/kuaima-cursor-pool/analytics-server
python3 server.py
```

不需要再手动 export 密码；服务会读取当前目录的 `.env`。

如果你用 Git 部署，注意 `.env` 默认不会提交，需要在服务器手动创建：

```bash
cat > /www/kuaima-cursor-pool/analytics-server/.env <<'EOF'
ANALYTICS_HOST=127.0.0.1
ANALYTICS_PORT=8088
ANALYTICS_PUBLIC_BASE_URL=https://track.666166.top
ANALYTICS_ADMIN_USER=admin
ANALYTICS_ADMIN_PASSWORD=#8dk2SCLtf^Wo6k%P+4mx!JP
ANALYTICS_ALLOWED_ORIGINS=https://kuaima-cursor-pool.onrender.com,https://666166.top,https://www.666166.top,https://track.666166.top
ANALYTICS_TIMEZONE=Asia/Shanghai
EOF
```

> 如果你的主站最终不是 `kuaima-cursor-pool.onrender.com`、`666166.top` 或 `www.666166.top`，需要把主站域名追加到 `ANALYTICS_ALLOWED_ORIGINS`。

## systemd 常驻示例

创建 `/etc/systemd/system/kuaima-analytics.service`：

```ini
[Unit]
Description=KuaiMa Analytics Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/www/kuaima-cursor-pool/analytics-server
EnvironmentFile=/www/kuaima-cursor-pool/analytics-server/.env
ExecStart=/usr/bin/python3 /www/kuaima-cursor-pool/analytics-server/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kuaima-analytics
sudo systemctl status kuaima-analytics
```

## Nginx HTTPS 反代配置

`track.666166.top` 已经用于 HTTPS 埋点域名，推荐 Nginx 反代到本机 `8088` 端口。

### HTTP 自动跳转 HTTPS

```nginx
server {
    listen 80;
    server_name track.666166.top;
    return 301 https://$host$request_uri;
}
```

### HTTPS 站点

```nginx
server {
    listen 443 ssl http2;
    server_name track.666166.top;

    ssl_certificate /etc/letsencrypt/live/track.666166.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/track.666166.top/privkey.pem;

    client_max_body_size 256k;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
    }
}
```

如果你用的是宝塔、1Panel 或其他面板，本质就是把 `track.666166.top` 反代到：

```text
http://127.0.0.1:8088
```

并确保请求头传递：

```text
X-Real-IP
X-Forwarded-For
```

这样服务端会记录真实访客 IP。

## 防火墙建议

如果已经通过 Nginx 暴露 HTTPS，服务器防火墙可以只开放：

```text
80
443
```

`8088` 端口不需要公网开放，只给本机 Nginx 访问即可。

## 环境变量

| 变量 | 当前值 | 说明 |
| --- | --- | --- |
| `ANALYTICS_HOST` | `127.0.0.1` | 只监听本机，交给 Nginx 反代，更安全 |
| `ANALYTICS_PORT` | `8088` | 监听端口 |
| `ANALYTICS_PUBLIC_BASE_URL` | `https://track.666166.top` | 对外地址 |
| `ANALYTICS_DB_PATH` | 默认 `analytics-server/data/analytics.db` | SQLite 数据库路径 |
| `ANALYTICS_ADMIN_USER` | `admin` | 后台账号 |
| `ANALYTICS_ADMIN_PASSWORD` | 已在 `.env` 设置 | 后台密码 |
| `ANALYTICS_ALLOWED_ORIGINS` | 已在 `.env` 设置 | 允许上报的网页 Origin，逗号分隔 |
| `ANALYTICS_TIMEZONE` | `Asia/Shanghai` | 后台时间显示时区 |

## 重要说明

你要求记录 IP，本服务会完整保存 IP 到 SQLite。建议后台强密码保护，并限制防火墙只开放必要端口。
