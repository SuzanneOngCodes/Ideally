"""Trusted skills are shipped by the application, not taken from retrieved websites."""

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
}


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
