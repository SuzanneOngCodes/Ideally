import asyncio
import json
import logging

from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage

from src.core import agent as module
from src.core.config import Settings


class ScriptedModel(FakeMessagesListChatModel):
    def bind_tools(self, tools, **kwargs):
        return self


def call(name, args, index):
    return AIMessage(content="", tool_calls=[{"name": name, "args": args, "id": str(index)}])


def test_chat_loads_skills_searches_and_crawls_after_workflow_correction(monkeypatch, caplog):
    url = "https://example.com/study"
    result = {
        "answer": "Provisional findings",
        "research": {
            "title": "Study",
            "summary": "Scoped result",
            "sources": [{"title": "Study", "url": url}],
        },
    }
    model = ScriptedModel(
        responses=[
            call("AgentReply", result, 0),  # Deliberately skip steps: application must correct.
            call("load_skill", {"skill": "verify-problem", "task": "Verify latency"}, 1),
            call("web_search", {"query": "latency measurements and contrary findings"}, 2),
            call("load_skill", {"skill": "read-research-source", "task": "Read source methods"}, 3),
            call("crawl_web_markdown", {"urls": [url]}, 4),
            call("AgentReply", result, 5),
        ]
    )
    crawled = []

    async def search(settings, query):
        return {"results": [{"title": "Study", "url": url, "content": "Snippet"}]}

    async def crawl(self, urls, **kwargs):
        crawled.extend(urls)
        return {
            "results": [
                {
                    "success": True,
                    "source_url": url,
                    "title": "Study",
                    "markdown": "Actual source methods and limitations",
                }
            ]
        }

    monkeypatch.setattr(module, "ChatGoogleGenerativeAI", lambda **kwargs: model)
    monkeypatch.setattr(module, "search_external_knowledge", search)
    monkeypatch.setattr(module.CrawlService, "crawl", crawl)
    caplog.set_level(logging.INFO)
    service = module.AgentService(
        Settings(_env_file=None, GOOGLE_API_KEY="test", tavily_api_key="test")
    )
    reply = asyncio.run(service.reply([{"role": "user", "content": "Investigate latency"}], False))
    assert reply.research.sources[0].excerpt == "Actual source methods and limitations"
    assert crawled == [url]
    events = [json.loads(r.message) for r in caplog.records if r.name == "ideally.events"]
    assert any(e["event"] == "agent.workflow.incomplete" for e in events)
    assert [e["skill"] for e in events if e["event"] == "skill.loaded"] == [
        "verify-problem",
        "read-research-source",
    ]
    assert [e["tool"] for e in events if e["event"] == "tool.start"] == [
        "load_skill",
        "web_search",
        "load_skill",
        "crawl_web_markdown",
    ]


def test_crawl_requires_skill_and_observed_url():
    from src.core.crawl import CrawlService
    from src.core.research_workflow import ResearchWorkflow

    async def run():
        workflow = ResearchWorkflow(CrawlService(Settings(_env_file=None)), {}, [])
        tools = {t.name: t for t in workflow.tools()}
        args = {"urls": ["https://unobserved.example/"]}
        before_skill = json.loads(await tools["crawl_web_markdown"].ainvoke(args))
        assert before_skill["status"] == "error"
        await tools["load_skill"].ainvoke({"skill": "read-research-source", "task": "Read"})
        before_search = json.loads(await tools["crawl_web_markdown"].ainvoke(args))
        assert before_search["status"] == "error"
        assert workflow.crawl_attempts == 0

    asyncio.run(run())
