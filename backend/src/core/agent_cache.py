"""Small file-backed cache for completed agent replies.

Each cache entry is stored in its own file. Writers use unique temporary files
and an atomic replace, so concurrent requests never expose a partially written
JSON document and do not need a process or filesystem lock.
"""

import hashlib
import json
import os
import re
import tempfile
import time
import unicodedata
from pathlib import Path
from typing import Any


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value).casefold()).strip()


class AgentReplyCache:
    def __init__(self, directory: Path, ttl_seconds: int = 86_400):
        self.directory = directory
        self.ttl_seconds = ttl_seconds

    @staticmethod
    def make_key(
        history: list[dict[str, str]],
        research: bool,
        models: list[str],
    ) -> str | None:
        user_messages = [message for message in history if message.get("role") == "user"]
        if not user_messages:
            return None

        question = normalize_text(user_messages[-1].get("content", ""))
        if not question:
            return None

        # Ignore an earlier identical question and its answer in the same
        # conversation. Asking it again with unchanged context can then hit cache.
        context = []
        skip_matching_answer = False
        for message in history[:-1]:
            role = message.get("role")
            content = message.get("content", "")
            if role == "user":
                skip_matching_answer = normalize_text(content) == question
                if not skip_matching_answer:
                    context.append({"role": role, "content": normalize_text(content)})
            elif role == "assistant":
                if not skip_matching_answer:
                    context.append({"role": role, "content": normalize_text(content)})
                skip_matching_answer = False

        key_data = {
            "version": 1,
            "question": question,
            "context": context,
            "research": research,
            "models": models,
        }
        encoded = json.dumps(key_data, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def get(self, key: str) -> dict[str, Any] | None:
        if self.ttl_seconds <= 0:
            return None
        path = self.directory / f"{key}.json"
        try:
            entry = json.loads(path.read_text(encoding="utf-8"))
            if time.time() - float(entry["created_at"]) > self.ttl_seconds:
                return None
            value = entry.get("reply")
            return value if isinstance(value, dict) else None
        except (OSError, ValueError, TypeError, KeyError):
            # A bad or concurrently replaced entry is a cache miss, never a
            # reason to fail the user's request.
            return None

    def set(self, key: str, reply: dict[str, Any]) -> None:
        if self.ttl_seconds <= 0:
            return
        self.directory.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(
            {"created_at": time.time(), "reply": reply},
            ensure_ascii=False,
            separators=(",", ":"),
        )
        fd, temporary_name = tempfile.mkstemp(prefix=f".{key}.", suffix=".tmp", dir=self.directory)
        temporary_path = Path(temporary_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as temporary_file:
                temporary_file.write(payload)
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_path, self.directory / f"{key}.json")
        finally:
            temporary_path.unlink(missing_ok=True)
