# Logging backend

Backend uses one root logging configuration from `src.core.logger`, initialized by `create_app()` in `src.main`. FastAPI is the HTTP framework. All output goes to stdout as one JSON object per line; modules must not add handlers or configure logging.

## Schema

Every record has `timestamp`, `level`, `service`, `trace_id`, `event`, `message`, and `context`. Timestamp is UTC ISO 8601 with millisecond precision. `service` defaults to `ideally-api` and can be set with `SERVICE_NAME`. Set the minimum level with `LOG_LEVEL` (`DEBUG`, `INFO`, `WARNING`, `ERROR`, or `CRITICAL`; default `INFO`). Python loggers obtained with `logging.getLogger(__name__)` are formatted by the same root formatter. Prefer `log_event(event, message=..., **context)` for stable event names.

```json
{"timestamp":"2026-10-13T03:20:30.123Z","level":"INFO","service":"ideally-api","trace_id":"tr_8f21","event":"http.request.started","message":"Bắt đầu xử lý request","context":{"method":"POST","path":"/api/chat"}}
```

## Request correlation

The HTTP middleware accepts `X-Trace-ID` only when it is 1–128 ASCII letters, digits, `.`, `_`, or `-`; otherwise it creates `tr_<uuid>`. It places the ID in a `ContextVar`, so events from routers, services, agent callbacks, and dependencies inherit it without passing it to every log call. The response includes `X-Trace-ID`, and CORS allows and exposes this header. For background work, copy the context or pass the trace ID explicitly; standalone jobs should create their own ID.

## Events and levels

Use stable lowercase dotted event names such as `http.request.started`, `http.request.completed`, `http.request.failed`, `chat.message.received`, `chat.response.completed`, `agent.run.started`, `agent.run.completed`, `agent.run.failed`, `research.workflow.started`, and `dependency.request.failed`. Add only useful metadata such as method, path, status, duration, internal IDs, provider/model names, counts, and safe error types. Use DEBUG for diagnostic detail, INFO for meaningful successful milestones, WARNING for recoverable anomalies, ERROR for failed operations, and CRITICAL when required application functionality cannot start.

## Privacy and exceptions

Never log credentials, authorization headers, cookies, request bodies, prompts, conversation text, or user documents. Agent callbacks record tool/model names and counts, not arguments or returned content. The common sanitizer redacts secret-like keys and bearer credentials, but callers remain responsible for not passing sensitive values. At the layer that handles an exception, log a safe error type/status and include a stack trace only when needed for diagnosis. Do not log and rethrow the same exception at every layer; API responses must not contain internal stack traces.

To add an event, call `log_event("object.action.result", message="Short description", useful_field=value)`. Do not create module-specific handlers or configure the root logger outside `configure_logging()`.
