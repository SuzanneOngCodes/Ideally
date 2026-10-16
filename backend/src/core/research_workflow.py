"""Per-turn skill selection and bounded source reading for the chat agent."""

import json
import re
from typing import Literal

from langchain_core.tools import tool

from src.core.crawl import CrawlService
from src.core.logger import log_event
from src.core.research_skills import active_skill
from src.modules.research.schemas import Source

SkillName = Literal[
    "clarify-research-context",
    "verify-problem",
    "read-research-source",
    "compare-directions",
    "design-experiment",
    "write-research-brief",
]
SKILL_STAGES = {
    "clarify-research-context": "clarify",
    "verify-problem": "verify",
    "read-research-source": "review",
    "compare-directions": "compare",
    "design-experiment": "design",
    "write-research-brief": "brief",
}


class ResearchWorkflow:
    def __init__(self, crawler: CrawlService, observed: dict[str, Source], history: list[dict]):
        self.crawler = crawler
        self.observed = observed
        self.loaded: set[str] = set()
        self.crawl_attempts = 0
        self.crawled: set[str] = set()
        self.searched = False
        self.user_urls = {
            url.rstrip(".,;)")
            for message in history
            if message["role"] == "user"
            for url in re.findall(r'https?://[^\s<>"\]]+', message["content"])
        }

    def tools(self):
        @tool
        async def load_skill(skill: SkillName, task: str) -> str:
            """Load instructions for the current task before doing it. Explain task briefly.

            Choose clarify-research-context for unknown requirements, verify-problem for
            factual investigation, read-research-source before crawling, compare-directions
            for alternatives, design-experiment for experiments, write-research-brief for briefs.
            """
            content = active_skill(SKILL_STAGES[skill], source="load_skill")
            self.loaded.add(skill)
            log_event("skill.selected", skill=skill)
            return json.dumps({"status": "success", "skill": skill, "instructions": content})

        @tool
        async def crawl_web_markdown(urls: list[str]) -> str:
            """Read original source pages as bounded Markdown after loading read-research-source.

            Supply 1–3 URLs returned by web_search or explicitly supplied by the user.
            Search snippets are not full source text. Read the returned Markdown before citing.
            Failure is evidence unavailable, never permission to invent source contents.
            """
            if "read-research-source" not in self.loaded:
                return json.dumps(
                    {
                        "status": "error",
                        "next_actions": [
                            "Call load_skill with read-research-source before crawling."
                        ],
                    }
                )
            if not urls or any(
                url not in self.observed and url not in self.user_urls for url in urls
            ):
                return json.dumps(
                    {
                        "status": "error",
                        "next_actions": ["Use URLs from web_search or the user's message."],
                    }
                )
            if len(urls) > self.crawler.settings.crawl_max_urls:
                return json.dumps({"status": "error", "summary": "Too many URLs in batch"})
            if self.crawl_attempts >= 2:
                return json.dumps({"status": "warning", "summary": "Crawl budget exhausted"})
            self.crawl_attempts += 1
            data = await self.crawler.crawl(urls)
            for item in data.get("results", []):
                if item.get("success") and item.get("markdown"):
                    url = item["source_url"]
                    self.crawled.add(url)
                    self.observed[url] = Source(
                        url=url,
                        title=item.get("title") or url,
                        excerpt=item["markdown"][:4000],
                    )
            failed = "error" in data or any(
                not item.get("success") for item in data.get("results", [])
            )
            return json.dumps(
                {"status": "warning" if failed else "success", **data}, ensure_ascii=False
            )

        return [load_skill, crawl_web_markdown]

    def missing_steps(self, research, result):
        if (research or result.research or self.searched) and not self.loaded:
            return "Call load_skill for this task before answering."
        if (self.searched and self.observed or self.user_urls) and not self.crawl_attempts:
            return (
                "Call load_skill(read-research-source), then crawl_web_markdown on relevant "
                "source URLs before answering. If it fails, explain the retrieval limitation."
            )
        return None
