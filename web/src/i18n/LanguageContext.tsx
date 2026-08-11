import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

type Params = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectInitialLanguage(): Language {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('melfa-language') as Language | null;
    if (stored && stored in translations) return stored;
  }
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('vi')) return 'vi';
    if (nav.startsWith('en')) return 'en';
  }
  return 'es';
}

function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('melfa-language', language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, params) => format(translations[language][key], params),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
