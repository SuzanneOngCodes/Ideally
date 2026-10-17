import asyncio
import json
from types import SimpleNamespace

import pytest

from src.core.agent import AgentService
from src.core.config import Settings
from src.modules.research.schemas import AgentReply, ResearchResult, Source


def test_agent_uses_grounded_search_and_filters_unobserved_sources(monkeypatch):
    from langchain_core.messages import AIMessage

    from src.core import agent as module

    async def research_route(self, history):
        return module.RouteDecision(route="research")

    class Model:
        def __init__(self, **kwargs):
            assert kwargs["vertexai"] is False

        def bind_tools(self, tools):
            assert tools == [{"google_search": {}}]
            return self

        async def ainvoke(self, query):
            return AIMessage(
                content=[
                    {
                        "type": "text",
                        "text": "Evidence",
                        "annotations": [
                            {
                                "type": "citation",
                                "url": "https://docs.langchain.com/",
                                "title": "Docs",
                            },
                        ],
                    }
                ]
            )

    def build_agent(**kwargs):
        assert kwargs["response_format"].schema is AgentReply

        class Graph:
            async def ainvoke(self, payload, config):
                assert "web_search" in payload["messages"][-1]["content"]
                tools = {t.name: t for t in kwargs["tools"]}
                await tools["load_skill"].ainvoke({"skill": "verify-problem", "task": "Research"})
                await tools["web_search"].ainvoke({"query": "Research AI"})
                await tools["load_skill"].ainvoke({"skill": "read-research-source", "task": "Read"})
                await tools["crawl_web_markdown"].ainvoke({"urls": ["https://docs.langchain.com/"]})
                return {
                    "structured_response": AgentReply(
                        answer="Result",
                        research=ResearchResult(
                            title="AI",
                            summary="Summary",
                            sources=[
                                Source(title="Docs", url="https://docs.langchain.com/"),
                                Source(title="Invented", url="https://example.com/"),
                            ],
                        ),
                    )
                }

        return Graph()

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", Model)
    monkeypatch.setattr(module, "create_deep_agent", build_agent)
    monkeypatch.setattr(AgentService, "_route", research_route)
    service = AgentService(
        Settings(_env_file=None, GOOGLE_API_KEY="test-key", agent_reply_cache_ttl_seconds=0)
    )
    result = asyncio.run(service.reply([{"role": "user", "content": "Research AI"}], True))
    assert [str(s.url) for s in result.research.sources] == ["https://docs.langchain.com/"]


def test_chat_uses_llm_fallback_and_preserves_history(monkeypatch):
    from src.core import agent as module

    async def research_route(self, history):
        return module.RouteDecision(route="research")

    calls = []
    history = [{"role": "user", "content": "Xin chào"}]

    class Model:
        def __init__(self, **kwargs):
            self.name = kwargs["model"]

        def bind_tools(self, tools):
            return self

        def with_structured_output(self, schema):
            assert schema is AgentReply
            return self

        async def ainvoke(self, messages, config=None):
            calls.append(self.name)
            assert messages == history
            if self.name == "primary":
                error = RuntimeError("unavailable")
                error.__cause__ = SimpleProviderError()
                raise error
            return AgentReply(answer="Xin chào!")

    class SimpleProviderError(Exception):
        code = 404

    def build_agent(**kwargs):
        class Graph:
            async def ainvoke(self, payload, config):
                return {"structured_response": await kwargs["model"].ainvoke(payload["messages"])}

        return Graph()

    monkeypatch.setattr(module, "create_deep_agent", build_agent)
    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", Model)
    monkeypatch.setattr(AgentService, "_route", research_route)
    service = AgentService(
        Settings(
            _env_file=None,
            GOOGLE_API_KEY="test-key",
            gemini_model="primary",
            gemini_fallback_model="fallback",
            agent_reply_cache_ttl_seconds=0,
        )
    )
    result = asyncio.run(service.reply(history, False))
    assert result.answer == "Xin chào!"
    assert result.research is None
    assert calls == ["primary", "fallback"]


def test_chat_can_call_tavily_tool(monkeypatch):
    from src.core import agent as module

    async def research_route(self, history):
        return module.RouteDecision(route="research")

    async def search(settings, query):
        assert query == "External knowledge"
        return {
            "results": [{"title": "Docs", "url": "https://docs.tavily.com/", "content": "Evidence"}]
        }

    class Model:
        def __init__(self, **kwargs):
            pass

    def build_agent(**kwargs):
        class Graph:
            async def ainvoke(self, payload, config):
                tools = {t.name: t for t in kwargs["tools"]}
                await tools["load_skill"].ainvoke({"skill": "verify-problem", "task": "Research"})
                result = await tools["web_search"].ainvoke({"query": "External knowledge"})
                await tools["load_skill"].ainvoke({"skill": "read-research-source", "task": "Read"})
                await tools["crawl_web_markdown"].ainvoke({"urls": ["https://docs.tavily.com/"]})
                assert "Evidence" in result
                return {
                    "structured_response": AgentReply(
                        answer="Answer with evidence",
                        research=ResearchResult(
                            title="Topic",
                            summary="Evidence",
                            sources=[
                                Source(title="Docs", url="https://docs.tavily.com/"),
                                Source(title="Fake", url="https://example.com/"),
                            ],
                        ),
                    )
                }

        return Graph()

    monkeypatch.setattr(module, "search_external_knowledge", search)
    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", Model)
    monkeypatch.setattr(module, "create_deep_agent", build_agent)
    monkeypatch.setattr(AgentService, "_route", research_route)
    settings = Settings(
        _env_file=None,
        GOOGLE_API_KEY="test",
        tavily_api_key="test",
        agent_reply_cache_ttl_seconds=0,
    )
    result = asyncio.run(
        AgentService(settings).reply([{"role": "user", "content": "Search"}], False)
    )
    assert [str(s.url) for s in result.research.sources] == ["https://docs.tavily.com/"]


def test_clarification_route_uses_full_session_and_streams_questions(monkeypatch):
    from src.core import agent as module

    streamed = []

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def system_one(self, *, state, questions):
            assert "latency" in state
            assert "prior-session-detail" in state
            assert '"session_history"' in state
            assert "route" in questions
            assert set(questions["route"].criteria) == {"clarify", "research"}
            return SimpleNamespace(
                answers={
                    "route": SimpleNamespace(choice="clarify", confidence=0.93)
                }
            )

    class Model:
        def __init__(self, **kwargs):
            assert kwargs["model"] == "gemini-3.8-flash"

        async def astream(self, prompt):
            assert "prior-session-detail" in prompt
            assert "ask only one to three focused questions" in prompt
            yield SimpleNamespace(content="Mình hiểu rồi. ")
            yield SimpleNamespace(content="Bạn muốn đạt kết quả gì?")

    def unexpected_research(*args, **kwargs):
        raise AssertionError("discovery requests must skip the research agent")

    async def token_callback(token):
        streamed.append(token)

    def fake_typesafe_client(**kwargs):
        assert kwargs["model"] == "jev-latest"
        return Client()

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", Model)
    monkeypatch.setattr(module, "AsyncTypeSafeClient", fake_typesafe_client)
    monkeypatch.setattr(AgentService, "_run_reply", unexpected_research)
    service = AgentService(
        Settings(
            _env_file=None,
            GOOGLE_API_KEY="test-key",
            TYPESAFE_API_KEY="typesafe-test-key",
            agent_reply_cache_ttl_seconds=0,
        )
    )
    latest = {"role": "user", "content": "Tôi đang gặp vấn đề latency khi dùng LLM"}
    full_session = [
        {"role": "user", "content": "prior-session-detail"},
        {"role": "assistant", "content": "I will keep that in mind."},
        latest,
    ]
    result = asyncio.run(
        service.reply(
            [latest],
            False,
            answer_token_callback=token_callback,
            session_history=full_session,
        )
    )
    assert result.research is None
    assert "Bạn muốn đạt kết quả gì" in result.answer
    assert "".join(streamed) == result.answer


def test_jev_low_confidence_routes_to_clarification(monkeypatch):
    from src.core import agent as module

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def system_one(self, **kwargs):
            return SimpleNamespace(
                answers={"route": SimpleNamespace(choice="research", confidence=0.42)}
            )

    monkeypatch.setattr(module, "AsyncTypeSafeClient", lambda **kwargs: Client())
    service = AgentService(
        Settings(_env_file=None, TYPESAFE_API_KEY="typesafe-test-key")
    )
    result = asyncio.run(
        service._route([{"role": "user", "content": "Maybe latency is an issue"}])
    )
    assert result.route == "clarify"


def test_router_requires_jev_and_does_not_use_gemini_for_decision(monkeypatch):
    from src.core import agent as module

    def unexpected_gemini(**kwargs):
        raise AssertionError("Gemini must not decide the route")

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", unexpected_gemini)
    service = AgentService(Settings(_env_file=None, GOOGLE_API_KEY="gemini-key"))
    with pytest.raises(module.AgentUnavailableError, match="TYPESAFE_API_KEY"):
        asyncio.run(service._route([{"role": "user", "content": "Hello"}]))


def test_jev_router_failure_is_not_replaced_by_gemini(monkeypatch):
    from src.core import agent as module

    class FailedClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def system_one(self, **kwargs):
            raise module.TypeSafeError("JEV unavailable")

    def unexpected_gemini(**kwargs):
        raise AssertionError("Gemini must not decide the route")

    monkeypatch.setattr(module, "AsyncTypeSafeClient", lambda **kwargs: FailedClient())
    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", unexpected_gemini)
    service = AgentService(Settings(_env_file=None, TYPESAFE_API_KEY="typesafe-test-key"))
    with pytest.raises(module.AgentUnavailableError, match="JEV router is unavailable"):
        asyncio.run(service._route([{"role": "user", "content": "Hello"}]))


def test_reasoning_map_sources_and_status_are_validated():
    from src.core.agent import AgentService, validate_reasoning_sources
    from src.modules.research.schemas import ReasoningCard, ReasoningMap

    def card():
        return ReasoningCard(
            title="Real topic",
            summary="User observation",
            explanation="Proposed reasoning",
            status="source-supported",
            sources=[Source(title="Invented", url="https://fake.test/")],
        )

    result = AgentReply(
        answer="Answer",
        research=ResearchResult(
            title="Topic",
            summary="Summary",
            reasoning_map=ReasoningMap(
                problem=card(),
                evidence=card(),
                research_question=card(),
                hypothesis=card(),
                experiment=card(),
            ),
        ),
    )
    result = validate_reasoning_sources(result, {})
    reasoning = result.research.reasoning_map
    assert reasoning.evidence.status == "insufficient-evidence"
    assert reasoning.problem.status == "insufficient-evidence"
    assert reasoning.hypothesis.status == "hypothesis"
    assert reasoning.experiment.status == "AI-inferred"
    assert reasoning.research_question.status == "AI-inferred"
    assert all(not card.sources for card in vars(reasoning).values())

    AgentService._apply_reasoning_ui(result, requested=True, skill_loaded=True)
    diagram = result.research.ui
    assert diagram.type == "reasoning-map-diagram"
    assert diagram.trigger == "user-request"
    assert [node.id for node in diagram.nodes] == [
        "problem",
        "evidence",
        "research_question",
        "hypothesis",
        "experiment",
    ]
    assert len(diagram.edges) == 4
    assert diagram.nodes[1].status == "insufficient-evidence"
    assert diagram.nodes[1].source_count == 0

    AgentService._apply_reasoning_ui(result, requested=False, skill_loaded=True)
    assert result.research.ui is None


def test_diagram_skill_intent_requires_explicit_affirmative_request():
    from src.core.research_skills import is_diagram_request
    from src.core.research_workflow import ResearchWorkflow

    assert is_diagram_request("Hãy vẽ sơ đồ reasoning map giúp tôi")
    assert is_diagram_request("Can you show me a flowchart?")
    assert is_diagram_request("I want a diagram")
    assert not is_diagram_request("Tóm tắt kết quả nghiên cứu")
    assert not is_diagram_request("What is a diagram?")
    assert not is_diagram_request("Please don't show a diagram")

    workflow = ResearchWorkflow(
        crawler=object(), observed={}, history=[{"role": "user", "content": "Research AI"}]
    )
    tools = {tool.name: tool for tool in workflow.tools()}
    result = json.loads(
        asyncio.run(
            tools["load_skill"].ainvoke(
                {"skill": "visualize-reasoning-map", "task": "Draw a research map"}
            )
        )
    )
    assert result["status"] == "error"
    assert "visualize-reasoning-map" not in workflow.loaded

    workflow.history.append({"role": "user", "content": "Show me a reasoning map diagram"})
    result = json.loads(
        asyncio.run(
            tools["load_skill"].ainvoke(
                {"skill": "visualize-reasoning-map", "task": "Draw a research map"}
            )
        )
    )
    assert result["status"] == "success"
    assert "visualize-reasoning-map" in workflow.loaded
