"""Live evidence discovery, kept behind the FastAPI service boundary."""

import ipaddress
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

import httpx

from src.core.config import Settings

ATOM = "{http://www.w3.org/2005/Atom}"
ARXIV_PATH = re.compile(r"^/(?:abs|html|pdf)/(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?/?$")


class EvidenceUnavailable(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def public_result_url(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = urlsplit(value)
        host = parsed.hostname
        if parsed.scheme not in {"http", "https"} or not host or parsed.username or parsed.password:
            return None
        if host == "localhost" or host.endswith((".local", ".internal")):
            return None
        try:
            if not ipaddress.ip_address(host).is_global:
                return None
        except ValueError:
            pass
        return value
    except ValueError:
        return None


def arxiv_papers(xml: str) -> list[dict]:
    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        return []
    papers = []
    for entry in root.findall(f"{ATOM}entry"):
        original_url = entry.findtext(f"{ATOM}id", default="")
        match = ARXIV_PATH.match(urlsplit(original_url).path)
        if not match:
            continue
        paper_id = match.group(1)
        abstract = " ".join(entry.findtext(f"{ATOM}summary", default="").split())
        title = " ".join(entry.findtext(f"{ATOM}title", default="").split())
        if not title:
            continue
        authors = [
            author.findtext(f"{ATOM}name", default="").strip()
            for author in entry.findall(f"{ATOM}author")
        ]
        authors = [author for author in authors if author]
        published = entry.findtext(f"{ATOM}published", default="")[:10]
        papers.append(
            {
                "id": f"https://arxiv.org/abs/{paper_id}",
                "title": title,
                "authors": ", ".join(authors[:4]) + (" et al." if len(authors) > 4 else ""),
                "yearOrDate": published,
                "venueOrPublisher": "arXiv.org Preprint",
                "url": f"https://arxiv.org/abs/{paper_id}",
                "pdfUrl": f"https://arxiv.org/pdf/{paper_id}",
                "abstract": abstract[:400] + ("..." if len(abstract) > 400 else ""),
                "sourceType": "arxiv",
                "isOpenAccess": True,
                "isPrimarySource": True,
                "reviewScope": "abstract_only",
            }
        )
    return papers


def academic_discovery(hits: list[dict]) -> list[dict]:
    papers = []
    seen = set()
    for hit in hits:
        parsed = urlsplit(hit["url"])
        host = (parsed.hostname or "").lower()
        arxiv_id = ARXIV_PATH.match(parsed.path) if host in {"arxiv.org", "www.arxiv.org"} else None
        semantic = host in {"semanticscholar.org", "www.semanticscholar.org"} and (
            parsed.path.startswith("/paper/")
        )
        if not arxiv_id and not semantic:
            continue
        url = f"https://arxiv.org/abs/{arxiv_id.group(1)}" if arxiv_id else hit["url"]
        if url in seen:
            continue
        seen.add(url)
        papers.append(
            {
                "id": url,
                "title": hit["title"],
                "authors": "",
                "yearOrDate": "",
                "venueOrPublisher": "arXiv search result"
                if arxiv_id
                else "Semantic Scholar search result",
                "url": url,
                "abstract": hit["snippet"],
                "sourceType": "crawl4ai_discovery",
                "isOpenAccess": bool(arxiv_id),
                "isPrimarySource": False,
                "reviewScope": "search_snippet",
            }
        )
    return papers


class EvidenceSearchService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def _crawl4ai_search(self, query: str) -> list[dict]:
        key = self.settings.crawl4ai_api_key.get_secret_value().strip()
        if not key:
            raise EvidenceUnavailable("CRAWL4AI_API_KEY is not configured", 503)
        async with httpx.AsyncClient(timeout=45, follow_redirects=False, trust_env=False) as client:
            response = await client.get(
                f"{self.settings.crawl4ai_base_url.rstrip('/')}/search",
                params={"q": query},
                headers={"Authorization": f"Bearer {key}", "Accept": "application/json"},
            )
            response.raise_for_status()
            payload = response.json()
        if not isinstance(payload, dict) or not isinstance(payload.get("results"), list):
            raise ValueError("Invalid Crawl4AI search response")
        hits = []
        seen = set()
        for item in payload["results"]:
            if not isinstance(item, dict):
                continue
            url = public_result_url(item.get("url"))
            title = item.get("title")
            if not url or not isinstance(title, str) or not title.strip() or url in seen:
                continue
            seen.add(url)
            snippet = item.get("snippet")
            hits.append(
                {
                    "title": title.strip()[:300],
                    "url": url,
                    "snippet": snippet.strip()[:1200] if isinstance(snippet, str) else "",
                }
            )
        return hits

    async def _arxiv(
        self, *, query: str | None = None, ids: list[str] | None = None, limit: int = 6
    ) -> list[dict]:
        params: dict[str, str | int] = {"max_results": limit}
        if ids:
            params["id_list"] = ",".join(ids)
        elif query:
            keywords = re.sub(r"[^\w\s-]", " ", query).strip()[:80]
            if not keywords:
                return []
            params.update({"search_query": f"all:{keywords}", "start": 0, "sortBy": "relevance"})
        else:
            return []
        async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
            response = await client.get(
                "https://export.arxiv.org/api/query",
                params=params,
                headers={"User-Agent": "IdeallyResearchAdvisor/1.0"},
            )
            response.raise_for_status()
        return arxiv_papers(response.text)

    async def _semantic_scholar(self, query: str, limit: int) -> list[dict]:
        headers = {"User-Agent": "IdeallyResearchAdvisor/1.0"}
        key = self.settings.semantic_scholar_api_key.get_secret_value().strip()
        if key:
            headers["x-api-key"] = key
        async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
            response = await client.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={
                    "query": query[:80],
                    "limit": limit,
                    "fields": (
                        "title,authors,year,venue,abstract,citationCount,"
                        "url,isOpenAccess,externalIds"
                    ),
                },
                headers=headers,
            )
            response.raise_for_status()
            payload = response.json()
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
            return []
        results = []
        for item in payload["data"]:
            if not isinstance(item, dict) or not isinstance(item.get("title"), str):
                continue
            external = item.get("externalIds") or {}
            url = public_result_url(item.get("url"))
            if not url and isinstance(external, dict) and external.get("DOI"):
                url = public_result_url(f"https://doi.org/{external['DOI']}")
            if not url:
                continue
            raw_authors = item.get("authors")
            authors = (
                [str(a.get("name") or "") for a in raw_authors if isinstance(a, dict)]
                if isinstance(raw_authors, list)
                else []
            )
            abstract = item.get("abstract") if isinstance(item.get("abstract"), str) else ""
            results.append(
                {
                    "id": item.get("paperId") or url,
                    "title": item["title"],
                    "authors": ", ".join(authors[:4]) + (" et al." if len(authors) > 4 else ""),
                    "yearOrDate": str(item["year"]) if item.get("year") else "",
                    "venueOrPublisher": item.get("venue") or "Semantic Scholar record",
                    "url": url,
                    "abstract": abstract[:400] + ("..." if len(abstract) > 400 else ""),
                    "sourceType": "semantic_scholar",
                    "citationCount": item.get("citationCount") or 0,
                    "isOpenAccess": bool(item.get("isOpenAccess")),
                    "isPrimarySource": False,
                    "reviewScope": "abstract_only",
                }
            )
        return results

    async def academic(self, query: str, source: str, limit: int) -> dict:
        query = query.strip()
        if not query:
            raise EvidenceUnavailable("Search query is required", 400)
        if source == "all" and self.settings.crawl4ai_api_key.get_secret_value().strip():
            try:
                hits = await self._crawl4ai_search(f"{query} arxiv research paper")
                discovered = academic_discovery(hits)[:limit]
                if discovered:
                    ids = [
                        paper["url"].rsplit("/", 1)[-1]
                        for paper in discovered
                        if paper["url"].startswith("https://arxiv.org/abs/")
                    ]
                    try:
                        metadata = await self._arxiv(ids=ids, limit=len(ids)) if ids else []
                    except (httpx.HTTPError, ValueError):
                        metadata = []
                    by_url = {paper["url"]: paper for paper in metadata}
                    results = [{**paper, **by_url.get(paper["url"], {})} for paper in discovered]
                    return {
                        "query": query,
                        "results": results,
                        "count": len(results),
                        "provider": "crawl4ai+arxiv" if metadata else "crawl4ai_discovery",
                    }
            except (httpx.HTTPError, ValueError, EvidenceUnavailable):
                pass
        results = []
        provider = "none"
        if source in {"all", "semantic_scholar"}:
            try:
                results = await self._semantic_scholar(query, limit)
            except (httpx.HTTPError, ValueError):
                pass
            if results:
                provider = "semantic_scholar"
        if len(results) < limit and source in {"all", "arxiv"}:
            try:
                results += await self._arxiv(query=query, limit=limit - len(results))
            except (httpx.HTTPError, ValueError):
                pass
            if results and provider == "none":
                provider = "arxiv"
        return {"query": query, "results": results, "count": len(results), "provider": provider}

    async def web(self, query: str) -> dict:
        query = query.strip()
        if not query:
            raise EvidenceUnavailable("Search query is required", 400)
        key = self.settings.crawl4ai_api_key.get_secret_value().strip()
        if key:
            try:
                hits = await self._crawl4ai_search(query)
                return {
                    "query": query,
                    "engine": "crawl4ai",
                    "results": [{**hit, "engine": "crawl4ai"} for hit in hits[:8]],
                }
            except (httpx.HTTPError, ValueError):
                pass
        tavily_key = self.settings.tavily_api_key.get_secret_value().strip()
        if tavily_key:
            try:
                async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
                    response = await client.post(
                        "https://api.tavily.com/search",
                        headers={"Authorization": f"Bearer {tavily_key}"},
                        json={"query": query, "search_depth": "advanced", "max_results": 5},
                    )
                    response.raise_for_status()
                    payload = response.json()
                results = []
                for item in payload.get("results", [])[:5]:
                    url = public_result_url(item.get("url"))
                    if url:
                        results.append(
                            {
                                "title": str(item.get("title") or url),
                                "url": url,
                                "snippet": str(item.get("content") or "")[:1200],
                                "publishedDate": item.get("published_date"),
                                "engine": "tavily",
                            }
                        )
                return {"query": query, "engine": "tavily", "results": results}
            except (httpx.HTTPError, ValueError, TypeError, AttributeError):
                pass
        cse_key = self.settings.google_custom_search_key.get_secret_value().strip()
        cse_cx = self.settings.google_custom_search_cx.strip()
        if cse_key and cse_cx:
            try:
                async with httpx.AsyncClient(timeout=30, follow_redirects=False) as client:
                    response = await client.get(
                        "https://www.googleapis.com/customsearch/v1",
                        params={"key": cse_key, "cx": cse_cx, "q": query, "num": 5},
                    )
                    response.raise_for_status()
                    payload = response.json()
                results = []
                for item in payload.get("items", [])[:5]:
                    url = public_result_url(item.get("link"))
                    if url:
                        results.append(
                            {
                                "title": str(item.get("title") or url),
                                "url": url,
                                "snippet": str(item.get("snippet") or "")[:1200],
                                "engine": "google_custom_search",
                            }
                        )
                return {"query": query, "engine": "google_custom_search", "results": results}
            except (httpx.HTTPError, ValueError, TypeError, AttributeError):
                pass
        configured = bool(key or tavily_key or (cse_key and cse_cx))
        raise EvidenceUnavailable(
            "Search providers are temporarily unavailable. Please retry."
            if configured
            else "Web search is unavailable. Configure CRAWL4AI_API_KEY.",
            502 if configured else 503,
        )
