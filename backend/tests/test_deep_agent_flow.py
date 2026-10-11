"""Exercise the real Deep Agents graph with a scripted model, no provider requests."""

import asyncio

from deepagents import create_deep_agent
from deepagents.backends import StateBackend
from langchain.agents.structured_output import ToolStrategy
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field

from src.core.agent import PROMPT
from src.core.config import Settings
from src.core.research_harness import ResearchMiddleware, ResearchRun
from src.core.research_skills import skill_files
from src.modules.research.schemas import AgentReply
from src.modules.research.workspace import Workspace


class ScriptedModel(BaseChatModel):
    steps: list[dict] = Field(default_factory=list)
    index: int = 0
    seen_prompts: list[str] = Field(default_factory=list)
    seen_tools: list[list[str]] = Field(default_factory=list)

    @property
    def _llm_type(self):
        return "scripted-research-test"

    def bind_tools(self, tools, **kwargs):
        names = [t.name if hasattr(t, "name") else t.get("function", t).get("name") for t in tools]
        self.seen_tools.append(names)
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.seen_prompts.append(str(messages[0].content))
        step = self.steps[self.index]
        self.index += 1
        message = AIMessage(
            content="",
            tool_calls=[
                {
                    "name": step["name"],
                    "args": step["args"],
                    "id": f"call_{self.index}",
                }
            ],
        )
        return ChatResult(generations=[ChatGeneration(message=message)])

    async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
        return self._generate(messages, stop, run_manager, **kwargs)


def test_real_graph_skills_context_stage_and_no_delegation():
    async def check():
        history = [{"role": "user", "content": "Support teams classify tickets. Tickets are slow."}]
        run = ResearchRun(Settings(_env_file=None), Workspace(), history)
        model = ScriptedModel(
            steps=[
                {
                    "name": "update_research_context",
                    "args": {
                        "context": {
                            "problem": {"value": "Slow tickets", "user_quote": "Tickets are slow."},
                            "affected_users": {
                                "value": "Support teams",
                                "user_quote": "Support teams",
                            },
                            "task": {"value": "Classification", "user_quote": "classify tickets"},
                            "open_questions": ["Hardware unknown"],
                        }
                    },
                },
                {"name": "advance_research_stage", "args": {"stage": "verify"}},
                {
                    "name": "AgentReply",
                    "args": {
                        "answer": "We need evidence",
                        "research": {
                            "title": "Classification",
                            "summary": "Initial observation; not verified",
                        },
                    },
                },
            ]
        )
        graph = create_deep_agent(
            model=model,
            tools=run.tools(None, None),
            system_prompt=PROMPT,
            backend=StateBackend(),
            skills=["/skills/"],
            middleware=[ResearchMiddleware(run)],
            response_format=ToolStrategy(AgentReply),
        )
        result = await graph.ainvoke(
            {"messages": history, "files": skill_files()}, config={"recursion_limit": 40}
        )
        assert result["structured_response"].answer == "We need evidence"
        assert run.workspace.stage == "verify"
        for name in (
            "clarify-research-context",
            "verify-problem",
            "read-research-source",
            "compare-directions",
            "design-experiment",
            "write-research-brief",
        ):
            assert name in model.seen_prompts[0]
        assert "verify-problem" in model.seen_prompts[-1]
        assert "Hardware unknown" in model.seen_prompts[-1]
        assert all("task" not in names and "execute" not in names for names in model.seen_tools)

    asyncio.run(check())


def test_real_advisor_search_crawl_assessment_and_comparison(monkeypatch):
    import hashlib

    from src.core import agent as module
    from src.core.research_harness import stable_id
    from src.modules.research.workspace import EvidencePlan

    url = "https://example.com/study"
    markdown = "# Results\nClassification latency was measured in workload A."
    sid = stable_id("src", url)
    did = stable_id("doc", sid + hashlib.sha256(markdown.encode()).hexdigest())
    eid = stable_id("exc", did + ":1:2:" + markdown)
    plan = EvidencePlan(
        claim_id="latency",
        statement="Latency is measured in workload A",
        evidence_kind="existence",
        revision_condition="Narrow if no measurements",
        queries=[
            {"query": "latency measurements", "angle": "support"},
            {"query": "latency is acceptable", "angle": "challenge"},
        ],
    )
    model = ScriptedModel(
        steps=[
            {
                "name": "update_research_context",
                "args": {
                    "context": {
                        "problem": {"value": "Slow classification", "user_quote": "slow"},
                        "affected_users": {"value": "Support teams", "user_quote": "Support teams"},
                        "task": {"value": "Classify tickets", "user_quote": "classify tickets"},
                        "constraints_reviewed": True,
                        "open_questions": ["Hardware not specified"],
                    }
                },
            },
            {"name": "advance_research_stage", "args": {"stage": "verify"}},
            {"name": "plan_evidence", "args": {"plan": plan.model_dump()}},
            {"name": "search_evidence", "args": {"claim_id": "latency"}},
            {"name": "crawl_web_markdown", "args": {"source_ids": [sid]}},
            {
                "name": "read_source_sections",
                "args": {"document_id": did, "question": "Results workload latency"},
            },
            {
                "name": "assess_evidence",
                "args": {
                    "claim_id": "latency",
                    "links": [
                        {
                            "excerpt_id": eid,
                            "relation": "supports",
                            "evidence_kind": "existence",
                            "study_context": "Workload A",
                            "limitations": ["Not prevalence evidence"],
                        }
                    ],
                },
            },
            {"name": "advance_research_stage", "args": {"stage": "review"}},
            {"name": "advance_research_stage", "args": {"stage": "compare"}},
            {
                "name": "AgentReply",
                "args": {
                    "answer": "Measured in workload A",
                    "research": {
                        "title": "Classification",
                        "summary": "Evidence scoped to workload A",
                        "findings": [
                            {
                                "title": "Measurement",
                                "description": "Workload A",
                                "claim_ids": ["latency"],
                            }
                        ],
                        "sources": [{"title": "Study", "url": url}],
                    },
                },
            },
        ]
    )
    seen_queries = []

    async def search(settings, query):
        seen_queries.append(query)
        return {"results": [{"title": "Study", "url": url, "content": "Search snippet"}]}

    async def crawl(self, urls, *, timeout_seconds=None):
        assert urls == [url]
        assert timeout_seconds < 170
        return {
            "results": [
                {
                    "success": True,
                    "source_url": url,
                    "title": "Study",
                    "markdown": markdown,
                    "document_markdown": markdown,
                }
            ]
        }

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", lambda **kwargs: model)
    monkeypatch.setattr(module, "search_external_knowledge", search)
    monkeypatch.setattr(module.CrawlService, "crawl", crawl)
    result = asyncio.run(
        module.AgentService(
            Settings(
                _env_file=None,
                GOOGLE_API_KEY="test",
                tavily_api_key="test",
            )
        ).reply([{"role": "user", "content": "Support teams classify tickets. It is slow."}], True)
    )
    assert len(seen_queries) == 2
    assert result.research.stage == "compare"
    assert result.research.claims[0]["assessment"] == "supported"
    assert result.research.evidence[0]["text"] == markdown
    assert result.workspace["documents"][did]["markdown"] == markdown
    assert result.research.run["crawl_calls"] == 1
    assert result.research.run["search_queries"] == 2
