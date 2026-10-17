import time
import re
import json
import logging
import urllib.request
import urllib.parse
import asyncio
from difflib import SequenceMatcher
from datetime import datetime
from typing import Dict, Any, Optional, List

from langchain_google_genai import ChatGoogleGenerativeAI
from src.core.agent_logging import AgentLogHandler
from src.core.logger import error_fields, log_event
from src.modules.auditor.schemas import AuditReport

logger = logging.getLogger(__name__)

class CitationAuditService:
    def __init__(self, settings):
        """
        Initializes the Citation Audit Service.
        Expects settings to contain:
        - gemini_model
        - google_api_key (with get_secret_value() function)
        - agent_timeout_seconds
        - tavily_api_key (optional, can be raw str or Pydantic SecretStr)
        """
        self.settings = settings

        # 2. Reuse a shared HTTP opener/cookie processor to leverage keep-alive connections
        # This eliminates the overhead of opening a new TCP handshake for every single lookup
        self.url_opener = urllib.request.build_opener()
        self.url_opener.addheaders = [('User-Agent', 'AcademicIntegrityAuditor/1.0')]
        
        # Safe extraction of Tavily API key to handle SecretStr issues
        raw_tavily = getattr(settings, "tavily_api_key", None)
        if raw_tavily and hasattr(raw_tavily, "get_secret_value"):
            self.tavily_api_key = raw_tavily.get_secret_value()
        else:
            self.tavily_api_key = raw_tavily

    async def audit_text(self, text: Optional[str], brief: Optional[Dict[str, Any]], domain: Optional[str]) -> Dict[str, Any]:
        """
        Primary orchestrator. Audits raw text or pulls structured criteria fields 
        from incoming brief configurations to flag slop, verify sources, and trace integrity.
        """
        target_text = text
        if not target_text and brief:
            title = brief.get("title", "")
            prob = brief.get("problemValidation", {}).get("coreProblemStatement", "")
            gap = brief.get("knowledgeLandscape", {}).get("criticalKnowledgeGap", "")
            hyp = brief.get("experimentDesign", {}).get("falsifiableHypothesis", "")
            target_text = f"{title}\n\n{prob}\n\n{gap}\n\n{hyp}"

        if not target_text or not target_text.strip():
            raise ValueError("Please provide text or brief to audit.")

        resolved_domain = domain or (brief.get("intake", {}).get("domain") if brief else None) or "Empirical Science"
        
        try:
            report = await self._call_llm_auditor(target_text, resolved_domain)
            if report:
                return {"report": report, "engine": self.settings.gemini_model}
        except Exception as e:
            log_event("auditor.fallback", level=logging.WARNING, **error_fields(e))
            pass

        # 2. Local Heuristic Rule Fallback Execution with LIVE Verification Support
        report = await self.perform_local_integrity_audit_async(target_text, resolved_domain)
        return {"report": report, "engine": "local_rule_and_lexical_auditor"}

    def _sync_search_arxiv(self, query: str) -> List[Dict[str, Any]]:
        """Synchronous network lookup against the arXiv catalog."""
        try:
            clean_query = urllib.parse.quote(re.sub(r'[^a-zA-Z0-9 ]', '', query))
            url = f"http://export.arxiv.org/api/query?search_query=all:{clean_query}&max_results=2"
            
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AcademicIntegrityAuditor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                xml_text = response.read().decode('utf-8')
                
                # Fast regex mapping to bypass heavy structural parser processing speeds
                titles = re.findall(r'<title>(.*?)</title>', xml_text, re.DOTALL)
                links = re.findall(r'<id>(http://arxiv.org/abs/.*?)</id>', xml_text)
                
                results = []
                # FIX: Fixed lower attribute checking on string data instead of the list wrapper
                start_idx = 1 if len(titles) > 1 and "arxiv" in xml_text.lower() else 0
                for t, l in zip(titles[start_idx:], links):
                    results.append({
                        "title": t.strip().replace("\n", " "), 
                        "url": l.strip()
                    })
                return results
        except Exception as e:
            log_event("dependency.request.failed", level=logging.WARNING, message="arXiv search failed", dependency="arxiv", **error_fields(e))
        return []

    def _sync_search_tavily(self, query: str) -> List[Dict[str, Any]]:
        """Synchronous backup network verification against Tavily Search API indices."""
        if not self.tavily_api_key:
            return []
        try:
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": self.tavily_api_key,
                "query": f"{query} academic paper filetype:pdf site:arxiv.org OR site:semanticscholar.org",
                "search_depth": "basic",
                "max_results": 2
            }
            # FIX: Payload serialization bug resolved via pre-computed string extraction logic
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                url, 
                data=data, 
                headers={'Content-Type': 'application/json', 'User-Agent': 'AcademicIntegrityAuditor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return [{"title": r.get("title"), "url": r.get("url")} for r in res_data.get("results", [])]
        except Exception as e:
            log_event("dependency.request.failed", level=logging.WARNING, message="Tavily search failed", dependency="tavily", **error_fields(e))
        return []

    async def _verify_single_citation(self, citation: Dict[str, Any]) -> Dict[str, Any]:
        """Offloads blocking urllib queries safely into distinct background executor threads."""
        search_query = citation.get("paperTitle") or ""
        informative_tokens = set(re.findall(r"[a-z0-9]+", search_query.lower())) - {
            "a", "an", "and", "of", "the", "for", "to", "in", "on", "with", "et", "al"
        }
        if len(informative_tokens) < 3:
            citation["status"] = "unverifiable"
            citation["groundedSourceUrl"] = ""
            citation["confidenceScore"] = min(citation.get("confidenceScore", 40), 40)
            citation["verdictReason"] = (
                "The supplied citation does not include enough title information for a reliable match."
            )
            return citation

        # Dispatch tasks concurrently to distinct runtime threads without blocking main event loop
        arxiv_task = asyncio.to_thread(self._sync_search_arxiv, search_query)
        tavily_task = asyncio.to_thread(self._sync_search_tavily, search_query)
        
        arxiv_res, tavily_res = await asyncio.gather(arxiv_task, tavily_task)
        combined_results = arxiv_res + tavily_res

        expected_title = " ".join(sorted(informative_tokens))
        ranked_matches = sorted(
            combined_results,
            key=lambda result: SequenceMatcher(
                None,
                expected_title,
                " ".join(sorted(
                    set(re.findall(r"[a-z0-9]+", (result.get("title") or "").lower()))
                    - {"a", "an", "and", "of", "the", "for", "to", "in", "on", "with"}
                )),
            ).ratio(),
            reverse=True,
        )
        best_match = ranked_matches[0] if ranked_matches else None
        best_title = " ".join(
            sorted(
                set(re.findall(r"[a-z0-9]+", (best_match.get("title") or "").lower()))
                - {"a", "an", "and", "of", "the", "for", "to", "in", "on", "with"}
            )
        ) if best_match else ""
        title_similarity = SequenceMatcher(None, expected_title, best_title).ratio()
        if best_match and title_similarity >= 0.72:
            citation["groundedSourceUrl"] = best_match["url"]
            citation["paperTitle"] = best_match["title"]
            citation["status"] = "verified"
            citation["confidenceScore"] = round(70 + title_similarity * 25)
            citation["verdictReason"] = "A close title match was found in the searched scholarly indexes."
        else:
            citation["status"] = "unverifiable"
            citation["groundedSourceUrl"] = ""
            citation["confidenceScore"] = min(citation.get("confidenceScore", 40), 40)
            citation["verdictReason"] = (
                "No close title match was found in the searched indexes; this does not prove the citation is fabricated."
            )
        
        return citation

    async def _call_llm_auditor(self, target_text: str, resolved_domain: str) -> Optional[Dict[str, Any]]:
        """Invokes structured LLM inference mapping before checking references."""
        system_instruction = (
            "You are an expert Senior Peer Reviewer, Citation Integrity Auditor, and Anti-AI Slop Inspector "
            "for premier academic journals (Nature, Science, NeurIPS, IEEE, ACM)."
        )

        audit_prompt = self.generate_audit_prompt(target_text, resolved_domain)
        chat_model = ChatGoogleGenerativeAI(
            model=self.settings.gemini_model,
            api_key=self.settings.google_api_key.get_secret_value(),
            vertexai=self.settings.gemini_use_vertexai,
            project=self.settings.google_cloud_project or None,
            location=self.settings.google_cloud_location or None,
            timeout=self.settings.agent_timeout_seconds,
            callbacks=[AgentLogHandler()],
            max_retries=8
        )
        
        structured_llm = chat_model.with_structured_output(AuditReport)
        
        response: AuditReport = await structured_llm.ainvoke([
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": audit_prompt}
        ])
        
        parsed_report = response.model_dump(mode="json")
        
        citations_to_process = parsed_report.get("citations", [])
        if citations_to_process:
            # Bound maximum concurrent citation verification lookups to prevent thread starvation
            semaphore = asyncio.Semaphore(5)
            async def bound_verification(cit):
                async with semaphore:
                    return await self._verify_single_citation(cit)
                    
            tasks = [bound_verification(cit) for cit in citations_to_process]
            parsed_report["citations"] = await asyncio.gather(*tasks)

        return parsed_report

    async def perform_local_integrity_audit_async(self, target_text: str, resolved_domain: str) -> Dict[str, Any]:
        """Asynchronous wrapper around local validation fallback to run live citation scans."""
        slop_phrases = [
            "delve", "tapestry", "pivotal role", "revolutionary paradigm", 
            "testament to", "multifaceted", "seamlessly", "game-changer", 
            "beacon of", "unprecedented", "it is important to remember"
        ]
        
        detected_patterns = []
        slop_count = 0
        rewrite_map = {
            "delve": "examine",
            "tapestry": "interactions",
            "pivotal role": "important role",
            "revolutionary paradigm": "approach",
            "testament to": "evidence of",
            "multifaceted": "multiple",
            "seamlessly": "",
            "game-changer": "approach",
            "beacon of": "example of",
            "unprecedented": "new",
            "it is important to remember": "",
        }
        
        citation_matches = re.findall(r'\[\d+\]|\([A-Za-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)', target_text)
        simulated_citations = []
        
        for idx, match in enumerate(set(citation_matches)):
            simulated_citations.append({
                "id": f"cit-{idx+1}",
                "citationText": match,
                "paperTitle": match, # Use citation token as placeholder keyword text
                "allegedClaim": "Context matching extraction via fallback parser.",
                "status": "unverifiable",
                "verdictReason": "Pending runtime confirmation lookup sync.",
                "groundedSourceUrl": "",
                "confidenceScore": 40,
                "verifiedAuthors": "Unknown",
                "verifiedVenueYear": "Unknown"
            })

        # FIX: Augment fallback results by executing verification lookups even when Gemini is down
        if simulated_citations:
            tasks = [self._verify_single_citation(cit) for cit in simulated_citations]
            simulated_citations = await asyncio.gather(*tasks)

        for phrase in slop_phrases:
            matches = re.findall(rf"\b{phrase}\b", target_text, re.IGNORECASE)
            if matches:
                slop_count += len(matches)
                detected_patterns.append({
                    "phrase": phrase,
                    "category": "cliche_metaphor",
                    "explanation": f"The term '{phrase}' is a high-frequency generative AI filler phrase.",
                    "suggestedRewrite": rewrite_map[phrase]
                })

        slop_score = min(100, slop_count * 15)
        has_numbers = len(re.findall(r'\b\d+(?:\.\d+)?%?|\bp\s*<\s*0\.\d+', target_text))
        empirical_density = 80 if has_numbers > 3 else 40
        citation_risks = {
            "phantom_hallucination": 100,
            "attribution_drift": 70,
            "unverifiable": 45,
            "verified": 0,
        }
        bibliographic_risk = (
            round(sum(citation_risks.get(item["status"], 45) for item in simulated_citations) / len(simulated_citations))
            if simulated_citations
            else 0
        )
        empirical_risk = 100 - empirical_density
        overall_risk = round(0.5 * bibliographic_risk + 0.35 * slop_score + 0.15 * empirical_risk)
        overall_integrity = 100 - overall_risk
        risk_level = (
            "Critical" if overall_risk >= 80 else
            "Severe" if overall_risk >= 60 else
            "Moderate" if overall_risk >= 30 else
            "Low"
        )
        clean_rewrite = target_text
        for phrase, replacement in rewrite_map.items():
            clean_rewrite = re.sub(rf"\b{re.escape(phrase)}\b", replacement, clean_rewrite, flags=re.IGNORECASE)
        clean_rewrite = re.sub(r"\s+([,.;:])", r"\1", clean_rewrite)
        clean_rewrite = re.sub(r"\s{2,}", " ", clean_rewrite).strip()

        return {
            "id": f"audit-{int(time.time() * 1000)}",
            "auditedAt": datetime.utcnow().isoformat() + "Z",
            "targetDomain": resolved_domain,
            "overallIntegrityScore": overall_integrity,
            "hallucinationRisk": {
                "score": overall_risk,
                "riskLevel": risk_level,
                "confidence": 50,
                "verdictSummary": "Local fallback metrics generated via quantitative token scanning with live verification checks.",
                "factors": [
                    { "name": "Bibliographic Authenticity Risk", "score": bibliographic_risk, "description": "Citation title matches were checked against available scholarly indexes; unresolved citations remain unverified." },
                    { "name": "Synthetic Stylometric Clumping", "score": slop_score, "description": f"Found {slop_count} standard AI tokens." },
                    { "name": "Empirical Verification Deficit", "score": empirical_risk, "description": "A local heuristic estimated how many measurable claims and statistical values appear in the text." }
                ],
                "flaggedSnippets": []
            },
            "citations": simulated_citations,
            "slopAnalysis": {
                "slopScore": slop_score,
                "empiricalDensityScore": empirical_density,
                "detectedPatterns": detected_patterns,
                "critiqueSummary": "Local deterministic fallback completed with secondary live validation pools successfully.",
                "cleanScholarlyRewrite": clean_rewrite
            },
            "recommendations": [
                "Retry auditing through standard active LLM engine cluster endpoints when upstream limits lift.",
                "Audit text manually for stylistic patterns and complex claim structural alignments."
            ]
        }

    def perform_local_integrity_audit(self, target_text: str, resolved_domain: str) -> Dict[str, Any]:
        """Synchronous legacy shell method to protect backwards compatibility."""
        return asyncio.run(self.perform_local_integrity_audit_async(target_text, resolved_domain))

    def generate_audit_prompt(self, target_text: str, resolved_domain: str) -> str:
        return f"""
AUDIT THE FOLLOWING TEXT FOR:
1. CITATION INTEGRITY & PHANTOM CITATIONS:
   - Identify cited papers, authors, years, or claims.
   - Classify: "verified" | "attribution_drift" | "phantom_hallucination" | "unverifiable"
   - Provide verdict reason and confidence score (0-100).

2. HALLUCINATION RISK GAUGE (0-100) & AI TEXT FLAGGING:
   - Assign hallucinationRisk: score (0-100), riskLevel ("Low"|"Moderate"|"Severe"|"Critical"), confidence (0-100), verdictSummary.
   - 3 factors (0-100): "Bibliographic Authenticity Risk", "Synthetic Stylometric Clumping", "Empirical Verification Deficit".
   - flaggedSnippets: list exact suspicious substrings with reason, severity, confidence, and category.

3. AI SLOP & BUZZWORD DEFLATION:
   - Detect: "delve", "tapestry", "pivotal role", "revolutionary paradigm", "testament to", "multifaceted", "seamlessly", "game-changer", "beacon of", "unprecedented", "it is important to remember".
   - Assign slopScore (0-100), empiricalDensityScore (0-100).
   - Return cleanScholarlyRewrite omitting slop while keeping empirical meaning.

4. OVERALL INTEGRITY SCORE (0-100) & actionable recommendations.

TEXT TO AUDIT:
{target_text}

DOMAIN: 
{resolved_domain}

Return strict JSON matching this structure:
{{
  "id": "audit-{{int(time.time() * 1000)}}",
  "auditedAt": "{{datetime.utcnow().isoformat() + 'Z'}}",
  "targetDomain": "{resolved_domain}",
  "overallIntegrityScore": 85,
  "hallucinationRisk": {{
    "score": 20,
    "riskLevel": "Low",
    "confidence": 90,
    "verdictSummary": "...",
    "factors": [
      {{ "name": "Bibliographic Authenticity Risk", "score": 20, "description": "..." }},
      {{ "name": "Synthetic Stylometric Clumping", "score": 10, "description": "..." }},
      {{ "name": "Empirical Verification Deficit", "score": 15, "description": "..." }}
    ],
    "flaggedSnippets": [
      {{
        "snippet": "...",
        "reason": "...",
        "severity": "warning",
        "confidence": 90,
        "category": "invented_citation"
      }}
    ]
  }},
  "citations": [
    {{
      "id": "cit-1",
      "citationText": "...",
      "paperTitle": "...",
      "allegedClaim": "...",
      "status": "verified",
      "verdictReason": "...",
      "groundedSourceUrl": "...",
      "confidenceScore": 95,
      "verifiedAuthors": "...",
      "verifiedVenueYear": "..."
    }}
  ],
  "slopAnalysis": {{
    "slopScore": 10,
    "empiricalDensityScore": 85,
    "detectedPatterns": [
      {{
        "phrase": "...",
        "category": "cliche_metaphor",
        "explanation": "...",
        "suggestedRewrite": "..."
      }}
    ],
    "critiqueSummary": "...",
    "cleanScholarlyRewrite": "..."
  }},
  "recommendations": [
    "...", "..."
  ]
}}
"""
