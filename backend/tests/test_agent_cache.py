import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from time import time

from src.core.agent import AgentService
from src.core.agent_cache import AgentReplyCache
from src.core.config import Settings
from src.modules.research.schemas import AgentReply


def test_cache_normalizes_question_and_keeps_conversation_context(tmp_path):
    history = [
        {"role": "user", "content": "Explain latency"},
        {"role": "assistant", "content": "Earlier context"},
        {"role": "user", "content": "  SAME   question?  "},
    ]
    repeated = [
        *history,
        {"role": "assistant", "content": "Previous answer"},
        {"role": "user", "content": "same question?"},
    ]
    models = ["primary", "fallback"]

    first_key = AgentReplyCache.make_key(history, False, models)
    repeated_key = AgentReplyCache.make_key(repeated, False, models)
    changed_context_key = AgentReplyCache.make_key(
        [{"role": "user", "content": "Different context"}, history[-1]], False, models
    )

    assert first_key == repeated_key
    assert first_key != changed_context_key


def test_concurrent_cache_writes_always_leave_valid_json(tmp_path):
    cache = AgentReplyCache(tmp_path)
    values = [{"answer": f"answer-{index}"} for index in range(64)]

    with ThreadPoolExecutor(max_workers=16) as writers:
        list(writers.map(lambda value: cache.set("same-key", value), values))

    stored = cache.get("same-key")
    assert stored in values
    entry = json.loads((tmp_path / "same-key.json").read_text(encoding="utf-8"))
    assert entry["reply"] == stored
    assert not list(tmp_path.glob("*.tmp"))


def test_cache_expired_or_disabled_entries_are_misses(tmp_path):
    cache = AgentReplyCache(tmp_path, ttl_seconds=60)
    cache.set("expired", {"answer": "old answer"})
    expired_path = tmp_path / "expired.json"
    entry = json.loads(expired_path.read_text(encoding="utf-8"))
    entry["created_at"] = time() - 120
    expired_path.write_text(json.dumps(entry), encoding="utf-8")
    assert cache.get("expired") is None

    cache = AgentReplyCache(tmp_path, ttl_seconds=0)
    cache.set("disabled", {"answer": "never stored"})

    assert cache.get("disabled") is None
    assert not (tmp_path / "disabled.json").exists()


def test_agent_reuses_cached_reply_and_streams_it_again(tmp_path):
    async def check():
        service = AgentService(
            Settings(
                _env_file=None,
                GOOGLE_API_KEY="test-key",
                agent_reply_cache_dir=tmp_path,
            )
        )

        async def research_route(history):
            from src.core.agent import RouteDecision

            return RouteDecision(route="research")

        service._route = research_route
        calls = 0

        async def run_reply(history, research, progress_callback=None):
            nonlocal calls
            calls += 1
            return AgentReply(answer="Cached answer")

        service._run_reply = run_reply
        history = [{"role": "user", "content": "What is latency?"}]
        await service.reply(history, False)
        streamed = []

        async def collect_token(token):
            streamed.append(token)

        repeated_history = [
            *history,
            {"role": "assistant", "content": "Cached answer"},
            {"role": "user", "content": "what   is latency?"},
        ]
        result = await service.reply(
            repeated_history,
            False,
            answer_token_callback=collect_token,
        )

        assert calls == 1
        assert result.answer == "Cached answer"
        assert "".join(streamed) == result.answer

    asyncio.run(check())
