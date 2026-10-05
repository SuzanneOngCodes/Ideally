import asyncio

from src.core.agent import AgentService
from src.core.config import Settings
from src.modules.research.schemas import AgentReply, ResearchResult, Source


def test_agent_uses_grounded_search_and_filters_unobserved_sources(monkeypatch):
    from langchain_core.messages import AIMessage

    from src.core import agent as module

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
                await kwargs["tools"][0].ainvoke({"query": "Research AI"})
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
    service = AgentService(Settings(_env_file=None, GOOGLE_API_KEY="test-key"))
    result = asyncio.run(service.reply([{"role": "user", "content": "Research AI"}], True))
    assert [str(s.url) for s in result.research.sources] == ["https://docs.langchain.com/"]


def test_chat_uses_llm_fallback_and_preserves_history(monkeypatch):
    from types import SimpleNamespace

    from src.core import agent as module

    calls = []
    history = [{"role": "user", "content": "Xin chào"}]

    class Model:
        def __init__(self, **kwargs):
            self.name = kwargs["model"]

        async def ainvoke(self, messages):
            calls.append(self.name)
            assert messages[1:] == history
            if self.name == "primary":
                error = RuntimeError("unavailable")
                error.__cause__ = SimpleProviderError()
                raise error
            return SimpleNamespace(text="Xin chào!")

    class SimpleProviderError(Exception):
        code = 404

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", Model)
    service = AgentService(
        Settings(
            _env_file=None,
            GOOGLE_API_KEY="test-key",
            gemini_model="primary",
            gemini_fallback_model="fallback",
        )
    )
    result = asyncio.run(service.reply(history, False))
    assert result.answer == "Xin chào!"
    assert result.research is None
    assert calls == ["primary", "fallback"]


def test_chat_can_call_tavily_tool(monkeypatch):
    from src.core import agent as module

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
                result = await kwargs["tools"][0].ainvoke({"query": "External knowledge"})
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
    settings = Settings(_env_file=None, GOOGLE_API_KEY="test", tavily_api_key="test")
    result = asyncio.run(
        AgentService(settings).reply([{"role": "user", "content": "Search"}], False)
    )
    assert [str(s.url) for s in result.research.sources] == ["https://docs.tavily.com/"]
