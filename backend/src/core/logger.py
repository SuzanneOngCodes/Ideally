"""Structured application events with bounded, redacted diagnostic fields."""

import json
import logging
import re
import traceback
from contextvars import ContextVar
from datetime import UTC, datetime
from pathlib import Path

log_context: ContextVar[dict] = ContextVar("log_context", default={})
_secrets: tuple[str, ...] = ()
_sensitive = re.compile(r"api.?key|token|password|secret|authorization|cookie|credential", re.I)


def sanitize(value, depth=0):
    if depth > 6:
        return "[max depth]"
    if isinstance(value, dict):
        return {
            str(k): (
                "[REDACTED]"
                if _sensitive.search(str(k))
                and str(k)
                not in {
                    "input_tokens",
                    "output_tokens",
                    "total_tokens",
                    "input_token_details",
                    "output_token_details",
                }
                else sanitize(v, depth + 1)
            )
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
    text = re.sub(
        r"(?i)((?:api[_-]?key|token|password|secret|authorization)=)[^&\s]+",
        r"\1[REDACTED]",
        text,
    )
    return text if len(text) <= 2000 else text[:2000] + "…[truncated]"


def error_fields(error: BaseException) -> dict:
    # Locations diagnose NameError/etc. without dumping provider bodies or local variables.
    return {
        "error_type": type(error).__name__,
        "missing_name": error.name if isinstance(error, NameError) else None,
        "provider_status": getattr(error, "code", None) or getattr(error.__cause__, "code", None),
        "frames": [
            {"file": Path(f.filename).name, "line": f.lineno, "function": f.name}
            for f in traceback.extract_tb(error.__traceback__)[-8:]
        ],
    }


def log_event(event: str, level=logging.INFO, **fields) -> None:
    payload = sanitize({**log_context.get(), **fields, "event": event})
    encoded = json.dumps(payload, ensure_ascii=False)
    if len(encoded) > 24000:
        # Bound unusually large nested arguments while retaining event correlation fields.
        payload = {
            k: (str(v)[:2000] + "…[truncated]" if len(str(v)) > 2000 else v)
            for k, v in payload.items()
        }
        encoded = json.dumps(payload, ensure_ascii=False)
    logging.getLogger("ideally.events").log(level, encoded)


class JsonFormatter(logging.Formatter):
    def format(self, record):
        data = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
        }
        if record.name == "ideally.events":
            data.update(json.loads(record.getMessage()))
        else:
            data.update(log_context.get())
            data["message"] = sanitize(record.getMessage())
        if record.exc_info and record.exc_info[1]:
            data.update(error_fields(record.exc_info[1]))
        return json.dumps(data, ensure_ascii=False)


def configure_logging(level: str, secrets: tuple[str, ...] = ()) -> None:
    global _secrets
    _secrets = tuple(set(_secrets).union(s for s in secrets if s))
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    handler = next((h for h in root.handlers if getattr(h, "ideally_handler", False)), None)
    if handler is None:
        handler = logging.StreamHandler()
        handler.ideally_handler = True
        root.addHandler(handler)
    handler.setFormatter(JsonFormatter())
    for name in ("httpx", "httpx2", "httpcore"):
        logging.getLogger(name).setLevel(logging.WARNING)
