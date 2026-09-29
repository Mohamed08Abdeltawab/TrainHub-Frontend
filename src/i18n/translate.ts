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
  const translated = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  if (!variables) return translated;

  return translated.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(variables, name) ? String(variables[name]) : placeholder
  );
}
