import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  BookOpen, 
  Menu, 
  X, 
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Compass,
  Search
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const handleSelectMobileTab = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'intake' as NavTab, label: t('navIntake'), show: true },
    { id: 'workspace' as NavTab, label: t('navWorkspace'), show: hasActiveBrief },
    { id: 'brief' as NavTab, label: t('navBrief'), show: hasActiveBrief },
    { id: 'defense' as NavTab, label: t('navDefense'), show: hasActiveBrief },
    { id: 'auditor' as NavTab, label: t('navAuditor'), show: hasActiveBrief },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Wordmark Brand Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectTab(hasActiveBrief ? 'workspace' : 'intake')}
            className="text-xl font-bold tracking-tight text-slate-900 font-serif-scholarly hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <span>Ideally</span>
            <span className="text-xs font-sans font-medium text-slate-400 border-l border-slate-200 pl-2 hidden sm:inline">
              {t('appTagline')}
            </span>
          </button>
        </div>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('intake')}
            className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
              activeTab === 'intake' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            {t('navIntake')}
          </button>

          {hasActiveBrief && (
            <>
              <button
                onClick={() => onSelectTab('workspace')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${
                  activeTab === 'workspace'
                    ? 'text-slate-900 font-bold'
                    : ''
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('navWorkspace')}</span>
              </button>

              <button
                onClick={() => onSelectTab('brief')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${
                  ['problem', 'knowledge', 'tradeoffs', 'experiment', 'brief'].includes(activeTab) && activeTab !== 'workspace'
                    ? 'text-slate-900 font-semibold'
                    : ''
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('navBrief')}</span>
              </button>

              <button
                onClick={() => onSelectTab('defense')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${
                  activeTab === 'defense' ? 'text-amber-900 font-semibold' : ''
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('navDefense')}</span>
              </button>

              <button
                onClick={() => onSelectTab('auditor')}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 flex items-center gap-1.5 ${
                  activeTab === 'auditor' ? 'text-purple-900 font-semibold' : ''
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>{t('navAuditor')}</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenMethodology}
            className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('navMethodology')}</span>
          </button>
        </nav>

        {/* Zone 3: Language Selector, Actions & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Japan & APAC Group Regional Selector */}
          <LanguageSelector />

          <button
            onClick={onOpenPresets}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            title="Load authentic case study examples"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{t('navCaseStudies')}</span>
          </button>

          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              title="Search arXiv, Semantic Scholar, and Web Search"
            >
              <Search className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">{t('navSearchLit')}</span>
            </button>
          )}

          {hasActiveBrief ? (
            <button
              onClick={onExport}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('btnExportBrief')}</span>
            </button>
          ) : (
            <button
              onClick={onNewIntake}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('btnNewIntake')}</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
            Navigation Stages
          </div>

          <div className="space-y-1">
            {navLinks.filter(l => l.show).map((link) => (
              <button
                key={link.id}
                onClick={() => handleSelectMobileTab(link.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === link.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              onClick={() => {
                onOpenMethodology();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>How Ideally Works (Methodology)</span>
            </button>

            <button
              onClick={() => {
                onOpenPresets();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Browse 3 Case Studies</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
