import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Sparkles, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode, APAC_LANGUAGES } from '../types/i18n';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, activeLanguageInfo, translationProvider } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs group"
        title="Select language (Japan & APAC Region) via Google Cloud Translation"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{activeLanguageInfo.flag}</span>
        <span className="font-semibold text-slate-800 hidden xs:inline">{activeLanguageInfo.nativeName}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 hidden sm:inline">
          APAC
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Japan & APAC Region</span>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                Cloud Translation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              High-fidelity scholarly localization for East & Southeast Asia
            </p>
          </div>

          {/* Language Options List */}
          <div className="py-1 max-h-80 overflow-y-auto">
            {APAC_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-950 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-medium">{lang.nativeName}</span>
                        {lang.code === 'ja' && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                            Japan
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lang.name} • {lang.country}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-3.5 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Google Cloud Translation Active</span>
            </span>
            <span className="text-slate-300">v2 REST / GenAI</span>
          </div>
        </div>
      )}
    </div>
  );
};
