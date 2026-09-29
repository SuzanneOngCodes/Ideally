import re
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from src.models.memory import Memory


class SQLiteMemoryRepository:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.database_path, timeout=30)) as connection:
            with connection:
                connection.execute("PRAGMA journal_mode=WAL")
                connection.execute(
                    """CREATE TABLE IF NOT EXISTS long_term_memories (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        category TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )"""
                )
                connection.execute(
                    """CREATE INDEX IF NOT EXISTS idx_memories_user
                       ON long_term_memories(user_id)"""
                )

    def save(self, user_id: str, content: str, category: str = "general") -> str:
        memory_id = str(uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        with closing(sqlite3.connect(self.database_path, timeout=30)) as connection:
            with connection:
                connection.execute(
                    """INSERT INTO long_term_memories
                       (id, user_id, category, content, created_at)
                       VALUES (?, ?, ?, ?, ?)""",
                    (memory_id, user_id, category[:80], content, created_at),
                )
        return memory_id

    def search(self, user_id: str, query: str, limit: int = 5) -> list[Memory]:
        with closing(sqlite3.connect(self.database_path, timeout=30)) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                """SELECT id, category, content, created_at
                   FROM long_term_memories
                   WHERE user_id = ?
                   ORDER BY created_at DESC
                   LIMIT 500""",
                (user_id,),
            ).fetchall()

        query_terms = set(re.findall(r"[\w'-]+", query.lower()))
        memories = [Memory(**dict(row)) for row in rows]
        if not query_terms:
            return memories[:limit]

        ranked = []
        for memory in memories:
            memory_terms = set(re.findall(r"[\w'-]+", memory.content.lower()))
            score = len(query_terms & memory_terms)
            if score:
                ranked.append((score, memory))
        ranked.sort(
            key=lambda item: (item[0], item[1].created_at),
            reverse=True,
        )
        return [memory for _, memory in ranked[:limit]]
