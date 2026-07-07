import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { en } from '../src/i18n/locales/en.js';
import { pt } from '../src/i18n/locales/pt.js';

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenKeys(nestedValue, prefix ? `${prefix}.${key}` : key),
  );
}

function walkFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return walkFiles(path);
    }

    return path;
  });
}

const ptKeys = new Set(flattenKeys(pt));
const enKeys = new Set(flattenKeys(en));
const missingInPt = [...enKeys].filter((key) => !ptKeys.has(key));
const missingInEn = [...ptKeys].filter((key) => !enKeys.has(key));

const sourceFiles = walkFiles('src').filter((file) =>
  ['.js', '.jsx'].includes(extname(file)) &&
  !file.includes('.test.') &&
  !file.includes(`${join('src', 'i18n', 'locales')}`),
);

const hardcodedProductPatterns = [
  /\bJo(?:ã|a)o\s+(?:plays|jogou)\b/i,
  /\b\d+\s+de\s+(?:ouro|paus|copas|espadas?)\b/i,
];

const hardcodedMatches = sourceFiles.flatMap((file) => {
  const content = readFileSync(file, 'utf8');

  return hardcodedProductPatterns.flatMap((pattern) => {
    const matches = content.match(pattern);

    return matches ? [`${file}: ${matches[0]}`] : [];
  });
});

if (missingInPt.length || missingInEn.length || hardcodedMatches.length) {
  if (missingInPt.length) {
    console.error(`i18n keys missing in pt: ${missingInPt.join(', ')}`);
  }

  if (missingInEn.length) {
    console.error(`i18n keys missing in en: ${missingInEn.join(', ')}`);
  }

  if (hardcodedMatches.length) {
    console.error(`hardcoded product strings found:\n${hardcodedMatches.join('\n')}`);
  }

  process.exit(1);
}

console.log(`i18n parity check passed: ${ptKeys.size} keys`);
