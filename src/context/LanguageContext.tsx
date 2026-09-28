import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, ApacLanguage, APAC_LANGUAGES } from '../types/i18n';
import { TRANSLATIONS, TranslationDictionary } from '../i18n/translations';
import { ResearchBrief } from '../types/research';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  activeLanguageInfo: ApacLanguage;
  languages: ApacLanguage[];
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof TranslationDictionary) => string;
  translateText: (text: string, targetLang?: LanguageCode) => Promise<string>;
  translateBriefContent: (brief: ResearchBrief, targetLang: LanguageCode) => Promise<ResearchBrief>;
  isTranslating: boolean;
  translationProvider: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Memory cache for dynamic translations to avoid repeated network calls
const textTranslationCache = new Map<string, string>();
const briefTranslationCache = new Map<string, ResearchBrief>();

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('ideally_apac_lang');
      if (saved && APAC_LANGUAGES.some(l => l.code === saved)) {
        return saved as LanguageCode;
      }
      // Check browser locale for APAC languages
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('ja')) return 'ja';
      if (browserLang.includes('zh-tw') || browserLang.includes('zh-hk')) return 'zh-TW';
      if (browserLang.startsWith('zh')) return 'zh-CN';
      if (browserLang.startsWith('ko')) return 'ko';
      if (browserLang.startsWith('id')) return 'id';
      if (browserLang.startsWith('vi')) return 'vi';
      if (browserLang.startsWith('th')) return 'th';
    } catch {
      // Fallback
    }
    return 'en';
  });

  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationProvider, setTranslationProvider] = useState<string>('google_cloud_translation');

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem('ideally_apac_lang', lang);
    } catch {
      // Ignore
    }
  };

  const activeLanguageInfo = APAC_LANGUAGES.find(l => l.code === currentLanguage) || APAC_LANGUAGES[0];

  const t = (key: keyof TranslationDictionary): string => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || String(key);
  };

  const translateText = async (text: string, targetLang?: LanguageCode): Promise<string> => {
    const target = targetLang || currentLanguage;
    if (target === 'en' || !text.trim()) return text;

    const cacheKey = `${target}:${text}`;
    if (textTranslationCache.has(cacheKey)) {
      return textTranslationCache.get(cacheKey)!;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [text],
          targetLang: target,
          sourceLang: 'en',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translations && data.translations[0]) {
          const translated = data.translations[0];
          textTranslationCache.set(cacheKey, translated);
          if (data.provider) setTranslationProvider(data.provider);
          return translated;
        }
      }
    } catch (err) {
      console.warn('Translation call failed, using source text:', err);
    }

    return text;
  };

  const translateBriefContent = async (brief: ResearchBrief, targetLang: LanguageCode): Promise<ResearchBrief> => {
    if (targetLang === 'en') return brief;

    const cacheKey = `${brief.id || 'brief'}:${targetLang}`;
    if (briefTranslationCache.has(cacheKey)) {
      return briefTranslationCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          targetLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedBrief) {
          briefTranslationCache.set(cacheKey, data.translatedBrief);
          if (data.provider) setTranslationProvider(data.provider);
          return data.translatedBrief;
        }
      }
    } catch (err) {
      console.warn('Brief translation failed, retaining original brief:', err);
    } finally {
      setIsTranslating(false);
    }

    return brief;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        activeLanguageInfo,
        languages: APAC_LANGUAGES,
        setLanguage,
        t,
        translateText,
        translateBriefContent,
        isTranslating,
        translationProvider,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
