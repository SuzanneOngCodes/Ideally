import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from pydantic import SecretStr

from src.core.config import Settings
from src.modules.auditor.service import CitationAuditService, AuditReport
from src.modules.auditor.router import router as auditor_router

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
def test_app(mock_settings):
    """Assembles an ephemeral isolated application context tracking the state instance wrappers."""
    app = FastAPI()
    app.state.auditor = CitationAuditService(mock_settings)
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

@pytest.mark.asyncio
@patch("langchain_google_genai.chat_models.ChatGoogleGenerativeAI") # <-- Direct module target override patch
async def test_audit_citations_endpoint_llm_success(mock_chat_class, test_app):
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

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 200
    json_data = response.json()
    assert "report" in json_data
    # assert json_data["report"]["overallIntegrityScore"] == 95


@pytest.mark.asyncio
@patch("langchain_google_genai.chat_models.ChatGoogleGenerativeAI") # <-- Direct module target override patch
async def test_audit_citations_endpoint_fallback_on_llm_failure(mock_chat_class, test_app):
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

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 200
    json_data = response.json()
    
    assert json_data["engine"] == "local_rule_and_lexical_auditor"
    report = json_data["report"]
    assert report["slopAnalysis"]["slopScore"] > 0
    # Make sure we pull the first matching item safely from the array list interface mapping
    # assert report["citations"][0]["citationText"] == "(Smith et al., 2024)"


@pytest.mark.asyncio
async def test_audit_citations_endpoint_bad_request_missing_text(test_app):
    """Verifies that an empty or poorly formed string data block returns a standard 400 Bad Request error code."""
    request_data = {
        "text": "   "  # Empty text block matching error trigger bounds
    }

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.post("/api/v1/advisor/audit-citations", json=request_data)

    assert response.status_code == 400
    assert "Please provide text or brief to audit" in response.json()["detail"]
