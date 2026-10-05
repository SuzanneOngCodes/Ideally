"""Bounded Tavily search results for the agent's external knowledge tool."""

import httpx
from pydantic import ValidationError

from src.core.config import Settings
from src.core.errors import AgentUnavailableError
from src.modules.research.schemas import Source


async def search_external_knowledge(settings: Settings, query: str) -> dict:
    query = query.strip()
    if not query or len(query) > 1000:
        return {"error": "Search query must contain 1–1000 characters", "results": []}
    key = settings.tavily_api_key.get_secret_value()
    if not key:
        raise AgentUnavailableError("Set TAVILY_API_KEY in backend/.env")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 5,
                    "include_answer": False,
                    "include_raw_content": False,
                },
            )
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as error:
        # No provider response bodies, credentials or queries enter logs/errors.
        raise AgentUnavailableError("External knowledge search unavailable; retry later") from error
    results = []
    for item in data.get("results", [])[:5]:
        try:
            source = Source(title=item.get("title") or item["url"], url=item["url"])
        except (ValidationError, KeyError, TypeError):
            continue
        results.append(
            {
                "title": source.title,
                "url": str(source.url),
                "content": str(item.get("content") or "")[:4000],
            }
        )
    return {"query": query, "results": results}
