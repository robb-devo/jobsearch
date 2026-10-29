import { SKILL_DICTIONARY } from './content';
import { containsTerm } from './match';
import { normalizeText } from './utils';

// Words every job ad uses that say nothing about the role itself (normalised spelling).
const GENERIC = new Set(
  (
    'aufgaben profil benefits erfahrung erfahrungen kenntnisse unternehmen mitarbeiter mitarbeiterin mitarbeitende mitarbeitenden bereich ' +
    'bereichen stelle position bewerbung bewerbungen arbeit arbeitgeber arbeitszeit arbeitszeiten moeglichkeit moeglichkeiten zukunft kunden ' +
    'rahmen vorteile angebot ausbildung studium abschluss qualifikation qualifikationen anforderungen taetigkeit taetigkeiten gehalt verguetung ' +
    'urlaub urlaubstage standort standorte homeoffice jahren freude interesse unterlagen ansprechpartner ansprechpartnerin kontakt informationen ' +
    'deutschland bieten suchen freuen weiterbildung weiterbildungen entwicklung umfeld kollegen kolleginnen arbeitsplatz vollzeit teilzeit ' +
    'bereitschaft faehigkeit faehigkeiten eigenschaften persoenlichkeit wochen monate eintritt karriere gruppe betrieb zusammenarbeit ' +
    'verantwortung zeitpunkt unterstuetzung mitarbeit gestaltung moeglich experience skills company requirements responsibilities'
  ).split(' '),
);

const ACRONYM_IGNORE = new Set(['GMBH', 'AG', 'KG', 'SE', 'CO', 'UG', 'EU', 'DE', 'UND', 'ODER', 'MIT', 'WIR', 'SIE', 'IHR', 'IHRE', 'UNS', 'DU', 'DEIN', 'DAS', 'DER', 'DIE', 'THE', 'AND', 'YOU', 'OUR', 'M/W/D', 'W/M/D', 'M/W/X', 'MWD']);

export interface KeywordReport {
  score: number;
  matched: string[];
  missing: string[];
}

/** The terms an applicant tracking system would most likely look for in this ad. */
export function extractKeywords(ad: string, limit = 18): string[] {
  const text = normalizeText(ad);
  const terms = new Map<string, string>();
  for (const skill of SKILL_DICTIONARY) {
    const n = normalizeText(skill);
    if (containsTerm(text, n)) terms.set(n, skill);
  }
  // Acronyms and tool names such as SAP, AWS, S/4HANA or C#.
  for (const [word] of ad.matchAll(/(?<![\p{L}\d])[A-Z][A-Z0-9#+./-]{1,5}(?![\p{L}\d])/gu)) {
    const clean = word.replace(/[./-]+$/, '');
    if (clean.length > 1 && !ACRONYM_IGNORE.has(clean)) terms.set(normalizeText(clean), clean);
  }
  // Nouns the ad repeats are usually the core of the role.
  const counts = new Map<string, { word: string; n: number }>();
  for (const [word] of ad.matchAll(/(?<!\p{L})[A-ZÄÖÜ][a-zäöüß]{5,}(?!\p{L})/gu)) {
    const n = normalizeText(word);
    if (GENERIC.has(n)) continue;
    const entry = counts.get(n) ?? { word, n: 0 };
    entry.n++;
    counts.set(n, entry);
  }
  [...counts.entries()]
    .filter(([, e]) => e.n >= 2)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .forEach(([n, e]) => terms.set(n, e.word));
  // Drop fragments of longer terms, e.g. "BI" next to "Power BI".
  const keys = [...terms.keys()];
  return keys
    .filter((n) => !keys.some((other) => other.length > n.length && other.includes(n)))
    .map((n) => terms.get(n)!)
    .slice(0, limit);
}

/** Share of the ad's keywords that also appear in the CV. */
export function keywordReport(ad: string, cv: string): KeywordReport | null {
  if (ad.trim().length < 120 || !cv.trim()) return null;
  const keywords = extractKeywords(ad);
  if (keywords.length < 3) return null;
  const cvText = normalizeText(cv);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of keywords) {
    const n = normalizeText(keyword);
    const hit = n.length <= 3 ? containsTerm(cvText, n) : cvText.includes(n.length > 7 ? n.slice(0, -2) : n);
    (hit ? matched : missing).push(keyword);
  }
  return { score: Math.round((matched.length / keywords.length) * 100), matched, missing };
}
