#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快码官网轻量埋点服务

功能：
- POST /api/track：接收前端埋点事件，记录完整 IP、PV、点击、停留时间等
- GET  /dashboard：统计后台页面，HTTP Basic 登录保护
- GET  /api/stats：5 分钟 / 小时 / 今日统计
- GET  /api/events：最近事件明细，支持 event=click 查看点击详情

仅依赖 Python 标准库，数据存储使用 SQLite。
"""

from __future__ import annotations

import base64
import csv
import hmac
import io
import json
import os
import sqlite3
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore

BASE_DIR = Path(__file__).resolve().parent


def load_env_file(path: Path) -> None:
    """加载本目录 .env 配置；系统环境变量优先级更高。"""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        os.environ.setdefault(key, value)


load_env_file(BASE_DIR / ".env")

PUBLIC_DIR = BASE_DIR / "public"
DB_PATH = Path(os.getenv("ANALYTICS_DB_PATH", str(BASE_DIR / "data" / "analytics.db")))
HOST = os.getenv("ANALYTICS_HOST", "0.0.0.0")
PORT = int(os.getenv("ANALYTICS_PORT", "8088"))
PUBLIC_BASE_URL = os.getenv("ANALYTICS_PUBLIC_BASE_URL", "https://track.666166.top").rstrip("/")
ADMIN_USER = os.getenv("ANALYTICS_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ANALYTICS_ADMIN_PASSWORD", "admin123456")
TIMEZONE_NAME = os.getenv("ANALYTICS_TIMEZONE", "Asia/Shanghai")
MAX_BODY_BYTES = int(os.getenv("ANALYTICS_MAX_BODY_BYTES", "65536"))
DEFAULT_ALLOWED_ORIGINS = ",".join(
    [
        "https://kuaima-cursor-pool.onrender.com",
        "http://kuaima-cursor-pool.onrender.com",
        "https://666166.top",
        "https://www.666166.top",
        "https://track.666166.top",
        "http://43.156.19.2",
        "http://43.156.19.2:8088",
        "https://43.156.19.2",
        "https://43.156.19.2:8088",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
)
ALLOWED_ORIGINS = [
    item.strip().rstrip("/")
    for item in os.getenv("ANALYTICS_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if item.strip()
]

if ZoneInfo is not None:
    try:
        APP_TZ = ZoneInfo(TIMEZONE_NAME)
    except Exception:
        APP_TZ = timezone.utc
else:  # pragma: no cover
    APP_TZ = timezone.utc

UV_KEY_EXPR = "COALESCE(NULLIF(visitor_id, ''), NULLIF(ip || '|' || user_agent, ''), 'unknown')"
SESSION_KEY_EXPR = "COALESCE(NULLIF(session_id, ''), " + UV_KEY_EXPR + ")"


def now_ms() -> int:
    return int(time.time() * 1000)


def iso_ms(ms: int | None) -> str:
    if not ms:
        return ""
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone(APP_TZ).isoformat(timespec="seconds")


def today_start_ms() -> int:
    now_local = datetime.now(APP_TZ)
    start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    return int(start.timestamp() * 1000)


def trim(value: Any, max_len: int = 512) -> str:
    if value is None:
        return ""
    text = str(value).replace("\x00", "").strip()
    return text[:max_len]


def to_int(value: Any, default: int | None = None) -> int | None:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except Exception:
        return default


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              received_at_ms INTEGER NOT NULL,
              client_ts_ms INTEGER,
              event TEXT NOT NULL,
              visitor_id TEXT,
              session_id TEXT,
              page TEXT,
              url TEXT,
              title TEXT,
              referrer TEXT,
              language TEXT,
              user_agent TEXT,
              ip TEXT,
              origin TEXT,
              duration_ms INTEGER,
              scroll_percent INTEGER,
              category TEXT,
              label TEXT,
              target_text TEXT,
              target_url TEXT,
              data_json TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at_ms);
            CREATE INDEX IF NOT EXISTS idx_events_event_time ON events(event, received_at_ms);
            CREATE INDEX IF NOT EXISTS idx_events_visitor_time ON events(visitor_id, received_at_ms);
            CREATE INDEX IF NOT EXISTS idx_events_session_time ON events(session_id, received_at_ms);
            CREATE INDEX IF NOT EXISTS idx_events_ip_time ON events(ip, received_at_ms);
            CREATE INDEX IF NOT EXISTS idx_events_category_time ON events(category, received_at_ms);
            """
        )


def resolve_allowed_origin(origin: str) -> str:
    origin = (origin or "").rstrip("/")
    if not origin:
        return ""
    if "*" in ALLOWED_ORIGINS:
        return origin
    return origin if origin in ALLOWED_ORIGINS else ""


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any]:
    if row is None:
        return {}
    return {key: row[key] for key in row.keys()}


def summary_window(conn: sqlite3.Connection, since_ms: int, until_ms: int) -> dict[str, Any]:
    row = conn.execute(
        f"""
        SELECT
          SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS pv,
          COUNT(DISTINCT CASE WHEN event = 'page_view' THEN {UV_KEY_EXPR} END) AS uv,
          COUNT(DISTINCT CASE WHEN event = 'page_view' THEN {SESSION_KEY_EXPR} END) AS sessions,
          SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END) AS clicks,
          SUM(CASE WHEN event = 'click' AND category = 'download' THEN 1 ELSE 0 END) AS download_clicks,
          SUM(CASE WHEN event = 'click' AND category = 'contact' THEN 1 ELSE 0 END) AS contact_clicks,
          SUM(CASE WHEN event = 'click' AND category = 'copy_contact' THEN 1 ELSE 0 END) AS copy_contact_clicks,
          SUM(CASE WHEN event = 'click' AND category = 'tutorial' THEN 1 ELSE 0 END) AS tutorial_clicks
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ?
        """,
        (since_ms, until_ms),
    ).fetchone()

    duration_row = conn.execute(
        f"""
        SELECT AVG(max_duration) AS avg_duration_ms
        FROM (
          SELECT MAX(duration_ms) AS max_duration
          FROM events
          WHERE received_at_ms >= ?
            AND received_at_ms <= ?
            AND duration_ms IS NOT NULL
            AND duration_ms >= 0
          GROUP BY {SESSION_KEY_EXPR}, page
        )
        """,
        (since_ms, until_ms),
    ).fetchone()

    data = row_to_dict(row)
    for key in [
        "pv",
        "uv",
        "sessions",
        "clicks",
        "download_clicks",
        "contact_clicks",
        "copy_contact_clicks",
        "tutorial_clicks",
    ]:
        data[key] = int(data.get(key) or 0)
    duration_data = row_to_dict(duration_row)
    data["avg_duration_ms"] = int(duration_data.get("avg_duration_ms") or 0)
    return data


def make_timeline(conn: sqlite3.Connection, bucket_seconds: int, hours: int, until_ms: int) -> list[dict[str, Any]]:
    bucket_ms = bucket_seconds * 1000
    since_ms = until_ms - hours * 3600 * 1000
    first_bucket = since_ms - (since_ms % bucket_ms)
    last_bucket = until_ms - (until_ms % bucket_ms)

    buckets: dict[int, dict[str, Any]] = {}
    current = first_bucket
    while current <= last_bucket:
        buckets[current] = {
            "bucket_ms": current,
            "time": iso_ms(current),
            "pv": 0,
            "uv": 0,
            "sessions": 0,
            "clicks": 0,
            "download_clicks": 0,
            "contact_clicks": 0,
            "avg_duration_ms": 0,
        }
        current += bucket_ms

    rows = conn.execute(
        f"""
        SELECT
          CAST(received_at_ms / ? AS INTEGER) * ? AS bucket_ms,
          COUNT(*) AS pv,
          COUNT(DISTINCT {UV_KEY_EXPR}) AS uv,
          COUNT(DISTINCT {SESSION_KEY_EXPR}) AS sessions
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND event = 'page_view'
        GROUP BY bucket_ms
        """,
        (bucket_ms, bucket_ms, since_ms, until_ms),
    ).fetchall()
    for row in rows:
        bucket = int(row["bucket_ms"])
        if bucket in buckets:
            buckets[bucket]["pv"] = int(row["pv"] or 0)
            buckets[bucket]["uv"] = int(row["uv"] or 0)
            buckets[bucket]["sessions"] = int(row["sessions"] or 0)

    click_rows = conn.execute(
        """
        SELECT
          CAST(received_at_ms / ? AS INTEGER) * ? AS bucket_ms,
          COUNT(*) AS clicks,
          SUM(CASE WHEN category = 'download' THEN 1 ELSE 0 END) AS download_clicks,
          SUM(CASE WHEN category = 'contact' THEN 1 ELSE 0 END) AS contact_clicks
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND event = 'click'
        GROUP BY bucket_ms
        """,
        (bucket_ms, bucket_ms, since_ms, until_ms),
    ).fetchall()
    for row in click_rows:
        bucket = int(row["bucket_ms"])
        if bucket in buckets:
            buckets[bucket]["clicks"] = int(row["clicks"] or 0)
            buckets[bucket]["download_clicks"] = int(row["download_clicks"] or 0)
            buckets[bucket]["contact_clicks"] = int(row["contact_clicks"] or 0)

    duration_rows = conn.execute(
        f"""
        SELECT bucket_ms, AVG(max_duration) AS avg_duration_ms
        FROM (
          SELECT
            CAST(received_at_ms / ? AS INTEGER) * ? AS bucket_ms,
            {SESSION_KEY_EXPR} AS session_key,
            page,
            MAX(duration_ms) AS max_duration
          FROM events
          WHERE received_at_ms >= ?
            AND received_at_ms <= ?
            AND duration_ms IS NOT NULL
            AND duration_ms >= 0
          GROUP BY bucket_ms, session_key, page
        )
        GROUP BY bucket_ms
        """,
        (bucket_ms, bucket_ms, since_ms, until_ms),
    ).fetchall()
    for row in duration_rows:
        bucket = int(row["bucket_ms"])
        if bucket in buckets:
            buckets[bucket]["avg_duration_ms"] = int(row["avg_duration_ms"] or 0)

    return list(buckets.values())


def top_pages(conn: sqlite3.Connection, since_ms: int, until_ms: int, limit: int = 20) -> list[dict[str, Any]]:
    rows = conn.execute(
        f"""
        SELECT page, COUNT(*) AS pv, COUNT(DISTINCT {UV_KEY_EXPR}) AS uv
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND event = 'page_view'
        GROUP BY page
        ORDER BY pv DESC
        LIMIT ?
        """,
        (since_ms, until_ms, limit),
    ).fetchall()
    return [dict(row) for row in rows]


def top_referrers(conn: sqlite3.Connection, since_ms: int, until_ms: int, limit: int = 20) -> list[dict[str, Any]]:
    rows = conn.execute(
        f"""
        SELECT COALESCE(NULLIF(referrer, ''), '直接访问') AS referrer,
               COUNT(*) AS pv,
               COUNT(DISTINCT {UV_KEY_EXPR}) AS uv
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND event = 'page_view'
        GROUP BY COALESCE(NULLIF(referrer, ''), '直接访问')
        ORDER BY pv DESC
        LIMIT ?
        """,
        (since_ms, until_ms, limit),
    ).fetchall()
    return [dict(row) for row in rows]


def top_clicks(conn: sqlite3.Connection, since_ms: int, until_ms: int, limit: int = 50) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT COALESCE(NULLIF(category, ''), 'unknown') AS category,
               COALESCE(NULLIF(label, ''), '-') AS label,
               COALESCE(NULLIF(target_text, ''), '-') AS target_text,
               COALESCE(NULLIF(target_url, ''), '') AS target_url,
               COUNT(*) AS count,
               COUNT(DISTINCT ip) AS ip_count
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND event = 'click'
        GROUP BY category, label, target_text, target_url
        ORDER BY count DESC, ip_count DESC
        LIMIT ?
        """,
        (since_ms, until_ms, limit),
    ).fetchall()
    return [dict(row) for row in rows]


def ip_stats(conn: sqlite3.Connection, since_ms: int, until_ms: int, limit: int = 100) -> list[dict[str, Any]]:
    rows = conn.execute(
        f"""
        SELECT ip,
               COUNT(*) AS events,
               SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS pv,
               SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END) AS clicks,
               COUNT(DISTINCT {UV_KEY_EXPR}) AS uv,
               MAX(received_at_ms) AS last_seen_ms,
               MIN(received_at_ms) AS first_seen_ms
        FROM events
        WHERE received_at_ms >= ? AND received_at_ms <= ? AND ip <> ''
        GROUP BY ip
        ORDER BY pv DESC, clicks DESC, events DESC
        LIMIT ?
        """,
        (since_ms, until_ms, limit),
    ).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["last_seen"] = iso_ms(item.get("last_seen_ms"))
        item["first_seen"] = iso_ms(item.get("first_seen_ms"))
        result.append(item)
    return result


def build_stats() -> dict[str, Any]:
    until = now_ms()
    since_24h = until - 24 * 3600 * 1000
    with get_conn() as conn:
        stats = {
            "generated_at": iso_ms(until),
            "timezone": TIMEZONE_NAME,
            "windows": {
                "last5m": summary_window(conn, until - 5 * 60 * 1000, until),
                "last1h": summary_window(conn, until - 60 * 60 * 1000, until),
                "today": summary_window(conn, today_start_ms(), until),
                "last24h": summary_window(conn, since_24h, until),
            },
            "timelines": {
                "fiveMinute": make_timeline(conn, 5 * 60, 6, until),
                "hourly": make_timeline(conn, 60 * 60, 48, until),
            },
            "topPages": top_pages(conn, since_24h, until),
            "topReferrers": top_referrers(conn, since_24h, until),
            "topClicks": top_clicks(conn, since_24h, until),
            "ipStats": ip_stats(conn, since_24h, until),
        }
    return stats


def fetch_events(event: str = "", limit: int = 100) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 500))
    sql = """
        SELECT id, received_at_ms, client_ts_ms, event, visitor_id, session_id, page, url, title,
               referrer, language, user_agent, ip, origin, duration_ms, scroll_percent,
               category, label, target_text, target_url, data_json
        FROM events
    """
    params: list[Any] = []
    if event:
        sql += " WHERE event = ?"
        params.append(event)
    sql += " ORDER BY received_at_ms DESC, id DESC LIMIT ?"
    params.append(limit)

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["received_at"] = iso_ms(item.get("received_at_ms"))
        item["client_ts"] = iso_ms(item.get("client_ts_ms"))
        try:
            item["data"] = json.loads(item.get("data_json") or "{}")
        except Exception:
            item["data"] = {}
        result.append(item)
    return result


class AnalyticsHandler(BaseHTTPRequestHandler):
    server_version = "KuaiMaAnalytics/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        # 保留简洁访问日志，避免输出完整请求体。
        print("[%s] %s - %s" % (datetime.now(APP_TZ).isoformat(timespec="seconds"), self.address_string(), fmt % args))

    def do_OPTIONS(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/track":
            self.send_response(204)
            self.send_track_cors_headers()
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/track":
            self.handle_track()
            return
        self.send_json({"ok": False, "error": "not_found"}, status=404)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        if path == "/health":
            self.send_json({"ok": True, "time": iso_ms(now_ms())})
            return
        if path == "/":
            self.redirect("/dashboard")
            return
        if path in {"/dashboard", "/dashboard.html"}:
            if not self.require_auth():
                return
            self.serve_dashboard()
            return
        if path == "/api/stats":
            if not self.require_auth():
                return
            self.send_json({"ok": True, "data": build_stats()})
            return
        if path == "/api/events":
            if not self.require_auth():
                return
            query = parse_qs(parsed.query)
            event = trim((query.get("event") or [""])[0], 64)
            limit = to_int((query.get("limit") or ["100"])[0], 100) or 100
            self.send_json({"ok": True, "data": fetch_events(event, limit)})
            return
        if path == "/api/export.csv":
            if not self.require_auth():
                return
            self.handle_export_csv(parsed.query)
            return
        self.send_json({"ok": False, "error": "not_found"}, status=404)

    def send_track_cors_headers(self) -> None:
        origin = self.headers.get("Origin", "")
        allowed = resolve_allowed_origin(origin)
        if allowed:
            self.send_header("Access-Control-Allow-Origin", allowed)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")

    def send_json(self, data: dict[str, Any], status: int = 200, cors: bool = False) -> None:
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        if cors:
            self.send_track_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location: str) -> None:
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def unauthorized(self) -> None:
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="KuaiMa Analytics"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write("需要登录统计后台".encode("utf-8"))

    def require_auth(self) -> bool:
        if not ADMIN_PASSWORD:
            return True
        auth = self.headers.get("Authorization", "")
        expected_raw = f"{ADMIN_USER}:{ADMIN_PASSWORD}".encode("utf-8")
        expected = "Basic " + base64.b64encode(expected_raw).decode("ascii")
        if hmac.compare_digest(auth, expected):
            return True
        self.unauthorized()
        return False

    def serve_dashboard(self) -> None:
        file_path = PUBLIC_DIR / "dashboard.html"
        if not file_path.exists():
            self.send_json({"ok": False, "error": "dashboard_missing"}, status=500)
            return
        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_track(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin and not resolve_allowed_origin(origin):
            self.send_json({"ok": False, "error": "origin_not_allowed"}, status=403, cors=True)
            return

        content_length = to_int(self.headers.get("Content-Length"), 0) or 0
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.send_json({"ok": False, "error": "invalid_body_size"}, status=413, cors=True)
            return

        raw = self.rfile.read(content_length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self.send_json({"ok": False, "error": "invalid_json"}, status=400, cors=True)
            return

        if not isinstance(payload, dict):
            self.send_json({"ok": False, "error": "payload_must_be_object"}, status=400, cors=True)
            return

        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        received = now_ms()
        event = trim(payload.get("event"), 64) or "unknown"
        ip = self.get_client_ip()
        user_agent = trim(self.headers.get("User-Agent") or payload.get("userAgent"), 1024)
        duration_ms = to_int(payload.get("durationMs"), None)
        if duration_ms is not None:
            duration_ms = max(0, min(duration_ms, 24 * 3600 * 1000))

        scroll_percent = to_int(payload.get("scrollPercent"), None)
        if scroll_percent is not None:
            scroll_percent = max(0, min(scroll_percent, 100))

        data_json = json.dumps(data, ensure_ascii=False, separators=(",", ":"))[:65535]
        row = (
            received,
            to_int(payload.get("ts"), None),
            event,
            trim(payload.get("visitorId"), 128),
            trim(payload.get("sessionId"), 128),
            trim(payload.get("page"), 512),
            trim(payload.get("url"), 2048),
            trim(payload.get("title"), 512),
            trim(payload.get("referrer"), 2048),
            trim(payload.get("language"), 64),
            user_agent,
            ip,
            trim(origin, 512),
            duration_ms,
            scroll_percent,
            trim(data.get("category"), 128),
            trim(data.get("label"), 512),
            trim(data.get("targetText"), 512),
            trim(data.get("targetUrl"), 2048),
            data_json,
        )
        with get_conn() as conn:
            conn.execute(
                """
                INSERT INTO events (
                  received_at_ms, client_ts_ms, event, visitor_id, session_id, page, url, title,
                  referrer, language, user_agent, ip, origin, duration_ms, scroll_percent,
                  category, label, target_text, target_url, data_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row,
            )
        self.send_json({"ok": True}, cors=True)

    def get_client_ip(self) -> str:
        # Nginx / CDN 反代时优先读取真实 IP 头；否则取 TCP 对端地址。
        for header in ["CF-Connecting-IP", "X-Real-IP", "X-Forwarded-For"]:
            value = self.headers.get(header, "")
            if value:
                return trim(value.split(",")[0], 128)
        return trim(self.client_address[0] if self.client_address else "", 128)

    def handle_export_csv(self, query_string: str) -> None:
        query = parse_qs(query_string)
        days = to_int((query.get("days") or ["7"])[0], 7) or 7
        days = max(1, min(days, 90))
        since_ms = now_ms() - days * 24 * 3600 * 1000
        with get_conn() as conn:
            rows = conn.execute(
                """
                SELECT id, received_at_ms, event, visitor_id, session_id, page, url, referrer,
                       language, ip, origin, duration_ms, scroll_percent, category, label,
                       target_text, target_url, user_agent
                FROM events
                WHERE received_at_ms >= ?
                ORDER BY received_at_ms DESC, id DESC
                """,
                (since_ms,),
            ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "id",
                "received_at",
                "event",
                "visitor_id",
                "session_id",
                "page",
                "url",
                "referrer",
                "language",
                "ip",
                "origin",
                "duration_ms",
                "scroll_percent",
                "category",
                "label",
                "target_text",
                "target_url",
                "user_agent",
            ]
        )
        for row in rows:
            item = dict(row)
            writer.writerow(
                [
                    item.get("id"),
                    iso_ms(item.get("received_at_ms")),
                    item.get("event"),
                    item.get("visitor_id"),
                    item.get("session_id"),
                    item.get("page"),
                    item.get("url"),
                    item.get("referrer"),
                    item.get("language"),
                    item.get("ip"),
                    item.get("origin"),
                    item.get("duration_ms"),
                    item.get("scroll_percent"),
                    item.get("category"),
                    item.get("label"),
                    item.get("target_text"),
                    item.get("target_url"),
                    item.get("user_agent"),
                ]
            )
        body = output.getvalue().encode("utf-8-sig")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="analytics-events-{days}d.csv"')
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    init_db()
    print("快码埋点服务已启动")
    print(f"- 监听地址：http://{HOST}:{PORT}")
    print(f"- 数据库：{DB_PATH}")
    print(f"- 对外接口：{PUBLIC_BASE_URL}/api/track")
    print(f"- 后台地址：{PUBLIC_BASE_URL}/dashboard")
    print(f"- 后台账号：{ADMIN_USER}")
    if ADMIN_PASSWORD == "admin123456":
        print("- 注意：当前使用默认后台密码 admin123456，正式部署请设置 ANALYTICS_ADMIN_PASSWORD")
    print(f"- 允许上报来源：{', '.join(ALLOWED_ORIGINS)}")
    server = ThreadingHTTPServer((HOST, PORT), AnalyticsHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止服务...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
