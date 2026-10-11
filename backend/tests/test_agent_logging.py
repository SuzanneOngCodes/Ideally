import asyncio
import json
import logging
from uuid import uuid4

from deepagents import create_deep_agent
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.tools import tool

from src.core.agent_logging import AgentLogHandler
from src.core.logger import configure_logging, log_context, log_event
from src.core.research_skills import active_skill, skill_files


def events(caplog):
    return [json.loads(r.message) for r in caplog.records if r.name == "ideally.events"]


def test_graph_logs_actual_tool_params_and_model_events(caplog):
    class ScriptedModel(FakeMessagesListChatModel):
        def bind_tools(self, tools, **kwargs):
            return self

    @tool
    async def search(query: str, limit: int = 3) -> str:
        """Search test evidence."""
        return json.dumps({"status": "success", "results": []})

    model = ScriptedModel(
        responses=[
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "search",
                        "args": {"query": "latency evidence", "limit": 2},
                        "id": "call1",
                    }
                ],
            ),
            AIMessage(content="Done"),
        ]
    )
    caplog.set_level(logging.INFO)
    graph = create_deep_agent(model=model, tools=[search])
    token = log_context.set({"request_id": "request-test"})
    try:
        asyncio.run(
            graph.ainvoke(
                {"messages": [{"role": "user", "content": "Search"}]},
                config={"callbacks": [AgentLogHandler()]},
            )
        )
    finally:
        log_context.reset(token)
    rows = events(caplog)
    start = next(e for e in rows if e["event"] == "tool.start" and e["tool"] == "search")
    end = next(e for e in rows if e["event"] == "tool.end" and e["run_id"] == start["run_id"])
    assert start["params"] == {"query": "latency evidence", "limit": 2}
    assert end["status"] == "success"
    assert end["duration_ms"] >= 0
    assert all(e["request_id"] == "request-test" for e in rows)
    assert {"model.start", "model.end", "tool.requested"} <= {e["event"] for e in rows}


def test_tool_error_has_location_without_exception_body(caplog):
    @tool
    async def broken(query: str) -> str:
        """Fails deliberately."""
        raise NameError("provider-private-body")

    caplog.set_level(logging.INFO)

    async def run():
        try:
            await broken.ainvoke({"query": "example"}, config={"callbacks": [AgentLogHandler()]})
        except NameError:
            pass

    asyncio.run(run())
    error = next(e for e in events(caplog) if e["event"] == "tool.error")
    assert error["error_type"] == "NameError"
    assert error["frames"][-1]["function"] == "broken"
    assert "provider-private-body" not in caplog.text


def test_redaction_and_bounding(caplog):
    configure_logging("INFO", secrets=("test-secret-123456",))
    caplog.set_level(logging.INFO)
    log_event(
        "tool.start",
        params={
            "api_key": "hide-me",
            "query": "test-secret-123456",
            "nested": {"Authorization": "Bearer abc"},
            "url": "https://example.com/?token=hide-me&q=hello",
            "long": "a" * 6000,
        },
    )
    params = events(caplog)[-1]["params"]
    assert params["api_key"] == params["query"] == "[REDACTED]"
    assert "hide-me" not in caplog.text
    assert "test-secret-123456" not in caplog.text
    assert params["long"].endswith("[truncated]")


def test_skill_catalog_is_distinct_from_load(caplog):
    caplog.set_level(logging.INFO)
    skill_files()
    assert [e["event"] for e in events(caplog)] == ["skill.catalog.ready"]
    active_skill("clarify")
    assert events(caplog)[-1]["event"] == "skill.loaded"
    assert events(caplog)[-1]["skill"] == "clarify-research-context"


def test_failed_read_does_not_claim_skill_loaded(caplog):
    caplog.set_level(logging.INFO)

    async def run():
        handler = AgentLogHandler()
        run_id = uuid4()
        await handler.on_tool_start(
            {"name": "read_file"},
            "",
            run_id=run_id,
            inputs={"file_path": "/skills/missing/SKILL.md"},
        )
        await handler.on_tool_end(
            ToolMessage(content="Error: file not found", tool_call_id="1"), run_id=run_id
        )

    asyncio.run(run())
    assert events(caplog)[-1]["event"] == "skill.load.error"
    assert not any(e["event"] == "skill.loaded" for e in events(caplog))


def test_concurrent_context_isolation(caplog):
    caplog.set_level(logging.INFO)

    async def request(name):
        token = log_context.set({"request_id": name})
        try:
            await asyncio.sleep(0)
            log_event("tool.start", tool=name)
        finally:
            log_context.reset(token)

    async def run():
        await asyncio.gather(request("one"), request("two"))

    asyncio.run(run())
    assert all(e["request_id"] == e["tool"] for e in events(caplog))
    assert log_context.get() == {}


def test_http_request_id_matches_response_header(caplog, tmp_path):
    from fastapi.testclient import TestClient

    from src.core.config import Settings
    from src.main import create_app

    caplog.set_level(logging.INFO)
    settings = Settings(_env_file=None, database_url=f"sqlite:///{tmp_path}/logs.db")
    with TestClient(create_app(settings)) as client:
        first = client.get("/health")
        second = client.get("/missing")
    first_id = first.headers["X-Request-ID"]
    assert first_id != second.headers["X-Request-ID"]
    rows = [e for e in events(caplog) if e.get("request_id") == first_id]
    assert [e["event"] for e in rows] == ["request.start", "request.end"]
    assert rows[-1]["status_code"] == 200
    assert log_context.get() == {}


def test_token_counts_are_not_redacted(caplog):
    caplog.set_level(logging.INFO)
    log_event("model.end", usage={"input_tokens": 10, "output_tokens": 5, "total_tokens": 15})
    assert events(caplog)[-1]["usage"]["total_tokens"] == 15
