# Ideally — Product Overview and Demo Scenario

> Working name: Ideally. This document consolidates decisions from the project discussion. It is a working concept document, not a validated market study or a scientific literature review.

## 1. Core idea

Ideally is an AI research advisor that helps users explore, select, and explain why a research direction is worth pursuing—based on real-world problems, evidence, and practical constraints.

Users may start with no research idea, or with an observation and an early hypothesis. Ideally helps them validate the problem, understand existing knowledge, compare possible directions, and define how the idea could be tested.

The primary output is an **evidence-backed research brief**, not generated code or a list of topic titles. The product can support both capstone projects and academic research; the MVP prioritizes research reasoning and experiment design.

## 2. User problem

- Difficulty expressing an interest clearly enough to search for useful information.
- Too much information, but not enough structure for deciding which direction to pursue.
- Uncertainty about whether a personal observation reflects a broader problem.
- Difficulty reading papers, understanding methods, and identifying limitations.
- Difficulty connecting a real-world problem to a research question, hypothesis, and feasible test.

## 3. Initial audience and scope

- Initial test group: computer science students looking for a capstone or research topic.
- Initial problem area: practical challenges faced by software developers, software users, and software teams.
- The product supports both beginners and experienced users. Accessible explanations are the default presentation style, not a limit on depth.
- Beginners receive examples, terminology, and foundational method explanations. Experienced users can go directly to sources, limitations, hypotheses, and experimental design.
- Other disciplines are a potential expansion area, not an MVP priority.

## 4. Evidence principles

**AI must verify the problem before recommending a specific research direction.**

1. Treat the user's observation as something to investigate, not as an established fact.
2. Search scientific papers, technical reports, public datasets, and trustworthy news sources. Prefer primary sources.
3. Community reports, issues, and discussions may signal a problem, but do not by themselves prove its prevalence.
4. Every empirical claim must be traceable to supporting source content, including its date, context, scope, and limitations.
5. Distinguish evidence that a problem exists, evidence of prevalence, evidence of causes, and evidence that a solution works.
6. Look for both supporting and contradictory findings. Do not search only for evidence that confirms the user's idea.
7. Clearly separate source-supported information, AI inference, and proposed hypotheses.
8. A lack of literature does not prove that a problem does not exist or that an idea is novel. When evidence is insufficient, keep the claim uncertain and suggest narrowing the scope or gathering more data.
9. Never fabricate sources, statistics, or experimental results. If only an abstract was reviewed, state that explicitly.
10. Illustrations are not evidence. Simulated content must be clearly labelled.

“Defending the reason for choosing a direction” includes the ability to revise or abandon that direction when evidence does not support it.

## 5. Product experience

### Two working areas

**Left — Conversation**

Explore interests, skills, time, resources, and accessible data; clarify observations; explain papers and terminology; challenge assumptions; and adjust the direction.

**Right — Research map and evidence**

The main reasoning chain is **Problem → Evidence → Research question → Hypothesis → Experiment**.

- Linked cards show the reasoning structure without requiring a complex drag-and-drop canvas.
- Each card includes sources, limitations, and a status: source-supported, AI-inferred, hypothesis, or insufficient evidence.
- Selecting a card opens its explanation, relevant source excerpts, and diagrams.
- The map updates as the conversation and research develop, showing when evidence changes a direction.

Visuals may include a problem story, a mechanism diagram, and comparison tables. Expected outcomes must be labelled as hypotheses, not achieved results.

After context is clarified, required research verifies the problem and reviews existing approaches before a recommendation. A “Find evidence” action on each card supports on-demand investigation. Results are summarized by default, with expandable details for each source's method, findings, and limitations.

## 6. Main workflow

1. **Understand the starting point:** determine whether the user has no idea, an observation, or an early direction; clarify constraints.
2. **Clarify the context:** identify affected users, task, and difficulty. Use concrete situations when the user has no idea.
3. **Verify the problem:** search sources and determine what level of impact can be supported.
4. **Review existing knowledge:** identify methods already tried, results, and limitations.
5. **Compare directions:** connect each direction to the problem, evidence, hypothesis, and practical constraints.
6. **Design the test:** define comparisons, data, measures, controls, and results that would weaken or disprove the hypothesis.
7. **Create the research brief:** preserve the reasoning, unresolved questions, and next steps.

## 7. Session output

The session should produce the problem and context; evidence and its limits; a research question and rationale; existing approaches and limitations; the selected direction and alternatives; feasibility; an experiment outline; a source list; explicit AI inferences; and open questions.

## 8. Demo case: LLM classification latency

> This case demonstrates how the product works. It does not limit Ideally to LLM optimization. The technical claims below are inputs or hypotheses that must be researched.

A student asks: “I notice that LLMs return results token by token. Does that make classification or recommendation slow? Could a simpler model return the result all at once?”

The advisor separates observation from conclusion and asks: for which task is latency a problem; how much latency comes from output generation; whether “all at once” means display or computation; and what specialized solutions already exist. Software support-ticket classification may be selected as one concrete context. The initial map marks claims as **insufficient evidence**.

The product then searches for measured evidence, models, datasets, hardware, real-world impact, prevalence, causes, and appropriate baselines. It shows supporting and contradictory sources and does not use article count as a proxy for prevalence. If evidence is insufficient, it stops short of a conclusion, narrows the context, or recommends data collection.

Only after relevant evidence is found might it form a question such as:

> “Under a defined dataset and experimental environment, can a specialized classification method reduce latency compared with a selected LLM baseline while still meeting the required quality threshold?”

This is not a claim of novelty. The product must identify what has already been studied, what remains testable, and why it is worth investigating. The experiment should define data, baselines, quality and latency measures, hardware, workload, fair measurement procedures, and results that would support or reject the hypothesis.

### Three-minute demo script

| Time | Content |
|---|---|
| 0:00–0:25 | Enter an unclear observation; separate assumptions and ask for context. |
| 0:25–1:05 | Verify the problem; open sources and evidence limitations. |
| 1:05–1:35 | Update the map and mechanism diagram; revise the observation if needed. |
| 1:35–2:15 | Compare evidence-backed directions; investigate further with “Find evidence.” |
| 2:15–3:00 | Show the research brief and testing plan; export the document. |

Waiting time may be shortened in the video, but the demo must remain transparent. Sources must be real and checked, not placeholders presented as real data.

For a user with no idea, Ideally explores interests and constraints, presents concrete situations, verifies the selected problem, and follows the same evidence-first workflow. It does not return a list of topics claimed to be novel or important without support.

## 9. MVP scope and resources

One person, approximately two weeks, four hours per day: about 56 hours. Prioritize one complete journey from a vague idea to a sourced research brief.

**In the MVP:** conversation, linked-card research map, required verification, on-demand evidence search, sources and claim statuses, basic visualizations, research-brief export, and bibliography.

**Later:** complex canvas, multi-user collaboration, every discipline, end-to-end research support, automated experiments, complete paper writing, and deep integrations.

## 10. Google and competition value

NotebookLM already supports source exploration, Deep Research, and mind maps; Gemini Deep Research supports planning and synthesis. Chat, maps, and document search alone are therefore not sufficient differentiation.

The differentiation to validate is helping users select a research direction by connecting a real-world problem, evidence, reasoning, and practical constraints—and tracking how evidence changes the decision.

Ideally can complement **NotebookLM** by exporting a research brief and source list for deeper reading. The MVP may export a document for users to import themselves and does not assume a direct API integration.

Potential competition theme: **Future of Work & Enterprise Productivity**, focused on access to knowledge and research decision-making. The prototype must work, use appropriate AI technology, meet the competition requirements, and deploy on Cloud Run or Firebase. Technology, model, and search mechanism are not yet finalized.

References reviewed:

- [AI Builder Cup — Themes and requirements](https://aibuildercup.com/themes.html)
- [NotebookLM — Deep Research and source types](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/)
- [NotebookLM — Mind Maps guide](https://support.google.com/notebooklm/answer/16246230?hl=en)
- [Gemini Apps — Deep Research](https://support.google.com/gemini/answer/15719111?hl=en)

These references support product and competition descriptions; they are not scientific evidence for the LLM case.

## 11. MVP evaluation criteria

- Users can explain what they want to research, why it matters, and how to test it.
- Important claims can be traced to sources that support them.
- The product identifies unsupported assumptions and changes direction when contradictory evidence appears.
- Users distinguish facts, inferences, hypotheses, and unresolved questions.
- Recommended directions fit practical constraints, not just intellectual appeal.
- Matched cases compare Ideally with using Gemini or NotebookLM directly. No improvement target should be claimed before testing.

## 12. Open decisions

- Search sources, paper-content retrieval, and handling inaccessible documents.
- A technical scope small enough to complete within the available time.
- The balance between generated visuals and diagrams or information cards.
- Export format and handoff to NotebookLM.
- Test-user recruitment and evaluation of evidence-based advisory quality.