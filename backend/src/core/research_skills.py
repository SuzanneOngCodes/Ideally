"""Trusted skills are shipped by the application, not taken from retrieved websites."""

from pathlib import Path

from deepagents.backends.utils import create_file_data

SKILL_ROOT = Path(__file__).resolve().parents[1] / "skills"
STAGE_SKILLS = {
    "clarify": "clarify-research-context",
    "verify": "verify-problem",
    "review": "read-research-source",
    "compare": "compare-directions",
    "design": "design-experiment",
    "brief": "write-research-brief",
}


def active_skill(stage: str) -> str:
    return (SKILL_ROOT / STAGE_SKILLS[stage] / "SKILL.md").read_text()


def skill_files() -> dict:
    return {
        f"/skills/{name}/SKILL.md": create_file_data((SKILL_ROOT / name / "SKILL.md").read_text())
        for name in STAGE_SKILLS.values()
    }


def skill_permissions():
    from deepagents.middleware.filesystem import FilesystemPermission

    return [FilesystemPermission(operations=["write"], paths=["/skills/**"], mode="deny")]
