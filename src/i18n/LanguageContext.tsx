import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import arTranslations from './locales/ar.json';
import organizationArTranslations from './locales/organization-ar.json';
import enTranslations from './locales/en.json';
import organizationEnTranslations from './locales/organization-en.json';
import { translateText } from './translate';

export type Language = 'en' | 'ar';
const STORAGE_KEY = 'trainhub.language';

const dictionaries = {
  en: { ...enTranslations, ...organizationEnTranslations },
  ar: { ...arTranslations, ...organizationArTranslations },
};

export type TranslationVariables = Record<string, string | number>;
type LanguageContextValue = { language: Language; direction: 'ltr' | 'rtl'; setLanguage: (language: Language) => void; toggleLanguage: () => void; t: (text: string, variables?: TranslationVariables) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
  });
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the selected language for this visit. */ }
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  const value = useMemo(() => ({
    language,
    direction: language === 'ar' ? 'rtl' as const : 'ltr' as const,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'en' ? 'ar' : 'en'),
    t: (text: string, variables?: TranslationVariables) => translateText(text, language, dictionaries, variables),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider.');
  return context;
}
