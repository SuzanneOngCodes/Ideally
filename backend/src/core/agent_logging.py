"""LangChain callbacks: actual model/tool execution, including nested agent tools."""

import json
import logging
from time import perf_counter

from langchain_core.callbacks import AsyncCallbackHandler

from src.core.logger import error_fields, log_event


class AgentLogHandler(AsyncCallbackHandler):
    run_inline = True

    def __init__(self):
        self.calls = {}

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
            **{k: v for k, v in initial.items() if k != "params"},
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
                    log_event(
                        "tool.requested",
                        run_id=str(run_id),
                        tool_call_id=call.get("id"),
                        tool=call.get("name"),
                        params=call.get("args"),
                    )
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
            params=inputs,
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
        initial = self.finish("tool", run_id, status=status, output_chars=len(str(content)))
        params = initial.get("params")
        path = params.get("file_path", "") if isinstance(params, dict) else ""
        if (
            initial.get("tool") == "read_file"
            and path.startswith("/skills/")
            and path.endswith("/SKILL.md")
        ):
            # A returned filesystem error is not a successful skill load.
            failed = status == "error" or str(content).lstrip().lower().startswith("error")
            log_event(
                "skill.load.error" if failed else "skill.loaded",
                run_id=str(run_id),
                skill=path.split("/")[-2],
                path=path,
                source="read_file",
                scope="requested_lines",
            )

    async def on_tool_error(self, error, *, run_id, **kwargs):
        self.finish("tool", run_id, error=error)
