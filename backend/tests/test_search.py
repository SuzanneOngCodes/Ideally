import asyncio
import json

import httpx
import pytest

from src.core import search
from src.core.config import Settings
from src.core.errors import AgentUnavailableError


def test_tavily_request_and_bounded_results(monkeypatch):
    original = httpx.AsyncClient

    def handle(request):
        assert request.url == "https://api.tavily.com/search"
        assert request.headers["Authorization"] == "Bearer test-secret"
        payload = json.loads(request.content)
        assert payload["max_results"] == 5
        assert payload["include_answer"] is False
        return httpx.Response(
            200,
            json={
                "results": [
                    {"title": "Docs", "url": "https://docs.tavily.com/", "content": "x" * 5000},
                    {"title": "Invalid", "url": "javascript:alert(1)"},
                ]
            },
        )

    monkeypatch.setattr(
        search.httpx,
        "AsyncClient",
        lambda **kw: original(transport=httpx.MockTransport(handle), **kw),
    )
    result = asyncio.run(
        search.search_external_knowledge(
            Settings(_env_file=None, tavily_api_key="test-secret"), "test query"
        )
    )
    assert len(result["results"]) == 1
    assert len(result["results"][0]["content"]) == 4000


def test_tavily_error_does_not_expose_credentials(monkeypatch):
    original = httpx.AsyncClient
    monkeypatch.setattr(
        search.httpx,
        "AsyncClient",
        lambda **kw: original(
            transport=httpx.MockTransport(lambda req: httpx.Response(401, text="test-secret")), **kw
        ),
    )
    with pytest.raises(AgentUnavailableError) as error:
        asyncio.run(
            search.search_external_knowledge(
                Settings(_env_file=None, tavily_api_key="test-secret"), "test query"
            )
        )
    assert "test-secret" not in str(error.value)
