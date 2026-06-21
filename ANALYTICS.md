# 快码官网埋点统计服务

## 当前已配置

前端埋点脚本已经默认上报到你的 HTTPS 域名：

```text
https://track.666166.top/api/track
```

统计后台：

```text
https://track.666166.top/dashboard
```

后台登录：

```text
账号：admin
密码：#8dk2SCLtf^Wo6k%P+4mx!JP
```

配置文件：

```text
analytics-server/.env
```

## 快速启动

```powershell
cd analytics-server
python server.py
```

默认端口：`8088`

- 本地埋点接口：`http://127.0.0.1:8088/api/track`
- 本地统计后台：`http://127.0.0.1:8088/dashboard`

## 当前接入

页面已接入：

```html
<script src="assets/js/analytics.js" defer></script>
```

默认采集：

- 页面访问 `page_view`
- 停留心跳 `heartbeat`
- 离开页面 `page_leave`
- 恢复可见 `page_visible`
- 点击事件 `click`

点击分类包括：

- `download`：下载按钮、下载外链
- `contact`：联系客服
- `copy_contact`：复制 QQ
- `tutorial`：教程入口、抖音教程
- `switch_language`：语言切换
- `external_link`：其他外链
- `anchor`：锚点
- `normal_click`：普通点击

详细部署说明见：`analytics-server/README.md`。
