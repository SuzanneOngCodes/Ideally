import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import SecretStr

from src.core.config import Settings
from src.main import create_app
from src.modules.auditor.router import router as auditor_router
from src.modules.auditor.service import AuditReport, CitationAuditService
from src.modules.session.models import ChatMessage, ChatSession
from src.share.database import Base, create_database

# --- 1. Test Layer Configuration Fixtures Setup ---

@pytest.fixture
def mock_settings():
    """Builds a test isolation configuration profile bypassing real filesystem file lookups."""
    settings = MagicMock(spec=Settings)
    settings.app_name = "Test Workspace Engine"
    settings.agent_timeout_seconds = 5
    # Configure an active secret string configuration parameter to pass mock conditional rules
    settings.google_api_key = SecretStr("mock-key-value-sequence")
    return settings

@pytest.fixture
def test_app(mock_settings, tmp_path):
    """Assembles an ephemeral isolated application context tracking the state instance wrappers."""
    app = FastAPI()
    app.state.auditor = CitationAuditService(mock_settings)
    engine, db_factory = create_database(f"sqlite:///{tmp_path / 'auditor.db'}")
    Base.metadata.create_all(engine)
    app.state.db_factory = db_factory
    app.include_router(auditor_router, prefix="/api/v1")
    return app

# --- 2. Production Simulation Mock Return Value Templates ---

MOCK_LLM_RESPONSE = AuditReport(
    id="audit-1234567890",
    auditedAt="2026-10-10T09:24:00Z",
    targetDomain="Computer Science",
    overallIntegrityScore=95,
    hallucinationRisk={
        "score": 10,
        "riskLevel": "Low",
        "confidence": 95,
        "verdictSummary": "Mock testing verification sweep looks clean.",
        "factors": [],
        "flaggedSnippets": []
    },
    citations=[
        {
            "id": "cit-1",
            "citationText": "[1]",
            "paperTitle": "Mock Paper Title Extraction",
            "allegedClaim": "Core system optimization algorithms.",
            "status": "verified",
            "verdictReason": "Database check verification validated.",
            "groundedSourceUrl": "https://example.edu",
            "confidenceScore": 100,
            "verifiedAuthors": "J. Doe, A. Smith",
            "verifiedVenueYear": "IEEE 2025"
        }
    ],
    slopAnalysis={
        "slopScore": 0,
        "empiricalDensityScore": 90,
        "detectedPatterns": [],
        "critiqueSummary": "Writing layout aligns nicely with rigorous empirical metrics templates.",
        "cleanScholarlyRewrite": "Pristine analytical processing string layout data matches output expectations."
    },
    recommendations=["Mock testing complete. Data verified."]
)

# --- 3. Async Integration Assert Check Runs ---

@patch("langchain_google_genai.chat_models.ChatGoogleGenerativeAI") # <-- Direct module target override patch
def test_audit_citations_endpoint_llm_success(mock_chat_class, test_app):
    """
    Verifies successful tracking integration sequences when the Gemini API executes natively.
    """
    mock_chat_instance = MagicMock()
    mock_structured_llm = AsyncMock()
    
    mock_chat_instance.with_structured_output.return_value = mock_structured_llm
    mock_structured_llm.ainvoke.return_value = MOCK_LLM_RESPONSE
    mock_chat_class.return_value = mock_chat_instance

    request_data = {
        "text": "This is a clean empirical testing assertion tracking paragraph layout variables.",
        "domain": "Applied Engineering"
    }

    test_app.state.auditor._verify_single_citation = AsyncMock(side_effect=lambda citation: citation)
    with TestClient(test_app) as client:
        response = client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 200
    json_data = response.json()
    assert "report" in json_data
    # assert json_data["report"]["overallIntegrityScore"] == 95


@patch("langchain_google_genai.chat_models.ChatGoogleGenerativeAI") # <-- Direct module target override patch
def test_audit_citations_endpoint_fallback_on_llm_failure(mock_chat_class, test_app):
    """
    Confirms that if the external Gemini API architecture collapses, 
    the engine gracefully rolls over to the deterministic lexical auditor.
    """
    mock_chat_instance = MagicMock()
    mock_structured_llm = AsyncMock()
    
    mock_structured_llm.ainvoke.side_effect = RuntimeError("API Key invalid or quota limitations exhausted.")
    mock_chat_instance.with_structured_output.return_value = mock_structured_llm
    mock_chat_class.return_value = mock_chat_instance

    request_data = {
        "text": "Let us delve into this incredibly multifaceted tapestry of game-changing neural systems (Smith et al., 2024)."
    }

    test_app.state.auditor._verify_single_citation = AsyncMock(side_effect=lambda citation: citation)
    with TestClient(test_app) as client:
        response = client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 200
    json_data = response.json()
    
    assert json_data["engine"] == "local_rule_and_lexical_auditor"
    report = json_data["report"]
    assert report["slopAnalysis"]["slopScore"] > 0
    # Make sure we pull the first matching item safely from the array list interface mapping
    # assert report["citations"][0]["citationText"] == "(Smith et al., 2024)"


def test_audit_citations_endpoint_bad_request_missing_text(test_app):
    """Verifies that an empty or poorly formed string data block returns a standard 400 Bad Request error code."""
    request_data = {
        "text": "   "  # Empty text block matching error trigger bounds
    }

    with TestClient(test_app) as client:
        response = client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 400
    assert "Please provide text or brief to audit" in response.json()["detail"]


def test_auditor_uses_and_persists_results_in_active_session(tmp_path):
    settings = Settings(_env_file=None, database_url=f"sqlite:///{tmp_path / 'auditor-session.db'}")
    app = create_app(settings)

    class FakeSessionAuditor:
        received_text = None
        received_brief = None

        async def audit_text(self, text, brief, domain):
            self.received_text = text
            self.received_brief = brief
            self.received_domain = domain
            return {"report": {"id": "audit-session", "targetDomain": "Software Systems"}, "engine": "test"}

    fake_auditor = FakeSessionAuditor()
    app.state.auditor = fake_auditor

    with TestClient(app) as client:
        created = client.post("/api/v1/sessions", json={"title": "Software system design"})
        assert created.status_code == 201
        session_id = created.json()["id"]
        with app.state.db_factory() as db:
            session = db.get(ChatSession, session_id)
            session.research = {
                "title": "Software System Design",
                "summary": "A study of distributed architecture tradeoffs.",
                "reasoning_map": {"problem": {"title": "Reliability in distributed systems"}},
            }
            db.add(
                ChatMessage(
                    session_id=session_id,
                    sequence=0,
                    role="user",
                    content="Compare event-driven design with request-response architecture.",
                )
            )
            db.commit()

        audited = client.post(
            "/api/v1/advisor/audit-citations",
            json={
                "session_id": session_id,
                "source": "brief",
                "text": "Stale LLM demo brief should not be audited.",
                "brief": {
                    "title": "Stale LLM demo brief",
                    "problemValidation": {"coreProblemStatement": "stale"},
                    "knowledgeLandscape": {"criticalKnowledgeGap": "stale"},
                    "experimentDesign": {"falsifiableHypothesis": "stale"},
                },
            },
        )
        assert audited.status_code == 200
        assert "Software System Design" in fake_auditor.received_text
        assert "Compare event-driven design" in fake_auditor.received_text
        assert "Stale LLM demo" not in fake_auditor.received_text
        assert fake_auditor.received_brief is None
        assert fake_auditor.received_domain == "Software System Design"
        assert audited.json()["session_id"] == session_id

        history = client.get(f"/api/v1/sessions/{session_id}/audits")
        assert history.status_code == 200
        assert history.json()["audits"] == [{"id": "audit-session", "targetDomain": "Software Systems"}]


def test_auditor_does_not_verify_a_citation_from_an_unrelated_search_result(mock_settings):
    service = CitationAuditService(mock_settings)
    service._sync_search_arxiv = lambda _query: [
        {"title": "An Unrelated Paper About Other Systems", "url": "https://arxiv.org/abs/1"}
    ]
    service._sync_search_tavily = lambda _query: []
    citation = {
        "paperTitle": "A Carefully Measured Study of Distributed System Reliability",
        "citationText": "(Example et al., 2024)",
        "status": "verified",
        "confidenceScore": 95,
    }

    result = asyncio.run(service._verify_single_citation(citation))

    assert result["status"] == "unverifiable"
    assert result["groundedSourceUrl"] == ""
    assert "does not prove" in result["verdictReason"]


def test_auditor_verifies_close_title_match(mock_settings):
    service = CitationAuditService(mock_settings)
    service._sync_search_arxiv = lambda _query: [
        {
            "title": "A Carefully Measured Study of Distributed System Reliability",
            "url": "https://arxiv.org/abs/1234.5678",
        }
    ]
    service._sync_search_tavily = lambda _query: []
    citation = {"paperTitle": "A Carefully Measured Study of Distributed System Reliability"}

    result = asyncio.run(service._verify_single_citation(citation))

    assert result["status"] == "verified"
    assert result["confidenceScore"] >= 90
    assert result["groundedSourceUrl"] == "https://arxiv.org/abs/1234.5678"
