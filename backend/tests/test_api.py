import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from src.core.config import Settings
from src.core.errors import AgentUnavailableError
from src.main import create_app
from src.modules.defense.schemas import DefenseEvaluation, DefenseProbe, DefenseProbesResponse
from src.modules.research.schemas import (
    AgentReply,
    ExperimentDesign,
    Finding,
    ProposalBrief,
    ReasoningMap,
    ResearchResult,
    Source,
    build_reasoning_map_ui,
)
from src.modules.session.models import ChatMessage, ChatSession


class FakeAgent:
    settings = SimpleNamespace(max_history_messages=40)

    def __init__(self):
        self.history = []
        self.error = None
        self.experiment_calls = 0
        self.session_history = []
        self.brief_context = None
        self.brief_calls = 0

    async def create_proposal_brief(self, messages, research):
        self.brief_context = (messages, research)
        self.brief_calls += 1
        brief = ProposalBrief.model_validate(
            {
                "id": "brief-test",
                "createdAt": "2026-10-17T00:00:00Z",
                "title": "System design proposal",
                "intake": {
                    "mode": "blank_canvas",
                    "domain": "Software systems",
                    "problemOrObservation": "Latency",
                    "earlyHypothesis": "",
                    "targetContext": "capstone",
                    "constraints": {
                        "timeHorizonWeeks": 12,
                        "computeTier": "laptop",
                        "datasetAccess": "public_only",
                        "humanSubjects": False,
                        "budgetNotes": "",
                    },
                },
                "problemValidation": {
                    "coreProblemStatement": "Latency varies by architecture",
                    "realWorldImpact": "User impact",
                    "stakeholdersAffected": ["Users"],
                    "failureModesOfStatusQuo": ["Slow requests"],
                    "evidencePoints": [],
                    "urgencyVerdict": "Study under stated workload",
                },
                "knowledgeLandscape": {
                    "establishedConsensus": [],
                    "existingApproaches": [],
                    "criticalKnowledgeGap": "Gap",
                    "whyUnsolvedUntilNow": "Context varies",
                },
                "candidateDirections": [
                    {
                        "id": "direction-1",
                        "title": "Measure architecture tradeoffs",
                        "directionType": "empirical_diagnostic",
                        "summary": "Compare",
                        "whyPursue": "Directly tests the issue",
                        "tradeoffs": {
                            "noveltyScore": 5,
                            "feasibilityScore": 8,
                            "impactScore": 6,
                            "riskLevel": "Moderate",
                        },
                        "requiredResources": ["Benchmark harness"],
                        "potentialPitfalls": "Workload representativeness",
                        "suitabilityForContext": "Capstone",
                        "isRecommended": True,
                    }
                ],
                "selectedDirectionId": "direction-1",
                "selectionRationale": "Fits the observed issue",
                "experimentDesign": {
                    "primaryResearchQuestion": "How does architecture affect latency?",
                    "falsifiableHypothesis": "Measured latency differs",
                    "independentVariables": ["Architecture"],
                    "dependentVariablesAndMetrics": [
                        {
                            "metric": "p95 latency",
                            "targetBenchmark": "To be determined",
                            "evaluationMethod": "Repeated benchmark",
                        }
                    ],
                    "baselinesAndControls": [
                        {
                            "name": "Current design",
                            "type": "naive_baseline",
                            "rationale": "Baseline",
                        }
                    ],
                    "datasetAndApparatus": {
                        "primaryDatasetOrSetup": "To be determined",
                        "sourceAndLicensing": "To be determined",
                        "sampleScale": "To be determined",
                        "fallbackIfUnavailable": "Synthetic workload",
                    },
                    "milestoneTimeline": [
                        {
                            "phase": "Pilot",
                            "durationWeeks": 2,
                            "objective": "Validate harness",
                            "stopGoCriteria": "Stable measurements",
                        }
                    ],
                    "validityThreats": [
                        {
                            "threatType": "internal",
                            "description": "Noisy host",
                            "mitigationStrategy": "Repeat runs",
                        }
                    ],
                    "negativeResultValue": "Identifies when design has no effect",
                    "successDefinition": "Reproducible difference",
                },
                "advisorCritiques": [],
                "feasibilityAssessment": {
                    "runwayWeeks": 12,
                    "budgetVerdict": "No external spend",
                    "keyPrerequisite": "Access to representative workloads",
                },
                "bibtexSnippet": "",
                "researchMapCards": [],
                "researchDiagram": {
                    "type": "reasoning-map-diagram",
                    "version": 1,
                    "title": "Map",
                    "nodes": [],
                    "edges": [],
                },
            }
        )
        reasoning_map = ReasoningMap.model_validate(research["reasoning_map"])
        brief.researchDiagram = build_reasoning_map_ui(reasoning_map)
        brief.researchMapCards = [
            {
                "id": stage,
                "title": getattr(reasoning_map, stage).title,
                "stageLabel": stage,
                "status": getattr(reasoning_map, stage).status,
                "summary": getattr(reasoning_map, stage).summary,
                "accessibleExplanation": getattr(reasoning_map, stage).explanation,
                "deepScholarlyExplanation": getattr(reasoning_map, stage).methodology,
                "limitations": getattr(reasoning_map, stage).limitations,
                "unresolvedQuestions": getattr(reasoning_map, stage).unresolved_questions,
                "sources": [],
            }
            for stage in ("problem", "evidence", "research_question", "hypothesis", "experiment")
        ]
        return brief

    async def design_experiment(self, reasoning_map, request):
        self.experiment_calls += 1
        return ExperimentDesign(
            primaryResearchQuestion=reasoning_map["experiment"]["summary"],
            falsifiableHypothesis="A measurable hypothesis",
            independentVariables=["method"],
            dependentVariablesAndMetrics=[
                {
                    "metric": "latency",
                    "targetBenchmark": "To be determined",
                    "evaluationMethod": "Repeated timed trials",
                }
            ],
            baselinesAndControls=[
                {
                    "name": "current method",
                    "type": "naive_baseline",
                    "rationale": "comparison",
                }
            ],
            datasetAndApparatus={
                "primaryDatasetOrSetup": "To be determined",
                "sourceAndLicensing": "To be determined",
                "sampleScale": "To be determined",
                "fallbackIfUnavailable": "Use an accessible dataset",
            },
            milestoneTimeline=[
                {
                    "phase": "Pilot",
                    "durationWeeks": 1,
                    "objective": "Measure",
                    "stopGoCriteria": "Feasible data access",
                }
            ],
            validityThreats=[
                {
                    "threatType": "internal",
                    "description": "Confounding hardware",
                    "mitigationStrategy": "Same machine",
                }
            ],
            negativeResultValue="Defines a boundary condition",
            successDefinition="Pre-registered threshold",
        )

    async def reply(
        self,
        history,
        research,
        progress_callback=None,
        answer_token_callback=None,
        session_history=None,
    ):
        self.history = history
        self.session_history = session_history or history
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


class FakeDefenseLab:
    def __init__(self):
        self.generate_calls = 0

    async def generate_probes(self, brief, saved_research=None):
        self.generate_calls += 1
        return DefenseProbesResponse(
            probes=[
                DefenseProbe(
                    id=f"probe-{index}",
                    persona=f"Persona {index}",
                    probingTopic="Validity",
                    question=f"How will you control confounding factor {index}?",
                    exampleAnswers=["Pre-register the control."],
                )
                for index in range(1, 4)
            ]
        )

    async def evaluate_defense(self, brief, probe, answer, saved_research=None):
        return DefenseEvaluation(
            strengthScore=8,
            strengths=["Addresses the proposed control"],
            vulnerabilities=["Needs a sensitivity analysis"],
            advisorTip="Add a pre-registered sensitivity analysis.",
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


def test_experiment_requires_live_map_and_persists_with_cache(client):
    session_id = new_session(client)
    url = f"/api/v1/research/{session_id}/experiment"
    payload = {"direction_id": "chosen", "direction_title": "Chosen direction"}
    assert client.post(url, json=payload).status_code == 409
    card = {
        "title": "Research question",
        "summary": "Can the chosen method reduce latency?",
        "explanation": "Proposed study",
        "methodology": "Compare methods",
        "status": "AI-inferred",
        "limitations": [],
        "unresolved_questions": [],
        "sources": [],
    }
    reasoning_map = {
        name: dict(card)
        for name in ("problem", "evidence", "research_question", "hypothesis", "experiment")
    }
    with client.app.state.db_factory() as db:
        session = db.get(ChatSession, session_id)
        session.research = {
            "title": "Live research",
            "summary": "Saved session",
            "reasoning_map": reasoning_map,
        }
        db.commit()

    response = client.post(url, json=payload)
    assert response.status_code == 200
    assert response.json()["primaryResearchQuestion"] == "Can the chosen method reduce latency?"
    assert client.app.state.agent.experiment_calls == 1
    assert client.post(url, json=payload).status_code == 200
    assert client.app.state.agent.experiment_calls == 1
    saved_research = client.get(f"/api/v1/research/{session_id}").json()
    assert saved_research["experiment_design"] == response.json()
    assert saved_research["experiment_direction_id"] == "chosen"
    follow_up = client.post(
        f"/api/v1/sessions/{session_id}/messages",
        json={"content": "Explain the controls", "research": True},
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["research"]["experiment_design"] == response.json()
    assert client.post(url, json={**payload, "regenerate": True}).status_code == 200
    assert client.app.state.agent.experiment_calls == 2

    with client.app.state.db_factory() as db:
        session = db.get(ChatSession, session_id)
        changed = dict(session.research)
        revised_map = {name: dict(value) for name, value in reasoning_map.items()}
        revised_map["experiment"]["summary"] = "A revised question"
        changed["reasoning_map"] = revised_map
        session.research = changed
        db.commit()
    assert client.post(url, json=payload).json()["primaryResearchQuestion"] == "A revised question"
    assert client.app.state.agent.experiment_calls == 3


def test_proposal_brief_uses_complete_session_and_reasoning_map_then_caches(client):
    session_id = new_session(client)
    session_url = f"/api/v1/sessions/{session_id}"
    client.post(
        session_url + "/messages", json={"content": "We are studying system design tradeoffs."}
    )
    client.post(
        session_url + "/messages",
        json={"content": "The measured bottleneck is PostgreSQL query latency."},
    )
    url = f"/api/v1/research/{session_id}/brief"
    assert client.post(url, json={}).status_code == 409

    card = {
        "title": "Database bottleneck",
        "summary": "Observed query delay impacts response time.",
        "explanation": "The user reported slow PostgreSQL queries.",
        "methodology": "Measure p95 latency.",
        "status": "AI-inferred",
        "limitations": ["No workload trace yet"],
        "unresolved_questions": ["Which query mix is representative?"],
        "sources": [],
    }
    reasoning_map = {
        name: dict(card)
        for name in ("problem", "evidence", "research_question", "hypothesis", "experiment")
    }
    with client.app.state.db_factory() as db:
        session = db.get(ChatSession, session_id)
        session.research = {
            "title": "System design",
            "summary": "Research on software architecture performance tradeoffs.",
            "reasoning_map": reasoning_map,
        }
        db.commit()

    response = client.post(url, json={})
    assert response.status_code == 200, response.text
    assert response.json()["researchDiagram"]["nodes"][0]["title"] == "Database bottleneck"
    assert response.json()["researchMapCards"][0]["limitations"] == ["No workload trace yet"]
    mindmap_nodes = response.json()["researchDiagram"]["mindmap_nodes"]
    assert mindmap_nodes[0]["parent_id"] is None
    assert len(mindmap_nodes[0]["label"].split()) <= 5
    assert max(len(node["label"].split()) for node in mindmap_nodes) <= 8
    assert max(node["level"] for node in mindmap_nodes) <= 2
    assert {node["side"] for node in mindmap_nodes if node["level"] == 1} == {"left", "right"}
    assert all(node["children"] for node in mindmap_nodes if node["level"] == 1)
    messages, supplied_research = client.app.state.agent.brief_context
    assert [message["content"] for message in messages if message["role"] == "user"] == [
        "We are studying system design tradeoffs.",
        "The measured bottleneck is PostgreSQL query latency.",
    ]
    assert supplied_research["reasoning_map"] == reasoning_map
    stream = client.post(
        f"{url}/stream",
        json={"threadId": session_id, "runId": "run-test", "messages": [], "state": {}},
    )
    assert stream.status_code == 200
    stream_events = [
        json.loads(line.removeprefix("data: "))
        for line in stream.text.splitlines()
        if line.startswith("data: ")
    ]
    assert [event["type"] for event in stream_events] == [
        "RUN_STARTED",
        "STEP_STARTED",
        "ACTIVITY_SNAPSHOT",
        "ACTIVITY_SNAPSHOT",
        "STATE_SNAPSHOT",
        "STEP_FINISHED",
        "RUN_FINISHED",
    ]
    assert stream_events[3]["content"]["format"] == "mermaid-mindmap"
    assert stream_events[3]["content"]["mermaid"].startswith("mindmap\n")
    assert stream_events[-1]["outcome"] == {"type": "success"}
    cached = client.get(url)
    assert cached.status_code == 200
    assert cached.json()["researchDiagram"]["format"] == "mermaid-mindmap"
    assert client.app.state.agent.brief_calls == 1
    assert client.post(url, json={}).status_code == 200
    assert client.app.state.agent.brief_calls == 1
    assert (
        client.get(f"/api/v1/research/{session_id}").json()["proposal_brief"]["title"]
        == "System design proposal"
    )


def test_defense_lab_persists_probes_and_evaluations_in_session(client):
    session_id = new_session(client)
    client.app.state.defense = FakeDefenseLab()
    brief = {"id": "brief-defense", "title": "A persisted proposal"}

    generated = client.post(
        "/api/v1/defense/probes",
        json={"brief": brief, "session_id": session_id},
    )
    assert generated.status_code == 200, generated.text
    assert client.app.state.defense.generate_calls == 1

    saved = client.get(f"/api/v1/defense/probes/{session_id}")
    assert saved.status_code == 200
    assert saved.json()["brief_id"] == "brief-defense"
    assert len(saved.json()["probes"]) == 3

    probe = saved.json()["probes"][0]
    evaluated = client.post(
        "/api/v1/defense/evaluate",
        json={
            "brief": brief,
            "session_id": session_id,
            "probe": probe,
            "answer": "I will stratify by workload and report sensitivity analyses.",
        },
    )
    assert evaluated.status_code == 200, evaluated.text

    reopened = client.get(f"/api/v1/defense/probes/{session_id}").json()
    persisted_probe = next(item for item in reopened["probes"] if item["id"] == probe["id"])
    assert persisted_probe["userDefenseAnswer"].startswith("I will stratify")
    assert persisted_probe["feedback"]["strengthScore"] == 8


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

    async def concurrent_reply(history, research, **kwargs):
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
    assert client.app.state.agent.session_history == client.app.state.agent.history
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
    assert len(client.app.state.agent.session_history) == 3
    detail = client.get(f"/api/v1/sessions/{session_id}").json()
    assert len(detail["messages"]) == 4
    assert detail["title"] == "Xin chào"


def test_jev_receives_full_session_beyond_research_history_limit(client):
    session_id = new_session(client)
    client.app.state.agent.settings.max_history_messages = 2
    with client.app.state.db_factory() as db:
        db.add_all(
            [
                ChatMessage(
                    session_id=session_id,
                    sequence=index,
                    role="user" if index % 2 == 0 else "assistant",
                    content=f"session-context-{index}",
                )
                for index in range(6)
            ]
        )
        db.commit()

    response = client.post(
        f"/api/v1/sessions/{session_id}/messages", json={"content": "latest question"}
    )
    assert response.status_code == 200
    agent = client.app.state.agent
    assert len(agent.history) == 3
    assert len(agent.session_history) == 7
    assert agent.session_history[0]["content"] == "session-context-0"
    assert agent.session_history[-1] == {"role": "user", "content": "latest question"}


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

    async def reply(history, research, **kwargs):
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

    async def followup(history, research, **kwargs):
        return AgentReply(answer="Simple followup")

    client.app.state.agent.reply = followup
    response = client.post("/api/v1/chat", json={"message": "Thanks", "session_id": session_id})
    assert response.json()["research"]["reasoning_map"] == data["research"]["reasoning_map"]
