from fastapi.testclient import TestClient

from src.core.config import Settings
from src.main import create_app
from src.modules.defense.schemas import DefenseEvaluation, DefenseProbe, DefenseProbesResponse
from src.modules.defense.service import DefenseLabService


class FakeDefenseService:
    async def generate_probes(self, brief, saved_research=None):
        return DefenseProbesResponse(
            probes=[
                DefenseProbe(
                    id=f"probe-{index}",
                    persona=f"Reviewer {index}",
                    probingTopic="Methodological validity",
                    question=f"How will you test assumption {index}?",
                    exampleAnswers=["State the control and measurement."],
                )
                for index in range(1, 4)
            ]
        )

    async def evaluate_defense(self, brief, probe, answer, saved_research=None):
        return DefenseEvaluation(
            strengthScore=7,
            strengths=["The answer identifies a measurable control."],
            vulnerabilities=["The sample size remains unspecified."],
            advisorTip="State how you will choose the sample size before testing.",
        )


def test_defense_context_prefers_active_session_research_over_stale_brief():
    brief = {
        "title": "LLM inference latency",
        "intake": {"domain": "Large language models"},
        "experimentDesign": {
            "primaryResearchQuestion": "How fast is LLM inference?",
            "falsifiableHypothesis": "Quantization reduces latency.",
        },
    }
    session_research = {
        "title": "Software System Design",
        "summary": "Study tradeoffs in distributed system architecture.",
        "reasoning_map": {
            "problem": {"title": "System design tradeoffs"},
            "research_question": {"title": "How do architecture choices affect reliability?"},
        },
    }

    context = DefenseLabService._research_context(brief, session_research)

    assert context["title"] == "Software System Design"
    assert context["summary"] == session_research["summary"]
    assert context["research_map"] == session_research["reasoning_map"]
    assert "domain" not in context
    assert "LLM inference latency" not in str(context)


def test_defense_context_uses_brief_when_no_session_research():
    context = DefenseLabService._research_context(
        {"title": "LLM inference latency", "intake": {"domain": "LLM"}}, None
    )

    assert context["title"] == "LLM inference latency"
    assert context["domain"] == "LLM"

def test_defense_api_generates_probes_and_evaluates_answer(tmp_path):
    settings = Settings(_env_file=None, database_url=f"sqlite:///{tmp_path / 'defense.db'}")
    app = create_app(settings)
    app.state.defense = FakeDefenseService()

    with TestClient(app) as client:
        generated = client.post(
            "/api/v1/defense/probes",
            json={"brief": {"title": "Latency study"}},
        )
        assert generated.status_code == 200
        assert len(generated.json()["probes"]) == 3

        evaluated = client.post(
            "/api/v1/defense/evaluate",
            json={
                "brief": {"title": "Latency study"},
                "probe": generated.json()["probes"][0],
                "answer": "We will compare the systems under a preregistered workload.",
            },
        )
        assert evaluated.status_code == 200
        assert evaluated.json()["strengthScore"] == 7
        assert evaluated.json()["vulnerabilities"]
