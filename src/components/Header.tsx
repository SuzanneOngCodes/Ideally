import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  BookOpen, 
  Menu, 
  X, 
  HelpCircle,
  ShieldCheck,
  Search,
  ChevronDown,
  Plus,
  FolderOpen
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export type NavTab = 'intake' | 'workspace' | 'problem' | 'knowledge' | 'tradeoffs' | 'experiment' | 'brief' | 'defense' | 'auditor';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPresets: () => void;
  onNewIntake: () => void;
  onExport: () => void;
  hasActiveBrief: boolean;
  onOpenMethodology: () => void;
  onOpenSearch?: () => void;
  onOpenGlossary?: () => void;
  onOpenPrinciples?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenPresets,
  onNewIntake,
  onExport,
  hasActiveBrief,
  onOpenMethodology,
  onOpenSearch,
  onOpenGlossary,
  onOpenPrinciples,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close resources dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMobileTab = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const isBriefActive = ['problem', 'knowledge', 'tradeoffs', 'experiment', 'brief'].includes(activeTab) && activeTab !== 'workspace';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab(hasActiveBrief ? 'workspace' : 'intake')}
            className="text-lg font-bold tracking-tight text-slate-900 font-serif-scholarly hover:opacity-80 transition-opacity flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md"
            aria-label="Ideally Home"
          >
            <span>Ideally</span>
            <span className="text-[11px] font-sans font-medium text-slate-400 border-l border-slate-200 pl-2 hidden sm:inline">
              Research Advisor
            </span>
          </button>
        </div>

        {/* Zone 2: Readable, Clean Center Navigation */}
        {hasActiveBrief ? (
          <nav 
            className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70" 
            aria-label="Main Navigation"
          >
            <button
              onClick={() => onSelectTab('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              aria-current={activeTab === 'workspace' ? 'page' : undefined}
            >
              Workspace
            </button>

            <button
              onClick={() => onSelectTab('brief')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isBriefActive
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              aria-current={isBriefActive ? 'page' : undefined}
            >
              Proposal Brief
            </button>

            <button
              onClick={() => onSelectTab('defense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'defense'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              aria-current={activeTab === 'defense' ? 'page' : undefined}
            >
              Defense Lab
            </button>

            <button
              onClick={() => onSelectTab('auditor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'auditor'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              aria-current={activeTab === 'auditor' ? 'page' : undefined}
            >
              Auditor
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center text-xs font-medium text-slate-500">
            <span>Formulate, Validate & Defend Research Directions</span>
          </div>
        )}

        {/* Zone 3: Clean, Uncluttered Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Literature Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200/60"
              title="Search academic literature (arXiv, Semantic Scholar)"
              aria-label="Search literature"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Search Lit</span>
            </button>
          )}

          {/* Consolidated Resources Dropdown */}
          <div className="relative inline-block text-left" ref={resourcesRef}>
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 border ${
                resourcesOpen 
                  ? 'bg-slate-100 text-slate-900 border-slate-300' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              title="Guides, case studies, and scientific principles"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Resources</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${resourcesOpen ? 'rotate-180' : ''}`} />
            </button>

            {resourcesOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Knowledge & Guides
                </div>

                <button
                  onClick={() => { onOpenPresets(); setResourcesOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Case Studies</div>
                    <div className="text-[11px] text-slate-400">Load authentic research scenarios</div>
                  </div>
                </button>

                <button
                  onClick={() => { onOpenMethodology(); setResourcesOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Methodology Guide</div>
                    <div className="text-[11px] text-slate-400">How Ideally's 5 stages work</div>
                  </div>
                </button>

                {onOpenGlossary && (
                  <button
                    onClick={() => { onOpenGlossary(); setResourcesOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Research Glossary</div>
                      <div className="text-[11px] text-slate-400">Plain English & academic definitions</div>
                    </div>
                  </button>
                )}

                {onOpenPrinciples && (
                  <button
                    onClick={() => { onOpenPrinciples(); setResourcesOpen(false); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">10 Evidence Principles</div>
                      <div className="text-[11px] text-slate-400">Scientific rules for defensibility</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Regional Localization Selector */}
          <LanguageSelector />

          {/* Primary Action Button */}
          {hasActiveBrief ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <button
                onClick={onNewIntake}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                title="Start a new research proposal"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>

              <button
                onClick={onExport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                title="Download complete research brief in Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onNewIntake}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Brief</span>
            </button>
          )}

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {hasActiveBrief ? (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Main Workspace
              </div>
              <button
                onClick={() => handleSelectMobileTab('workspace')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'workspace'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Advisor Workspace
              </button>
              <button
                onClick={() => handleSelectMobileTab('brief')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isBriefActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Proposal Brief
              </button>
              <button
                onClick={() => handleSelectMobileTab('defense')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'defense'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Defense Lab
              </button>
              <button
                onClick={() => handleSelectMobileTab('auditor')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'auditor'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Evidence Auditor
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSelectMobileTab('intake')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white"
            >
              Intake Form
            </button>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
              Resources & Tools
            </div>
            <button
              onClick={() => {
                onOpenPresets();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>Browse Case Studies</span>
            </button>
            <button
              onClick={() => {
                onOpenMethodology();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Methodology Guide</span>
            </button>
            {onOpenGlossary && (
              <button
                onClick={() => {
                  onOpenGlossary();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Research Terminology Glossary</span>
              </button>
            )}
            {onOpenPrinciples && (
              <button
                onClick={() => {
                  onOpenPrinciples();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>10 Evidence Principles</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
