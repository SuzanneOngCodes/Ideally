from dataclasses import dataclass


@dataclass(frozen=True)
class Memory:
    id: str
    category: str
    content: str
    created_at: str
