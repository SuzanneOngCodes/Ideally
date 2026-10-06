import asyncio
import socket

import httpx
import pytest

from src.core import crawl
from src.core.config import Settings


def test_private_dns_and_schemes_rejected(monkeypatch):
    async def addresses(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 80))]

    async def check():
        monkeypatch.setattr(asyncio.get_running_loop(), "getaddrinfo", addresses)
        for url in ["https://example.com/", "file:///etc/passwd", "http://user:pass@host/"]:
            with pytest.raises(ValueError):
                await crawl.validate_public_url(url)

    asyncio.run(check())


def test_cloud_request_cache_and_truncation(monkeypatch):
    import json

    original = httpx.AsyncClient
    requests = []
    checked = []

    async def validate(url):
        checked.append(url)
        if "private" in url:
            raise ValueError("blocked")

    def handle(request):
        requests.append(request)
        assert str(request.url) == "https://api.crawl4ai.com/scrape"
        assert request.method == "POST"
        assert request.headers["authorization"] == "Bearer test-key"
        body = json.loads(request.content)
        assert body["format"] == "md"
        return httpx.Response(
            200,
            json={
                "markdown": "evidence " * 200,
                "url": body["url"],
                "metadata": {"title": "Evidence"},
            },
        )

    monkeypatch.setattr(crawl, "validate_public_url", validate)
    monkeypatch.setattr(
        crawl.httpx,
        "AsyncClient",
        lambda **kw: original(**kw, transport=httpx.MockTransport(handle)),
    )

    async def check():
        service = crawl.CrawlService(
            Settings(_env_file=None, crawl4ai_api_key="test-key", crawl_max_markdown_chars=500)
        )
        data = await service.crawl(["https://example.com/", "http://private/"])
        good, bad = data["results"]
        assert good["success"] and good["truncated"]
        assert good["title"] == "Evidence"
        assert good["retrieval_mode"] == "crawl4ai_cloud"
        assert good["javascript_rendered"] is None
        assert len(good["markdown"]) == 500
        assert len(good["content_hash"]) == 64
        assert not bad["success"]
        cached = await service.crawl(["https://example.com/"])
        assert cached["results"][0]["cached"]
        assert len(requests) == 1
        assert "http://private/" in checked

    asyncio.run(check())


@pytest.mark.parametrize(
    "status,payload",
    [
        (401, {"error": "secret upstream details"}),
        (429, {}),
        (503, {}),
        (200, {"success": False, "markdown": "evidence " * 200}),
        (200, {"markdown": "short"}),
        (200, []),
    ],
)
def test_cloud_errors_are_not_cached(monkeypatch, status, payload):
    original = httpx.AsyncClient

    async def validate(url):
        pass

    monkeypatch.setattr(crawl, "validate_public_url", validate)
    monkeypatch.setattr(
        crawl.httpx,
        "AsyncClient",
        lambda **kw: original(
            **kw,
            transport=httpx.MockTransport(lambda request: httpx.Response(status, json=payload)),
        ),
    )

    async def check():
        service = crawl.CrawlService(Settings(_env_file=None, crawl4ai_api_key="test-key"))
        result = (await service.crawl(["https://example.com/"]))["results"][0]
        assert not result["success"]
        assert "secret" not in result["error"]
        if status >= 400:
            assert str(status) in result["error"]
        assert not service.cache

    asyncio.run(check())


def test_missing_cloud_key(monkeypatch):
    monkeypatch.delenv("CRAWL4AI_API_KEY", raising=False)
    service = crawl.CrawlService(Settings(_env_file=None))
    result = asyncio.run(service.crawl(["https://example.com/"]))
    assert result == {"results": [], "error": "CRAWL4AI_API_KEY is not configured"}


def test_batch_deadline_preserves_completed_results_and_cancels(monkeypatch):
    cancelled = []

    async def check():
        service = crawl.CrawlService(
            Settings(_env_file=None, crawl4ai_api_key="test-key", crawl_batch_timeout_seconds=0.03)
        )

        async def fetch(url):
            if url.endswith("/slow"):
                try:
                    await asyncio.sleep(10)
                finally:
                    cancelled.append(url)
            return {"source_url": url, "success": True}

        monkeypatch.setattr(service, "_fetch", fetch)
        result = await service.crawl(["https://example.com/fast", "https://example.com/slow"])
        assert result["results"][0]["success"]
        assert not result["results"][1]["success"]
        assert cancelled == ["https://example.com/slow"]

    asyncio.run(check())
