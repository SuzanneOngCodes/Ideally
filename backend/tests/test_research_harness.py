import asyncio
import json
import time

from src.core.config import Settings
from src.core.research_harness import ResearchRun, stable_id
from src.modules.research.schemas import (
    AgentReply,
    ReasoningCard,
    ReasoningMap,
    ResearchResult,
    Source,
)
from src.modules.research.workspace import Workspace

HISTORY = [
    {
        "role": "user",
        "content": "Support teams classify tickets. Classification is slow. "
        "I have two weeks and no GPU. I choose a small classifier.",
    }
]


def run():
    return ResearchRun(Settings(_env_file=None), Workspace(), HISTORY)


async def call(tools, name, **kwargs):
    return json.loads(await tools[name].ainvoke(kwargs))


def context():
    return {
        "problem": {"value": "Slow classification", "user_quote": "Classification is slow."},
        "affected_users": {"value": "Support teams", "user_quote": "Support teams"},
        "task": {"value": "Classify tickets", "user_quote": "classify tickets"},
        "constraints": {"time": {"value": "Two weeks", "user_quote": "two weeks"}},
        "constraints_reviewed": True,
        "open_questions": ["Dataset access unknown"],
    }


def plan():
    return {
        "claim_id": "latency",
        "statement": "Classification latency matters",
        "evidence_kind": "existence",
        "revision_condition": "Revise if latency meets needs",
        "queries": [
            {"query": "measured classification latency", "angle": "support"},
            {"query": "classification latency acceptable", "angle": "challenge"},
        ],
    }


def test_context_quotes_and_stage_gates():
    async def check():
        research = run()
        tools = {t.name: t for t in research.tools(None, None)}
        assert (await call(tools, "advance_research_stage", stage="verify"))["status"] == "warning"
        invented = context()
        invented["constraints"]["gpu"] = {"value": "GPU available", "user_quote": "RTX 4090"}
        assert (await call(tools, "update_research_context", context=invented))["status"] == "error"
        assert not research.workspace.context.problem
        await call(tools, "update_research_context", context=context())
        assert (await call(tools, "advance_research_stage", stage="verify"))["status"] == "success"
        assert (await call(tools, "advance_research_stage", stage="compare"))["status"] == "error"
        assert (await call(tools, "advance_research_stage", stage="review"))["status"] == "warning"

    asyncio.run(check())


def test_challenge_search_assessment_and_user_selection_gate():
    async def check():
        research = run()
        seen = []

        async def search(query):
            seen.append(query)
            return {"results": []}

        tools = {t.name: t for t in research.tools(search, None)}
        await call(tools, "update_research_context", context=context())
        await call(tools, "advance_research_stage", stage="verify")
        bad = plan()
        bad["queries"] = bad["queries"][:1]
        assert (await call(tools, "plan_evidence", plan=bad))["status"] == "error"
        await call(tools, "plan_evidence", plan=plan())
        assert (
            await call(
                tools,
                "assess_evidence",
                claim_id="latency",
                links=[
                    {
                        "excerpt_id": "fabricated",
                        "relation": "supports",
                        "evidence_kind": "existence",
                        "study_context": "unknown",
                    }
                ],
            )
        )["status"] == "error"
        await call(tools, "assess_evidence", claim_id="latency", links=[])
        await call(tools, "advance_research_stage", stage="review")
        assert (await call(tools, "advance_research_stage", stage="compare"))["status"] == "warning"
        await call(tools, "search_evidence", claim_id="latency")
        assert len(seen) == 2
        assert (await call(tools, "advance_research_stage", stage="compare"))["status"] == "success"
        assert (await call(tools, "advance_research_stage", stage="design"))["status"] == "warning"
        selected = context() | {
            "selected_direction": {
                "value": "Small classifier",
                "user_quote": "I choose a small classifier.",
            }
        }
        await call(tools, "update_research_context", context=selected)
        assert (await call(tools, "advance_research_stage", stage="design"))["status"] == "success"
        final = research.finalize(
            AgentReply(
                answer="Assessment",
                research=ResearchResult(title="Topic", summary="No empirical evidence found"),
            )
        )
        assert final.research.provisional  # empty search results never establish novelty/support

    asyncio.run(check())


def test_read_sections_beyond_initial_crop_and_immutable_provenance():
    async def check():
        research = run()
        source = Source(title="Paper", url="https://example.com/paper")
        sid, snippet = research.add_source(source, "Search snippet")
        full = "# Introduction\n" + ("Unrelated introductory text.\n" * 500)
        full += "# Results\nMeasured classification latency is 5 ms under workload A.\n"
        data = research.add_document(
            {
                "source_url": str(source.url),
                "title": "Paper",
                "markdown": full[:8000],
                "document_markdown": full,
                "document_truncated": False,
                "truncated": True,
                "success": True,
            }
        )
        tools = {t.name: t for t in research.tools(None, None)}
        read = await call(
            tools,
            "read_source_sections",
            document_id=data["document_id"],
            question="Results measured classification latency workload",
        )
        excerpts = read["data"]["excerpts"]
        result = next(e for e in excerpts if "5 ms" in e["text"])
        assert result["start_line"] > 250
        doc = research.workspace.documents[data["document_id"]]
        assert result["text"] in doc.markdown
        assert result["read_scope"] == "selected_sections"
        await call(tools, "plan_evidence", plan=plan())
        wrong = {
            "excerpt_id": result["id"],
            "relation": "supports",
            "evidence_kind": "prevalence",
            "study_context": "Workload A",
        }
        assert (await call(tools, "assess_evidence", claim_id="latency", links=[wrong]))[
            "status"
        ] == "error"
        wrong["evidence_kind"] = "existence"
        assert (await call(tools, "assess_evidence", claim_id="latency", links=[wrong]))[
            "status"
        ] == "success"
        # Across runs, old snippets must be reread before creating a new assessment.
        resumed = ResearchRun(
            Settings(_env_file=None),
            Workspace.model_validate(research.workspace.model_dump()),
            HISTORY,
        )
        tools = {t.name: t for t in resumed.tools(None, None)}
        assert (await call(tools, "assess_evidence", claim_id="latency", links=[wrong]))[
            "status"
        ] == "error"
        await call(tools, "read_source_sections", document_id=result["id"], question="reread")
        assert (await call(tools, "assess_evidence", claim_id="latency", links=[wrong]))[
            "status"
        ] == "success"
        assert stable_id("src", str(source.url)) == sid
        assert snippet in resumed.workspace.excerpts

    asyncio.run(check())


def test_deadline_no_search_and_provisional_partial_state():
    async def check():
        research = run()
        research.workspace.stage = "verify"
        research.cutoff = time.monotonic() - 1

        async def search(query):
            raise AssertionError("Must not call provider after deadline")

        tools = {t.name: t for t in research.tools(search, None)}
        await call(tools, "plan_evidence", plan=plan())
        assert (await call(tools, "search_evidence", claim_id="latency"))["status"] == "warning"
        result = research.partial_reply()
        assert result.research.provisional
        assert result.workspace["claims"]["latency"]["assessment"] == "insufficient"
        assert "workspace" not in result.model_dump()

    asyncio.run(check())


def test_card_citation_alone_cannot_mark_source_supported():
    research = run()
    source = Source(title="Paper", url="https://example.com/")
    research.add_source(source)
    cards = {
        name: ReasoningCard(
            title=name,
            summary="Claim",
            explanation="Claim",
            status="source-supported",
            sources=[source],
        )
        for name in ("problem", "evidence", "research_question", "hypothesis", "experiment")
    }
    result = research.finalize(
        AgentReply(
            answer="Answer",
            research=ResearchResult(
                title="Topic", summary="Summary", reasoning_map=ReasoningMap(**cards)
            ),
        )
    )
    assert result.research.reasoning_map.evidence.status == "insufficient-evidence"


def test_contradictory_evidence_stays_mixed_and_provisional():
    async def check():
        research = run()
        source = Source(title="Measured study", url="https://example.com/study")
        _, support = research.add_source(source, "Latency is high in workload A")
        _, contrary = research.add_source(source, "Latency is acceptable in workload B")
        tools = {t.name: t for t in research.tools(None, None)}
        await call(tools, "plan_evidence", plan=plan())
        links = [
            {
                "excerpt_id": eid,
                "relation": relation,
                "evidence_kind": "existence",
                "study_context": workload,
                "limitations": ["Not comparable workloads"],
            }
            for eid, relation, workload in [
                (support, "supports", "A"),
                (contrary, "contradicts", "B"),
            ]
        ]
        await call(tools, "assess_evidence", claim_id="latency", links=links)
        final = research.finalize(
            AgentReply(
                answer="Mixed evidence",
                research=ResearchResult(title="Latency", summary="Depends on workload"),
            )
        )
        assert final.research.claims[0]["assessment"] == "mixed"
        assert final.research.provisional
        assert len(final.research.evidence) == 2
        assert final.research.evidence[0]["published_at"] is None
        assert final.research.evidence[0]["fetched_at"]
        assert final.research.evidence[0]["source_url"] == "https://example.com/study"

    asyncio.run(check())


def test_changing_problem_invalidates_old_claims_but_preserves_sources():
    async def check():
        research = run()
        tools = {t.name: t for t in research.tools(None, None)}
        await call(tools, "update_research_context", context=context())
        await call(tools, "plan_evidence", plan=plan())
        research.add_source(Source(title="Source", url="https://example.com/"))
        research.workspace.stage = "compare"
        changed = context()
        changed["problem"] = {"value": "No GPU", "user_quote": "no GPU"}
        await call(tools, "update_research_context", context=changed)
        assert research.workspace.stage == "clarify"
        assert not research.workspace.claims
        assert research.workspace.sources

    asyncio.run(check())
