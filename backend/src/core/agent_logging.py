"""LangChain callbacks: actual model/tool execution, including nested agent tools."""

import json
import logging
from collections.abc import Awaitable, Callable
from time import perf_counter

from langchain_core.callbacks import AsyncCallbackHandler

from src.core.logger import error_fields, log_event


class AgentLogHandler(AsyncCallbackHandler):
    run_inline = True

    def __init__(self, on_progress: Callable[[str], Awaitable[None]] | None = None):
        self.calls = {}
        self.on_progress = on_progress
        self.last_progress_stage = None

    async def report_progress(self, stage: str):
        if self.on_progress and stage != self.last_progress_stage:
            self.last_progress_stage = stage
            await self.on_progress(stage)

    def start(self, kind, run_id, parent_run_id, **fields):
        self.calls[str(run_id)] = (perf_counter(), fields)
        log_event(
            f"{kind}.start",
            run_id=str(run_id),
            parent_run_id=str(parent_run_id) if parent_run_id else None,
            **fields,
        )

    def finish(self, kind, run_id, error=None, **fields):
        started, initial = self.calls.pop(str(run_id), (perf_counter(), {}))
        log_event(
            f"{kind}.error" if error is not None else f"{kind}.end",
            level=logging.WARNING if error is not None else logging.INFO,
            run_id=str(run_id),
            **{k: v for k, v in initial.items() if k not in {"params", "input_str"}},
            duration_ms=round((perf_counter() - started) * 1000, 2),
            **(error_fields(error) if error is not None else {}),
            **fields,
        )
        return initial

    async def on_chat_model_start(
        self, serialized, messages, *, run_id, parent_run_id=None, **kwargs
    ):
        params = kwargs.get("invocation_params") or {}
        self.start(
            "model",
            run_id,
            parent_run_id,
            model=params.get("model") or params.get("model_name"),
            message_count=sum(len(batch) for batch in messages),
        )

    async def on_llm_end(self, response, *, run_id, **kwargs):
        usage = []
        for batch in response.generations:
            for generation in batch:
                message = getattr(generation, "message", None)
                if getattr(message, "usage_metadata", None):
                    usage.append(message.usage_metadata)
                for call in getattr(message, "tool_calls", []):
                    tool_name = call.get("name")
                    log_event(
                        "tool.requested",
                        run_id=str(run_id),
                        tool_call_id=call.get("id"),
                        tool=tool_name,
                        argument_count=len(call.get("args", {})) if isinstance(call.get("args"), dict) else None,
                    )
                    stage = {
                        "load_skill": "reviewing_method",
                        "web_search": "searching_sources",
                        "crawl_web_markdown": "reading_sources",
                    }.get(tool_name)
                    if stage:
                        await self.report_progress(stage)
        self.finish("model", run_id, usage=usage)

    async def on_llm_error(self, error, *, run_id, **kwargs):
        self.finish("model", run_id, error=error)

    async def on_tool_start(
        self, serialized, input_str, *, run_id, parent_run_id=None, inputs=None, **kwargs
    ):
        if inputs is None:
            try:
                inputs = json.loads(input_str)
            except (TypeError, ValueError):
                inputs = input_str
        self.start(
            "tool",
            run_id,
            parent_run_id,
            tool=(serialized or {}).get("name", kwargs.get("name", "unknown")),
            argument_count=len(inputs) if isinstance(inputs, dict) else None,
        )

    async def on_tool_end(self, output, *, run_id, **kwargs):
        content = getattr(output, "content", output)
        status = getattr(output, "status", "success")
        if isinstance(content, str):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    status = parsed.get("status", status)
            except ValueError:
                pass
        if str(content).lstrip().lower().startswith("error:"):
            status = "error"
        self.finish("tool", run_id, status=status, output_chars=len(str(content)))

    async def on_tool_error(self, error, *, run_id, **kwargs):
        self.finish("tool", run_id, error=error)
