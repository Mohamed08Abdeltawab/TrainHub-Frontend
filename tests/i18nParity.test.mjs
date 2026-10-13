import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('i18n Localization Integrity & Parity Suite', () => {
  const rootDir = path.resolve('src');
  const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/en.json'), 'utf-8'));
  const arLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/ar.json'), 'utf-8'));

  it('should have identical key sets between English and Arabic locales', () => {
    const enKeys = Object.keys(enLocale).sort();
    const arKeys = Object.keys(arLocale).sort();

    const missingInAr = enKeys.filter((k) => !Object.hasOwn(arLocale, k));
    const missingInEn = arKeys.filter((k) => !Object.hasOwn(enLocale, k));

    assert.deepStrictEqual(missingInAr, [], `Keys in en.json missing in ar.json: ${missingInAr.join(', ')}`);
    assert.deepStrictEqual(missingInEn, [], `Keys in ar.json missing in en.json: ${missingInEn.join(', ')}`);
    assert.strictEqual(enKeys.length, arKeys.length, 'Key counts between locales must match');
  });

  it('should not contain corrupted characters or question mark runs in Arabic locale', () => {
    const corruptedEntries = [];

    for (const [key, value] of Object.entries(arLocale)) {
      if (typeof value !== 'string') {
        corruptedEntries.push({ key, reason: 'Value is not a string' });
      } else if (value.trim().length === 0) {
        corruptedEntries.push({ key, reason: 'Value is empty' });
      } else if (/\?{2,}/.test(value) || value.includes('???')) {
        corruptedEntries.push({ key, value, reason: 'Contains run of question marks' });
      } else if (value.includes('\uFFFD')) {
        corruptedEntries.push({ key, value, reason: 'Contains Unicode replacement character' });
      }
    }

    assert.deepStrictEqual(
      corruptedEntries,
      [],
      `Found ${corruptedEntries.length} corrupted entries in ar.json: ${JSON.stringify(corruptedEntries)}`
    );
  });

  it('should preserve parameter placeholders across both languages', () => {
    const placeholderRegex = /\{(\w+)\}/g;
    const mismatches = [];

    for (const [key, enVal] of Object.entries(enLocale)) {
      const arVal = arLocale[key];
      if (!arVal) continue;

      const enPlaceholders = [...enVal.matchAll(placeholderRegex)].map((m) => m[1]).sort();
      const arPlaceholders = [...arVal.matchAll(placeholderRegex)].map((m) => m[1]).sort();

      if (enPlaceholders.length > 0 || arPlaceholders.length > 0) {
        if (enPlaceholders.join(',') !== arPlaceholders.join(',')) {
          mismatches.push({
            key,
            en: enVal,
            ar: arVal,
            enPlaceholders,
            arPlaceholders,
          });
        }
      }
    }

    assert.deepStrictEqual(
      mismatches,
      [],
      `Found placeholder mismatches: ${JSON.stringify(mismatches)}`
    );
  });

  it('translateText should replace variables and handle language fallbacks correctly', async () => {
    const { translateText } = await import('../src/i18n/translate.ts');
    const dicts = { en: enLocale, ar: arLocale };

    // Test parameter interpolation
    const enInterpolated = translateText('Change status for {name}', 'en', dicts, { name: 'Fullstack Course' });
    assert.strictEqual(enInterpolated, 'Change status for Fullstack Course');

    const arInterpolated = translateText('Change status for {name}', 'ar', dicts, { name: 'Fullstack Course' });
    assert.ok(arInterpolated.includes('Fullstack Course'));

    // Test missing key fallback to key itself
    const fallback = translateText('NonExistentKey12345', 'ar', dicts);
    assert.strictEqual(fallback, 'NonExistentKey12345');
  });
});
