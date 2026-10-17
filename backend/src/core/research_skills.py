"""Trusted skills are shipped by the application, not taken from retrieved websites."""

import re
from pathlib import Path

from deepagents.backends.utils import create_file_data

from src.core.logger import error_fields, log_event

SKILL_ROOT = Path(__file__).resolve().parents[1] / "skills"
STAGE_SKILLS = {
    "clarify": "clarify-research-context",
    "verify": "verify-problem",
    "review": "read-research-source",
    "compare": "compare-directions",
    "design": "design-experiment",
    "brief": "write-research-brief",
    "diagram": "visualize-reasoning-map",
}

_DIAGRAM_REQUEST = re.compile(
    r"(?:\b(?:show|draw|render|display|create|make|generate|visuali[sz](?:e|ation))\b"
    r".{0,40}\b(?:diagram|flowchart|graph|map)\b|"
    r"\b(?:i\s+want|i\s+need|i['’]d\s+like)\b"
    r".{0,40}\b(?:diagram|flowchart|graph|map)\b|"
    r"^\s*(?:diagram|flowchart)\s*(?:please|pls)?\s*[.!?]*$|"
    r"(?:vẽ|tạo|hiển\s*thị|trình\s*bày|cho\s+(?:tôi|mình)\s+xem|"
    r"muốn\s+(?:xem|có)|cần\s+xem|trực\s*quan\s*hóa|trực\s*quan\s*hoá|"
    r"minh\s*họa|minh\s*hoạ).{0,40}(?:sơ\s*đồ|sơ\s*do|biểu\s*đồ|diagram|flowchart|map|luồng)|"
    r"(?:sơ\s*đồ|sơ\s*do|biểu\s*đồ).{0,25}(?:để\s+dễ\s+nhìn|cho\s+dễ\s+hiểu))",
    re.IGNORECASE,
)
_NO_DIAGRAM_REQUEST = re.compile(
    r"(?:\bno\b|\bdon['’]?t\b|\bwithout\b|không|ko|đừng|chưa\s*cần)"
    r".{0,40}(?:diagram|flowchart|graph|map|sơ\s*đồ|sơ\s*do|biểu\s*đồ)",
    re.IGNORECASE,
)


def is_diagram_request(text: str) -> bool:
    """Only activate diagram rendering for a clear, affirmative user request."""
    return bool(_DIAGRAM_REQUEST.search(text) and not _NO_DIAGRAM_REQUEST.search(text))


def active_skill(stage: str, *, source: str = "stage_middleware") -> str:
    name = STAGE_SKILLS[stage]
    path = SKILL_ROOT / name / "SKILL.md"
    log_event("skill.load.start", skill=name, stage=stage, path=str(path))
    try:
        content = path.read_text()
    except Exception as error:
        log_event("skill.load.error", skill=name, stage=stage, **error_fields(error))
        raise
    log_event(
        "skill.loaded",
        skill=name,
        stage=stage,
        source=source,
        content_chars=len(content),
        scope="full",
    )
    return content


def skill_files() -> dict:
    files = {
        f"/skills/{name}/SKILL.md": create_file_data((SKILL_ROOT / name / "SKILL.md").read_text())
        for name in STAGE_SKILLS.values()
    }
    log_event("skill.catalog.ready", skills=list(STAGE_SKILLS.values()), paths=list(files))
    return files


def skill_permissions():
    from deepagents.middleware.filesystem import FilesystemPermission

    return [FilesystemPermission(operations=["write"], paths=["/skills/**"], mode="deny")]
