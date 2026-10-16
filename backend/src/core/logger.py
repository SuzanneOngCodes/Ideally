"""Shared structured logging configuration and safe event helpers."""

import json
import logging
import re
import traceback
from contextvars import ContextVar
from datetime import UTC, datetime
from pathlib import Path

log_context: ContextVar[dict] = ContextVar("log_context", default={})
_secrets: tuple[str, ...] = ()
_sensitive = re.compile(r"api.?key|token|password|secret|authorization|cookie|credential|prompt|content|message", re.I)
_service = "ideally-api"


def sanitize(value, depth=0):
    if depth > 6:
        return "[max depth]"
    if isinstance(value, dict):
        return {
            str(k): "[REDACTED]" if _sensitive.search(str(k)) else sanitize(v, depth + 1)
            for k, v in list(value.items())[:40]
        }
    if isinstance(value, (list, tuple)):
        return [sanitize(v, depth + 1) for v in value[:40]]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    text = str(value)
    for secret in _secrets:
        text = text.replace(secret, "[REDACTED]")
    text = re.sub(r"(?i)(Bearer\s+)\S+", r"\1[REDACTED]", text)
    text = re.sub(r"(?i)((?:api[_-]?key|token|password|secret|authorization)=)[^&\s]+", r"\1[REDACTED]", text)
    return text if len(text) <= 1000 else text[:1000] + "…[truncated]"


def error_fields(error: BaseException) -> dict:
    return {
        "error_type": type(error).__name__,
        "provider_status": getattr(error, "code", None) or getattr(error.__cause__, "code", None),
        "frames": [
            {"file": Path(f.filename).name, "line": f.lineno, "function": f.name}
            for f in traceback.extract_tb(error.__traceback__)[-8:]
        ],
    }


def log_event(event: str, level=logging.INFO, message: str | None = None, **fields) -> None:
    safe = sanitize({**log_context.get(), **fields})
    logging.getLogger("ideally.events").log(
        level, message or event.replace(".", " "), extra={"event_name": event, "event_context": safe}
    )


class JsonFormatter(logging.Formatter):
    def format(self, record):
        context = dict(log_context.get())
        context.update(getattr(record, "event_context", {}))
        trace_id = context.pop("trace_id", "-")
        event = getattr(record, "event_name", "application.log")
        message = sanitize(record.getMessage())
        data = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "level": record.levelname,
            "service": _service,
            "trace_id": trace_id,
            "event": event,
            "message": message,
            "context": sanitize(context),
        }
        if record.exc_info and record.exc_info[1]:
            data["context"] = {**data["context"], **error_fields(record.exc_info[1])}
        return json.dumps(data, ensure_ascii=False)


def configure_logging(level: str = "INFO", secrets: tuple[str, ...] = (), service: str = "ideally-api") -> None:
    global _secrets, _service
    _service = service
    _secrets = tuple(set(_secrets).union(s for s in secrets if s))
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = next((h for h in root.handlers if getattr(h, "ideally_handler", False)), None)
    if handler is None:
        handler = logging.StreamHandler()
        handler.ideally_handler = True
        root.addHandler(handler)
    handler.setFormatter(JsonFormatter())
    for name in ("httpx", "httpcore", "uvicorn.access"):
        logging.getLogger(name).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
