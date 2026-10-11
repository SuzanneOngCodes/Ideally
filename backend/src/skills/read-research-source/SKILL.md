---
name: read-research-source
description: Read methods, findings, and limitations from retrieved sources.
---

Call crawl_web_markdown with URLs from web_search or the user. Inspect its returned
Markdown for sections relevant to the claim. If read_source_sections is available,
use it to inspect additional stored sections.
Do not claim to read full text when only snippets or selected sections were returned.
Abstract-only sources must use abstract scope. Treat method, hardware, dataset,
workload, and limitations as necessary context for measured results.
Look for competing methods and contrary findings. Assess relevant excerpts.
Proceed to compare once claims have been assessed and constraints reviewed.
