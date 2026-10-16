import asyncio

import httpx
from fastapi import FastAPI

from src.core.config import Settings
from src.modules.evidence import service as evidence_module
from src.modules.evidence.router import router


def test_web_search_uses_backend_crawl4ai_and_filters_bad_urls(monkeypatch):
    original = httpx.AsyncClient

    def handle(request):
        assert request.method == "GET"
        assert str(request.url).startswith("https://api.crawl4ai.com/search?q=GPU+latency")
        assert request.headers["authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "title": "Real report",
                        "url": "https://example.org/report",
                        "snippet": "Measured",
                    },
                    {"title": "Duplicate", "url": "https://example.org/report"},
                    {"title": "Unsafe", "url": "http://localhost/private"},
                ]
            },
        )

    monkeypatch.setattr(
        evidence_module.httpx,
        "AsyncClient",
        lambda **kwargs: original(**kwargs, transport=httpx.MockTransport(handle)),
    )
    service = evidence_module.EvidenceSearchService(
        Settings(_env_file=None, crawl4ai_api_key="test-key")
    )
    result = asyncio.run(service.web("GPU latency"))
    assert result == {
        "query": "GPU latency",
        "engine": "crawl4ai",
        "results": [
            {
                "title": "Real report",
                "url": "https://example.org/report",
                "snippet": "Measured",
                "engine": "crawl4ai",
            }
        ],
    }


def test_academic_search_enriches_crawl4ai_paper_with_arxiv_metadata(monkeypatch):
    original = httpx.AsyncClient

    def handle(request):
        if request.url.host == "api.crawl4ai.com":
            assert request.url.params["q"] == "classification latency arxiv research paper"
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "title": "Preview title",
                            "url": "https://arxiv.org/html/2401.12345v1",
                            "snippet": "Preview only",
                        },
                        {
                            "title": "Blog",
                            "url": "https://example.org/blog",
                            "snippet": "Not a paper",
                        },
                    ]
                },
            )
        assert request.url.host == "export.arxiv.org"
        assert request.url.params["id_list"] == "2401.12345"
        return httpx.Response(
            200,
            text=(
                '<feed xmlns="http://www.w3.org/2005/Atom"><entry>'
                "<id>http://arxiv.org/abs/2401.12345v1</id>"
                "<title>Verified title</title><summary>Verified abstract.</summary>"
                "<published>2024-01-20T00:00:00Z</published>"
                "<author><name>Jane Doe</name></author></entry></feed>"
            ),
        )

    monkeypatch.setattr(
        evidence_module.httpx,
        "AsyncClient",
        lambda **kwargs: original(**kwargs, transport=httpx.MockTransport(handle)),
    )
    service = evidence_module.EvidenceSearchService(
        Settings(_env_file=None, crawl4ai_api_key="test-key")
    )
    result = asyncio.run(service.academic("classification latency", "all", 8))
    assert result["provider"] == "crawl4ai+arxiv"
    assert result["count"] == 1
    paper = result["results"][0]
    assert paper["title"] == "Verified title"
    assert paper["authors"] == "Jane Doe"
    assert paper["url"] == "https://arxiv.org/abs/2401.12345"
    assert paper["reviewScope"] == "abstract_only"


def test_selected_semantic_scholar_source_uses_backend_academic_provider(monkeypatch):
    original = httpx.AsyncClient

    def handle(request):
        assert request.url.host == "api.semanticscholar.org"
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "paperId": "paper-1",
                        "title": "Classification study",
                        "url": "https://www.semanticscholar.org/paper/paper-1",
                        "authors": [{"name": "Jane Doe"}],
                        "year": 2025,
                        "abstract": "Observed latency under a defined benchmark.",
                    }
                ]
            },
        )

    monkeypatch.setattr(
        evidence_module.httpx,
        "AsyncClient",
        lambda **kwargs: original(**kwargs, transport=httpx.MockTransport(handle)),
    )
    service = evidence_module.EvidenceSearchService(
        Settings(_env_file=None, crawl4ai_api_key="test-key")
    )
    result = asyncio.run(service.academic("classification latency", "semantic_scholar", 3))
    assert result["provider"] == "semantic_scholar"
    assert result["results"][0]["reviewScope"] == "abstract_only"
    assert result["results"][0]["authors"] == "Jane Doe"


def test_fastapi_evidence_route_reports_provider_failure_without_fake_results(monkeypatch):
    original = httpx.AsyncClient
    monkeypatch.setattr(
        evidence_module.httpx,
        "AsyncClient",
        lambda **kwargs: original(
            **kwargs,
            transport=httpx.MockTransport(lambda request: httpx.Response(500, json={})),
        ),
    )
    app = FastAPI()
    app.state.evidence = evidence_module.EvidenceSearchService(
        Settings(
            _env_file=None,
            crawl4ai_api_key="test-key",
            tavily_api_key="",
            google_custom_search_key="",
        )
    )
    app.include_router(router, prefix="/api/v1")

    async def check():
        async with original(transport=httpx.ASGITransport(app), base_url="http://test") as client:
            failed = await client.post("/api/v1/evidence/web", json={"query": "GPU latency"})
            invalid = await client.post("/api/v1/evidence/academic", json={"query": " "})
        assert failed.status_code == 502
        assert "results" not in failed.json()
        assert invalid.status_code == 400

    asyncio.run(check())
