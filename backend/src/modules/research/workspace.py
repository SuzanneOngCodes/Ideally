"""Internal, durable research workspace; full documents never enter public responses."""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field

from src.modules.research.schemas import Source

Stage = Literal["clarify", "verify", "review", "compare", "design", "brief"]
ReadScope = Literal["snippet", "abstract", "selected_sections"]


class UserFact(BaseModel):
    value: str = Field(max_length=1000)
    user_quote: str = Field(min_length=1, max_length=1000)
    origin: Literal["user"] = "user"


class ResearchContext(BaseModel):
    problem: UserFact | None = None
    affected_users: UserFact | None = None
    task: UserFact | None = None
    selected_direction: UserFact | None = None
    constraints: dict[str, UserFact] = Field(default_factory=dict, max_length=12)
    open_questions: list[str] = Field(default_factory=list, max_length=12)
    constraints_reviewed: bool = False


class Excerpt(BaseModel):
    id: str
    source_id: str
    retrieved_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    document_id: str
    text: str
    start_line: int
    end_line: int
    read_scope: ReadScope


class Document(BaseModel):
    id: str
    source_id: str
    markdown: str
    fetched_at: str = ""
    content_hash: str
    retained_hash: str
    truncated: bool = False


class EvidenceLink(BaseModel):
    excerpt_id: str
    relation: Literal["supports", "contradicts", "background"]
    evidence_kind: Literal["existence", "prevalence", "cause", "solution_effect"]
    study_context: str = Field(max_length=2000)
    limitations: list[str] = Field(default_factory=list, max_length=10)
    assessed_by: Literal["AI"] = "AI"


class Claim(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    statement: str = Field(min_length=1, max_length=2000)
    links: list[EvidenceLink] = Field(default_factory=list, max_length=12)
    assessed: bool = False
    assessment: Literal["supported", "contradicted", "mixed", "insufficient"] = "insufficient"


class SearchQuery(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    angle: Literal["support", "challenge", "background"]


class EvidencePlan(BaseModel):
    claim_id: str = Field(min_length=1, max_length=80)
    statement: str = Field(min_length=1, max_length=2000)
    evidence_kind: Literal["existence", "prevalence", "cause", "solution_effect"]
    queries: list[SearchQuery] = Field(min_length=1, max_length=3)
    revision_condition: str = Field(min_length=1, max_length=2000)


class Workspace(BaseModel):
    version: int = 1
    map_snapshot: dict | None = None
    stage: Stage = "clarify"
    context: ResearchContext = Field(default_factory=ResearchContext)
    sources: dict[str, Source] = Field(default_factory=dict)
    documents: dict[str, Document] = Field(default_factory=dict)
    excerpts: dict[str, Excerpt] = Field(default_factory=dict)
    claims: dict[str, Claim] = Field(default_factory=dict)
    plans: list[EvidencePlan] = Field(default_factory=list)
    searched_angles: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)

    def context_packet(self) -> dict:
        return {
            "stage": self.stage,
            "map": {
                key: {
                    "title": str(card.get("title") or "")[:200],
                    "summary": str(card.get("summary") or "")[:400],
                    "claim_ids": card.get("claim_ids", []),
                }
                for key, card in (self.map_snapshot or {}).items()
            },
            "context": self.context.model_dump(),
            "claims": [
                {
                    "id": c.id,
                    "statement": c.statement[:500],
                    "assessed": c.assessed,
                    "assessment": c.assessment,
                    "links": [
                        {
                            "excerpt_id": link.excerpt_id,
                            "relation": link.relation,
                            "evidence_kind": link.evidence_kind,
                        }
                        for link in c.links
                    ],
                }
                for c in self.claims.values()
            ],
            "sources": [
                {"id": k, "title": s.title, "url": str(s.url)} for k, s in self.sources.items()
            ],
            "documents": [
                {"id": d.id, "source_id": d.source_id, "truncated": d.truncated}
                for d in self.documents.values()
            ],
            "excerpt_index": [
                {"id": e.id, "source_id": e.source_id, "read_scope": e.read_scope}
                for e in self.excerpts.values()
            ],
            "plans": [p.model_dump() for p in self.plans[-2:]],
            "searched_angles": self.searched_angles,
            "decisions": [d[:500] for d in self.decisions[-5:]],
        }
