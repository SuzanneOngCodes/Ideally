from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from src.core.config import Settings
from src.core.errors import AgentUnavailableError
from src.main import create_app
from src.modules.research.schemas import AgentReply, Finding, ResearchResult, Source
from src.modules.session.models import ChatSession


class FakeAgent:
    settings = SimpleNamespace(max_history_messages=40)

    def __init__(self):
        self.history = []
        self.error = None

    async def reply(self, history, research):
        self.history = history
        if self.error:
            raise self.error
        return AgentReply(
            answer="Câu trả lời",
            research=ResearchResult(
                title="Research",
                summary="Tổng quan",
                findings=[Finding(title="Phát hiện", description="Chi tiết")],
                sources=[Source(title="LangChain", url="https://docs.langchain.com/")],
            )
            if research
            else None,
        )


@pytest.fixture
def client(tmp_path):
    settings = Settings(_env_file=None, database_url=f"sqlite:///{tmp_path / 'test.db'}")
    app = create_app(settings)
    app.state.agent = FakeAgent()
    with TestClient(app) as client:
        yield client


def new_session(client):
    response = client.post("/api/v1/sessions", json={})
    assert response.status_code == 201
    return response.json()["id"]


def test_session_lifecycle_and_research(client):
    session_id = new_session(client)
    base = f"/api/v1/sessions/{session_id}"
    assert client.get(f"/api/v1/research/{session_id}").json() is None
    response = client.post(base + "/messages", json={"content": "Nghiên cứu AI", "research": True})
    assert response.status_code == 200
    assert response.json()["research"]["sources"][0]["url"] == "https://docs.langchain.com/"
    detail = client.get(base).json()
    assert detail["title"] == "Nghiên cứu AI"
    assert [m["role"] for m in detail["messages"]] == ["user", "assistant"]
    assert client.get("/api/v1/sessions?limit=1").json()[0]["id"] == session_id
    assert client.get(f"/api/v1/research/{session_id}").json()["title"] == "Research"
    client.post(base + "/messages", json={"content": "Giải thích thêm"})
    assert len(client.app.state.agent.history) == 3
    assert client.get(base).json()["research"]["title"] == "Research"
    assert client.delete(base).status_code == 204
    assert client.get(base).status_code == 404
    assert client.get(f"/api/v1/research/{session_id}").status_code == 404


@pytest.mark.parametrize(
    "error,status",
    [
        (AgentUnavailableError("Missing key"), 503),
        (TimeoutError(), 504),
        (RuntimeError("secret"), 502),
    ],
)
def test_failed_request_does_not_save_partial_messages(client, error, status):
    session_id = new_session(client)
    client.app.state.agent.error = error
    response = client.post(f"/api/v1/sessions/{session_id}/messages", json={"content": "Hello"})
    assert response.status_code == status
    assert "secret" not in response.text
    assert client.get(f"/api/v1/sessions/{session_id}").json()["messages"] == []


def test_validation_and_missing_session(client):
    session_id = new_session(client)
    for content in ["", "   ", "a" * 20001]:
        assert (
            client.post(
                f"/api/v1/sessions/{session_id}/messages", json={"content": content}
            ).status_code
            == 422
        )
    assert client.get("/api/v1/sessions/not-a-uuid").status_code == 422
    assert client.get("/api/v1/sessions?limit=101").status_code == 422
    assert (
        client.post(
            "/api/v1/sessions/00000000-0000-0000-0000-000000000000/messages", json={"content": "Hi"}
        ).status_code
        == 404
    )


def test_conflicting_update_returns_409(client):
    session_id = new_session(client)
    original = client.app.state.agent.reply

    async def concurrent_reply(history, research):
        with client.app.state.db_factory() as db:
            session = db.get(ChatSession, session_id)
            session.version += 1
            db.commit()
        return await original(history, research)

    client.app.state.agent.reply = concurrent_reply
    response = client.post(f"/api/v1/sessions/{session_id}/messages", json={"content": "Hello"})
    assert response.status_code == 409
    assert client.get(f"/api/v1/sessions/{session_id}").json()["messages"] == []


def test_history_survives_app_restart(tmp_path):
    settings = Settings(_env_file=None, database_url=f"sqlite:///{tmp_path / 'persist.db'}")
    app = create_app(settings)
    app.state.agent = FakeAgent()
    with TestClient(app) as client:
        session_id = new_session(client)
        client.post(f"/api/v1/sessions/{session_id}/messages", json={"content": "Hi"})
    with TestClient(create_app(settings)) as client:
        assert len(client.get(f"/api/v1/sessions/{session_id}").json()["messages"]) == 2


def test_missing_api_key(client):
    from src.core.agent import AgentService

    client.app.state.agent = AgentService(Settings(_env_file=None, GOOGLE_API_KEY=""))
    session_id = new_session(client)
    assert (
        client.post(f"/api/v1/sessions/{session_id}/messages", json={"content": "Hi"}).status_code
        == 503
    )


def test_health_docs_and_cors(client):
    assert client.get("/health").json()["status"] == "ok"
    assert "/api/v1/sessions/{session_id}/messages" in client.get("/openapi.json").json()["paths"]
    response = client.options(
        "/api/v1/sessions",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_chat_creates_session_and_continues_history(client):
    response = client.post("/api/v1/chat", json={"message": "  Xin chào  "})
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Câu trả lời"
    assert data["research"] is None
    session_id = data["session_id"]
    assert client.app.state.agent.history == [{"role": "user", "content": "Xin chào"}]
    response = client.post(
        "/api/v1/chat",
        json={
            "message": "Research AI",
            "session_id": session_id,
            "research": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["session_id"] == session_id
    assert response.json()["research"]["title"] == "Research"
    assert len(client.app.state.agent.history) == 3
    detail = client.get(f"/api/v1/sessions/{session_id}").json()
    assert len(detail["messages"]) == 4
    assert detail["title"] == "Xin chào"


def test_chat_invalid_request_and_unknown_session(client):
    for payload in [
        {},
        {"message": "   "},
        {"message": "x" * 20001},
        {"message": "Hi", "session_id": "invalid"},
    ]:
        assert client.post("/api/v1/chat", json=payload).status_code == 422
    assert client.get("/api/v1/sessions").json() == []
    assert (
        client.post(
            "/api/v1/chat",
            json={
                "message": "Hi",
                "session_id": "00000000-0000-0000-0000-000000000000",
            },
        ).status_code
        == 404
    )


@pytest.mark.parametrize(
    "error,status",
    [
        (AgentUnavailableError("Missing key"), 503),
        (TimeoutError(), 504),
        (RuntimeError(), 502),
    ],
)
def test_chat_provider_failure_leaves_no_empty_session(client, error, status):
    client.app.state.agent.error = error
    assert client.post("/api/v1/chat", json={"message": "Hi"}).status_code == status
    assert client.get("/api/v1/sessions").json() == []


@pytest.mark.parametrize("code, phrase", [(429, "quota"), (503, "temporarily unavailable")])
def test_provider_failure_is_classified_and_does_not_save_messages(client, code, phrase):
    class ProviderFailure(Exception):
        pass

    error = ProviderFailure("private provider response")
    error.code = code
    client.app.state.agent.error = error
    response = client.post("/api/v1/chat", json={"message": "Hello"})
    assert response.status_code == 503
    assert phrase in response.json()["detail"]
    assert response.headers["retry-after"] == "10"
    assert "private provider response" not in response.text
    assert client.get("/api/v1/sessions").json() == []


def test_reasoning_map_is_saved_and_survives_followup(client):
    from src.modules.research.schemas import ReasoningCard, ReasoningMap

    reasoning = ReasoningMap(
        **{
            name: ReasoningCard(
                title=name,
                summary="Actual user topic",
                explanation="Generated from conversation",
            )
            for name in ("problem", "evidence", "research_question", "hypothesis", "experiment")
        }
    )

    async def reply(history, research):
        return AgentReply(
            answer="Research answer",
            research=ResearchResult(
                title="Real topic",
                summary="Summary",
                reasoning_map=reasoning,
            ),
        )

    client.app.state.agent.reply = reply
    response = client.post("/api/v1/chat", json={"message": "My actual research topic"})
    assert response.status_code == 200
    data = response.json()
    session_id = data["session_id"]
    saved = client.get(f"/api/v1/sessions/{session_id}").json()
    assert saved["research"]["reasoning_map"] == reasoning.model_dump(mode="json")

    async def followup(history, research):
        return AgentReply(answer="Simple followup")

    client.app.state.agent.reply = followup
    response = client.post("/api/v1/chat", json={"message": "Thanks", "session_id": session_id})
    assert response.json()["research"]["reasoning_map"] == data["research"]["reasoning_map"]
