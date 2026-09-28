import React, { useState } from 'react';
import { X, Layers, Cpu, Server, Globe, Shield, Terminal, ArrowDown, Database, Code, CheckCircle2 } from 'lucide-react';

interface TechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechStackModal: React.FC<TechStackModalProps> = ({ isOpen, onClose }) => {
  const [activeTier, setActiveTier] = useState<'all' | 'frontend' | 'backend' | 'ai'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                Full-Stack Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono-tabular">Node.js · Vite 8 · React 19 · Express</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-serif-scholarly">
              System Tech Stack & Architecture Map
            </h2>
            <p className="text-xs text-slate-600">
              Interactive end-to-end topology showing client components, API middleware, and AI inference pipelines.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close tech stack modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium text-[11px] mr-1">Filter Tier:</span>
          {(['all', 'frontend', 'backend', 'ai'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                activeTier === tier
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : tier === 'frontend' ? 'Frontend Client' : tier === 'backend' ? 'Express Backend' : 'AI & External APIs'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Visual Architecture Diagram */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-inner font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 font-bold text-[11px] mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>Interactive Data & Execution Pipeline</span>
              <span className="text-[10px] text-emerald-400 font-mono">Port :3000 · Single Process Architecture</span>
            </div>

            <div className="space-y-3 min-w-[620px]">
              {/* TIER 1: FRONTEND */}
              {(activeTier === 'all' || activeTier === 'frontend') && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-indigo-400 text-xs flex items-center gap-2">
                      <Code className="w-4 h-4 text-indigo-400" />
                      TIER 1: CLIENT APPLICATION (Browser Runtime)
                    </span>
                    <span className="text-[10px] bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                      React 19 + TypeScript + Vite 8
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">UI Framework</div>
                      <div className="text-slate-400 text-[10px]">React 19 SPA, Functional Components & Hooks</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Styling Engine</div>
                      <div className="text-slate-400 text-[10px]">Tailwind CSS v4 (@tailwindcss/vite)</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">State & i18n</div>
                      <div className="text-slate-400 text-[10px]">Context API + LanguageContext (APAC / Global)</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Icons & Motion</div>
                      <div className="text-slate-400 text-[10px]">Lucide React Icons + Motion Spring Physics</div>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW ARROW */}
              <div className="flex justify-center items-center gap-2 text-slate-500 text-[11px] py-0.5">
                <ArrowDown className="w-4 h-4 text-indigo-400 animate-bounce" />
                <span>HTTP REST Calls (/api/*) via native fetch API · JSON Over TLS</span>
                <ArrowDown className="w-4 h-4 text-indigo-400 animate-bounce" />
              </div>

              {/* TIER 2: BACKEND SERVER */}
              {(activeTier === 'all' || activeTier === 'backend') && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-400 text-xs flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-400" />
                      TIER 2: EXPRESS API & BUNDLER MIDDLEWARE (Node.js)
                    </span>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      tsx server.ts · Port 3000
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Server Engine</div>
                      <div className="text-slate-400 text-[10px]">Express.js 4.21 with JSON Parser & CORS</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Vite Middleware</div>
                      <div className="text-slate-400 text-[10px]">vite.middlewares mounted directly in dev mode</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Secure Vault</div>
                      <div className="text-slate-400 text-[10px]">dotenv protects GEMINI_API_KEY from browser leak</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Resilience Layer</div>
                      <div className="text-slate-400 text-[10px]">Exponential backoff & model fallback cascades</div>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW ARROW */}
              <div className="flex justify-center items-center gap-2 text-slate-500 text-[11px] py-0.5">
                <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Authorized SDK Dispatches · Server-to-Server Network Egress</span>
                <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
              </div>

              {/* TIER 3: AI & EXTERNAL APIS */}
              {(activeTier === 'all' || activeTier === 'ai') && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      TIER 3: AI FOUNDATION & EXTERNAL CLOUD SERVICES
                    </span>
                    <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                      Google GenAI SDK & Cloud APIs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Gemini Foundation Models</div>
                      <div className="text-slate-400 text-[10px]">gemini-3.8-flash (Primary) → gemini-flash-latest / 3.1-lite (Fallback)</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Academic Grounding</div>
                      <div className="text-slate-400 text-[10px]">Semantic Scholar API + arXiv Query + Google Search Grounding</div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
                      <div className="text-slate-200 font-bold">Cloud Translation</div>
                      <div className="text-slate-400 text-[10px]">Google Cloud Translation API (JA, ZH, KO, EN, HI)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Technology Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>Frontend Details</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>React 19.0.1:</strong> Latest React concurrency & hooks</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Tailwind CSS 4.3:</strong> Zero-runtime CSS engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>TypeScript 5.8:</strong> Strict end-to-end types</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Vite 8:</strong> Instant HMR & esbuild bundling</span>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Server & Runtime</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Express 4.21:</strong> Minimalist REST backend</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>tsx:</strong> Direct TypeScript execution in Node</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Port 3000:</strong> Unified dev & prod port binding</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>dotenv:</strong> Secure server-side credential isolation</span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Cpu className="w-4 h-4 text-amber-600" />
                <span>AI & Integrations</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>@google/genai 2.4:</strong> Official Google GenAI SDK</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Gemini 3.8 Flash:</strong> Fast high-reasoning inference</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Lit Search:</strong> arXiv & Semantic Scholar APIs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Cloud Translation:</strong> Real-time multilingual briefs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Compliant with Google AI Studio Build Full-Stack Architecture specifications.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
