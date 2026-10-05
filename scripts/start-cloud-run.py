"""Start FastAPI before Express and supervise both processes."""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BACKEND_PORT = os.environ.get("BACKEND_PORT", "8000")
children = []
stopping = False


def stop(signum=None, frame=None):
    global stopping
    stopping = True
    for child in children:
        if child.poll() is None:
            try:
                os.killpg(child.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass


def start(command, cwd):
    child = subprocess.Popen(command, cwd=cwd, start_new_session=True)
    children.append(child)
    return child


def main():
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    backend = start(
        [
            str(ROOT / "backend/.venv/bin/python"),
            "-m",
            "uvicorn",
            "src.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            BACKEND_PORT,
        ],
        ROOT / "backend",
    )
    deadline = time.monotonic() + 90
    while not stopping:
        if backend.poll() is not None:
            raise RuntimeError("FastAPI exited before becoming ready")
        try:
            with urlopen(
                f"http://127.0.0.1:{BACKEND_PORT}/health", timeout=1
            ) as response:
                if response.status == 200:
                    break
        except OSError:
            pass
        if time.monotonic() >= deadline:
            raise RuntimeError("FastAPI startup timed out")
        time.sleep(0.2)
    if stopping:
        return 0
    start([str(ROOT / "node_modules/.bin/tsx"), "server.ts"], ROOT)
    while not stopping:
        for child in children:
            if child.poll() is not None:
                return child.returncode or 1
        time.sleep(0.2)
    return 0


if __name__ == "__main__":
    code = 1
    try:
        code = main()
    except (OSError, RuntimeError) as error:
        print(f"Startup failed: {error}", file=sys.stderr)
    finally:
        stop()
        deadline = time.monotonic() + 7
        for child in children:
            try:
                child.wait(timeout=max(0.1, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                child.wait()
    sys.exit(code)
