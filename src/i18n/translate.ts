export type TranslationLanguage = 'en' | 'ar';
export type TranslationDictionary = Record<string, string>;
export type TranslationVariables = Record<string, string | number>;
export type TranslationDictionaries = {
  en: TranslationDictionary;
  ar: TranslationDictionary;
};

export function translateText(
  key: string,
  language: TranslationLanguage,
  dictionaries: TranslationDictionaries,
  variables?: TranslationVariables
): string {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV &&
    !Object.hasOwn(dictionaries[language], key) &&
    !Object.hasOwn(dictionaries.en, key)
  ) {
    console.warn(`[i18n] Missing translation key: "${key}" for language "${language}"`);
  }

  const translated = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  if (!variables) return translated;

  return translated.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(variables, name) ? String(variables[name]) : placeholder
  );
}
