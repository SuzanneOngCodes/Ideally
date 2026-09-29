# Ideally — AI Research Advisor

> **Formulate, Validate & Defend Research Directions**  
> An evidence-backed research advisor and adversarial defense laboratory that helps researchers, graduate students, and capstone engineers validate real-world problems, navigate literature gaps, compare Pareto trade-offs, and design empirical experiments before writing code.

---

## 📖 Overview

Many research projects suffer from _"solutions in search of a problem"_, ungrounded empirical claims, or brittle methodology that collapses under peer review. **Ideally** acts as a senior academic co-advisor and adversarial reviewer committee. It guides researchers through a systematic, 5-stage discovery process and stress-tests their proposals against harsh academic scrutiny before they commit months to implementation.

Built on Google's **Gemini 3.8 Flash** model and grounded with real-time academic paper indexes (arXiv, Semantic Scholar), Ideally enforces strict scientific epistemics: separating established facts from AI inferences and testable hypotheses.

---

## ✨ Key Features

- **🧭 Interactive Research Workspace**: Split-screen canvas featuring a live Socratic dialogue on the left and an editable 5-card reasoning chain on the right:
  1. _Core Problem Statement & Severity_
  2. _Evidence Base & Literature Precedents_
  3. _Core Hypothesis & Proposed Mechanism_
  4. _Pareto Trade-offs & Baseline Comparisons_
  5. _Falsification Criteria & Experimental Protocol_
- **🛡️ Socratic Defense Lab (Reviewer #2 Simulation)**: Adversarial peer-review simulation with configurable reviewer personas (_Methodology Purist_, _Novelty Skeptic_, _Industry Pragmatist_). Probes vulnerabilities, demands boundary conditions, and scores researcher defenses on defensibility rubrics.
- **🔍 Evidence Auditor & Epistemic Classifier**: Automated citation and claim auditor that verifies claims against primary literature, flagging ungrounded assertions, community signals mistaken for statistical proof, and confirmation bias.
- **📚 Academic Literature Search**: Built-in discovery engine querying arXiv and Semantic Scholar APIs with automated BibTeX citation generation.
- **🌱 Dual Audience Depth Modes**: Instant toggling between **Beginner / Capstone** (plain-English intuition, scaffolded explanations, terminology glossary) and **Experienced / Academic** (formal epistemic notation, p-value thresholds, Pareto trade-off frontiers).
- **🌏 Multilingual & APAC Localization**: Full real-time translation for Vietnamese (Tiếng Việt), Japanese (日本語), Traditional Chinese (繁體中文), Simplified Chinese (简体中文), Korean (한국어), English, and more.
- **📄 Complete Export Options**: One-click download of the complete structured research brief in clean GitHub-flavored Markdown with complete BibTeX citations.

---

## 🏗️ Architecture & Tech Stack

Ideally is built as a single-process, full-stack TypeScript application:

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion.
- **Build Tooling**: Vite 8 with `@tailwindcss/vite` and `@vitejs/plugin-react`.
- **Backend**: Node.js 22, Express 4.21, `tsx`.
- **AI Engine**: Official `@google/genai` TypeScript SDK (`gemini-3.8-flash` with automatic fallback to `gemini-flash-latest` and `gemini-3.1-flash-lite`).
- **External APIs**: Semantic Scholar Academic Graph API, arXiv Query API, Google Cloud Translation API.

```
┌────────────────────────────────────────────────────────┐
│        Client: React 19 + Tailwind CSS v4 SPA          │
└───────────────────────────┬────────────────────────────┘
                            │ JSON over HTTP REST (/api/*)
┌───────────────────────────▼────────────────────────────┐
│      Server: Express 4.21 + Vite Middleware (Node 22)  │
└───────────────────────────┬────────────────────────────┘
                            │ Authorized Server-to-Server
┌───────────────────────────▼────────────────────────────┐
│   Google GenAI SDK (Gemini) + arXiv / Semantic Scholar  │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: `v20.0.0` or higher (`v22+` recommended)
- **npm**: `v9.0.0` or higher
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

---

## ⚙️ Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and configure your API keys:

   ```env
   # Required: Gemini API Key for research synthesis and defense simulations
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # Server Port (Default is 3000)
   PORT=3000

   # App URL (Used for callbacks and internal references)
   APP_URL="http://localhost:3000"

   # (Optional) Semantic Scholar API Key for higher rate limits on literature search
   SEMANTIC_SCHOLAR_API_KEY=""

   # (Optional) Google Cloud Translation API Key
   # If left blank, Gemini-powered neural translation is used automatically
   GOOGLE_CLOUD_TRANSLATION_API_KEY=""
   ```

> 🔒 **Security Note**: The `GEMINI_API_KEY` is loaded strictly on the Express backend via `dotenv` and is never exposed to the client-side browser bundle.

---

## 🚀 Running the Application

### 1. Development Mode

In development mode, `tsx` runs `server.ts` with Vite's development middleware mounted. This provides instantaneous Hot Module Replacement (HMR) and live TypeScript execution without needing a separate compilation step.

```bash
# 1. Install all dependencies
npm install --legacy-peer-deps

# 2. Start the unified development server
npm run dev
```

Once started, open your browser and navigate to:

```
http://localhost:3000
```

---

### 2. Production Mode

In production mode, the React frontend is compiled into optimized static assets (`dist/`), and Express serves the compiled bundle alongside the `/api/*` endpoints.

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Build the production frontend assets
npm run build

# 3. Start the production server
NODE_ENV=production npm start
```

Or run via `node`:

```bash
NODE_ENV=production node server.ts
```

The production application will be listening on:

```
http://0.0.0.0:3000
```

---

## 🛠️ Available Scripts

| Command           | Description                                                           |
| :---------------- | :-------------------------------------------------------------------- |
| `npm run dev`     | Launches the Express server and Vite in development mode on port 3000 |
| `npm run build`   | Compiles the React SPA using Vite into the `dist/` directory          |
| `npm start`       | Launches the production Node server (`node server.ts`)                |
| `npm run lint`    | Runs TypeScript static type checking (`tsc --noEmit`)                 |
| `npm run preview` | Previews the built `dist/` bundle locally using Vite's preview server |
| `npm run clean`   | Deletes the `dist/` build output folder                               |

---

## 📁 Project Structure

```text
├── server.ts                    # Express backend, Gemini API routes, paper search proxy
├── index.html                   # HTML entry point with metadata and fonts
├── vite.config.ts               # Vite 8 configuration with React & Tailwind plugins
├── package.json                 # Dependencies and execution scripts
├── .env.example                 # Template for environment variables
├── metadata.json                # AI Studio application metadata
└── src/
    ├── main.tsx                 # React application mounting point
    ├── App.tsx                  # Root layout, navigation router & modal controllers
    ├── index.css                # Tailwind CSS v4 entry point & design tokens
    ├── context/
    │   └── LanguageContext.tsx  # APAC / Global translation and i18n state
    ├── types/
    │   └── research.ts          # Core TypeScript interfaces (Brief, Cards, Audit, Probes)
    ├── data/
    │   ├── presetScenarios.ts   # Pre-loaded authentic case studies (ModernBERT, EHR, PQC)
    │   └── demoCaseScenario.ts  # Default reasoning chain and sample dialogues
    ├── utils/
    │   └── exportBrief.ts       # Markdown & BibTeX serialization utilities
    └── components/
        ├── Header.tsx           # Accessible top navigation, segmented tabs & utility controls
        ├── InteractiveResearchWorkspace.tsx # Split-pane advisor workspace & reasoning cards
        ├── ResearchBriefView.tsx# 5-stage comprehensive research proposal document
        ├── SocraticDefenseView.tsx # Reviewer #2 stress test and scoring laboratory
        ├── EvidenceAuditView.tsx# Literature integrity, hallucination & citation auditor
        ├── AcademicSearchModal.tsx # arXiv and Semantic Scholar search interface
        ├── TerminologyGlossaryModal.tsx # Dual-audience definitions for research terms
        ├── EvidencePrinciplesModal.tsx  # The 10 Evidence Principles reference guide
        ├── TechStackModal.tsx   # Interactive full-stack topology visualization
        └── LanguageSelector.tsx # Regional language picker
```

---

## 📜 The 10 Evidence Principles

Ideally is guided by 10 fundamental tenets of scientific integrity:

1. **Observation as Inquiry**: Treat observations as empirical questions to verify, not established facts.
2. **Primary Sources First**: Prioritize peer-reviewed literature and benchmark datasets over informal commentary.
3. **Community Signals ≠ Proof**: GitHub issues and forum complaints signal user friction, not statistical prevalence.
4. **Empirical Traceability**: Every claim must be traceable to supporting evidence with clear boundary conditions.
5. **Epistemic Categorization**: Strictly distinguish existence, prevalence, mechanism, and efficacy evidence.
6. **Mandatory Contradictory Findings**: Actively search for negative results and counter-evidence.
7. **Clear Epistemic Separation**: Explicitly label facts, AI inferences, and testable hypotheses.
8. **Uncertainty & Gaps**: Lack of literature does not prove novelty or non-existence; remain uncertain until tested.
9. **Zero Fabrication**: Disclose exact methodology scope; never fabricate citations or performance figures.
10. **Illustrations ≠ Evidence**: Architecture diagrams and expected outcomes are hypotheses, not achieved results.

---

## 📄 License

This project is licensed under the MIT License.
