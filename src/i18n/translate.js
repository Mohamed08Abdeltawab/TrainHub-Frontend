/**
 * @typedef {'en' | 'ar'} TranslationLanguage
 * @typedef {Record<string, string>} TranslationDictionary
 * @typedef {Record<string, string | number>} TranslationVariables
 * @typedef {{ en: TranslationDictionary, ar: TranslationDictionary }} TranslationDictionaries
 */

/**
 * @param {string} key
 * @param {TranslationLanguage} language
 * @param {TranslationDictionaries} dictionaries
 * @param {TranslationVariables} [variables]
 */
export function translateText(key, language, dictionaries, variables) {
  const translated = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  if (!variables) return translated;

  return translated.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(variables, name) ? String(variables[name]) : placeholder
  );
}
