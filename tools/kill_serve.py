# -*- coding: utf-8 -*-
"""关闭所有正在运行的 serve.py 进程。"""
import subprocess
import sys


def main():
    cmd = ['wmic', 'process', 'where',
           "name='python.exe'", 'get', 'processid,commandline', '/format:csv']
    try:
        out = subprocess.check_output(cmd, text=True, encoding='gbk', errors='ignore')
    except Exception as e:
        print(f"[错误] wmic 调用失败: {e}")
        sys.exit(1)

    killed = 0
    for line in out.splitlines():
        if 'serve.py' not in line:
            continue
        parts = line.strip().split(',')
        if not parts:
            continue
        pid = parts[-1].strip()
        if not pid.isdigit():
            continue
        try:
            subprocess.run(['taskkill', '/F', '/PID', pid], check=False,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"[OK] 已结束 PID={pid}")
            killed += 1
        except Exception as e:
            print(f"[失败] PID={pid}: {e}")

    print(f"[完成] 共结束 {killed} 个 serve.py 进程")


if __name__ == '__main__':
    main()
