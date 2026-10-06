"""Bounded Markdown retrieval through the managed Crawl4AI Cloud API."""

import asyncio
import hashlib
import ipaddress
import socket
import time
from datetime import UTC, datetime
from urllib.parse import urlsplit
from typing import Any
import httpx

from src.core.config import Settings


async def validate_public_url(url: str) -> str:
    parsed = urlsplit(url)
    if (
        parsed.scheme not in ("http", "https")
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 80, 443)
    ):
        raise ValueError("Only public HTTP(S) URLs on standard ports are supported")
    addresses = await asyncio.get_running_loop().getaddrinfo(
        parsed.hostname,
        parsed.port or (443 if parsed.scheme == "https" else 80),
        type=socket.SOCK_STREAM,
    )
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError("Private and reserved network addresses are blocked")
    return addresses[0][4][0]


class CrawlService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.slots = asyncio.Semaphore(settings.crawl_concurrency)
        self.cache: dict[str, tuple[float, dict]] = {}

    async def crawl(self, urls: list[str], *, timeout_seconds: float | None = None) -> dict:
        if not urls or len(urls) > self.settings.crawl_max_urls:
            return {"results": [], "error": f"Provide 1–{self.settings.crawl_max_urls} URLs"}
        if not self.settings.crawl4ai_api_key.get_secret_value().strip():
            return {"results": [], "error": "CRAWL4AI_API_KEY is not configured"}
        urls = list(dict.fromkeys(urls))
        results: dict[str, dict] = {}

        async def run(url: str):
            try:
                async with asyncio.timeout(self.settings.crawl_url_timeout_seconds):
                    async with self.slots:
                        results[url] = await self._fetch(url)
            except TimeoutError:
                results[url] = {"source_url": url, "success": False, "error": "URL timed out"}
            except httpx.HTTPStatusError as exc:
                results[url] = {
                    "source_url": url,
                    "success": False,
                    "error": f"Crawl4AI Cloud returned HTTP {exc.response.status_code}",
                }
            except Exception:
                results[url] = {
                    "source_url": url,
                    "success": False,
                    "error": "Unable to retrieve content from Crawl4AI Cloud",
                }

        tasks = [asyncio.create_task(run(url)) for url in urls]
        try:
            await asyncio.wait(
                tasks,
                timeout=min(
                    self.settings.crawl_batch_timeout_seconds,
                    timeout_seconds if timeout_seconds is not None else float("inf"),
                ),
            )
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
        return {
            "results": [
                results.get(
                    url,
                    {
                        "source_url": url,
                        "success": False,
                        "error": "Batch deadline reached",
                    },
                )
                for url in urls
            ]
        }

    async def _fetch(self, url: str) -> dict:
        return await self._answer(url)

    async def _answer(self, query: str) -> dict[str, Any]:
        """
        Ask Crawl4AI Cloud /answer endpoint and return a normalized response.

        Flow:
        1. Validate query
        2. Check in-memory cache
        3. Call Crawl4AI /answer
        4. Validate API response
        5. Normalize answer + sources
        6. Cache successful result
        7. Return normalized payload
        """

        # ---------------------------------------------------------
        # 1. Validate input
        # ---------------------------------------------------------
        query = query.strip()

        if not query:
            raise ValueError("Query must not be empty")

        # ---------------------------------------------------------
        # 2. Check cache
        # ---------------------------------------------------------
        cached = self.cache.get(query)

        if cached:
            expires_at, cached_data = cached

            if expires_at > time.monotonic():
                return {
                    **cached_data,
                    "cached": True,
                }

            # Remove expired cache entry
            self.cache.pop(query, None)

        # ---------------------------------------------------------
        # 3. Build endpoint
        # ---------------------------------------------------------
        endpoint = f"{self.settings.crawl4ai_base_url.rstrip('/')}/answer"

        headers = {
            "Authorization": (
                f"Bearer {self.settings.crawl4ai_api_key.get_secret_value()}"
            ),
            "Accept": "application/json",
        }

        params = {
            "q": query,
        }

        # Optional:
        # params["deep"] = 0
        #
        # deep=0 means Crawl4AI will only return a direct answer
        # when one is readily available.

        # ---------------------------------------------------------
        # 4. Call Crawl4AI
        # ---------------------------------------------------------
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.crawl_url_timeout_seconds,
                follow_redirects=False,
                trust_env=False,
            ) as client:
                response = await client.get(
                    endpoint,
                    headers=headers,
                    params=params,
                )

                response.raise_for_status()

        except httpx.TimeoutException as exc:
            raise ValueError(
                f"Crawl4AI answer request timed out for query: {query}"
            ) from exc

        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code

            try:
                error_payload = exc.response.json()
            except Exception:
                error_payload = exc.response.text

            raise ValueError(
                f"Crawl4AI answer request failed "
                f"with status={status_code}: {error_payload}"
            ) from exc

        except httpx.RequestError as exc:
            raise ValueError(
                f"Could not connect to Crawl4AI Cloud: {exc}"
            ) from exc

        # ---------------------------------------------------------
        # 5. Parse JSON response
        # ---------------------------------------------------------
        try:
            payload = response.json()
        except ValueError as exc:
            raise ValueError(
                "Crawl4AI Cloud returned invalid JSON"
            ) from exc

        if not isinstance(payload, dict):
            raise ValueError(
                "Invalid Crawl4AI Cloud response: expected JSON object"
            )

        # ---------------------------------------------------------
        # 6. Check answered status
        # ---------------------------------------------------------
        answered = payload.get("answered")

        if answered is not True:
            return {
                "success": True,
                "answered": False,
                "query": query,
                "answer": None,
                "answer_kind": None,
                "sources": [],
                "fetched_at": datetime.now(UTC).isoformat(),
                "content_hash": None,
                "cached": False,
                "retrieval_mode": "crawl4ai_answer",
                "experimental": payload.get("experimental", True),
            }

        # ---------------------------------------------------------
        # 7. Extract answer object
        # ---------------------------------------------------------
        answer_payload = payload.get("answer")

        if not isinstance(answer_payload, dict):
            raise ValueError(
                "Invalid Crawl4AI answer response: missing answer object"
            )

        answer_text = answer_payload.get("text")

        if not isinstance(answer_text, str):
            raise ValueError(
                "Invalid Crawl4AI answer response: answer.text must be a string"
            )

        answer_text = answer_text.strip()

        if not answer_text:
            raise ValueError(
                "Crawl4AI returned an empty answer"
            )

        answer_kind = answer_payload.get("kind")

        # ---------------------------------------------------------
        # 8. Normalize sources
        # ---------------------------------------------------------
        raw_sources = answer_payload.get("sources", [])

        normalized_sources: list[dict[str, Any]] = []

        if isinstance(raw_sources, list):
            for source in raw_sources:
                if not isinstance(source, dict):
                    continue

                source_url = source.get("url")
                source_title = source.get("title")

                normalized_sources.append(
                    {
                        "title": (
                            str(source_title).strip()
                            if source_title
                            else None
                        ),
                        "url": (
                            str(source_url).strip()
                            if source_url
                            else None
                        ),
                    }
                )

        # ---------------------------------------------------------
        # 9. Build normalized result
        # ---------------------------------------------------------
        data: dict[str, Any] = {
            "success": True,
            "answered": True,
            "query": query,
            "answer": answer_text,
            "answer_kind": answer_kind,
            "sources": normalized_sources,
            "fetched_at": datetime.now(UTC).isoformat(),
            "content_hash": hashlib.sha256(
                answer_text.encode("utf-8")
            ).hexdigest(),
            "cached": False,
            "retrieval_mode": "crawl4ai_answer",
            "experimental": payload.get("experimental", True),
        }

        # ---------------------------------------------------------
        # 10. Cache successful answers
        # ---------------------------------------------------------
        max_cache_size = 128

        if len(self.cache) >= max_cache_size:
            oldest_key = next(iter(self.cache))
            self.cache.pop(oldest_key, None)

        self.cache[query] = (
            time.monotonic()
            + self.settings.crawl_cache_ttl_seconds,
            data,
        )

        # ---------------------------------------------------------
        # 11. Return
        # ---------------------------------------------------------
        return data