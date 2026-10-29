import { LANGUAGE_NAMES, SKILL_DICTIONARY } from './content';
import { containsTerm } from './match';
import type { Profile } from './types';
import { normalizeText } from './utils';

const tidy = (s: string) =>
  s
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

async function readPdf(file: File): Promise<string> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    const lines: string[] = [];
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      }
    }
    if (line) lines.push(line);
    pages.push(lines.join('\n'));
  }
  await task.destroy();
  return tidy(pages.join('\n\n'));
}

async function readDocx(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return tidy(result.value);
}

/** Extracts plain text from a CV locally in the browser – nothing is uploaded. */
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return readPdf(file);
  if (name.endsWith('.docx')) return readDocx(file);
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return tidy(await file.text());
  throw new Error('Bitte lade eine PDF-, DOCX- oder TXT-Datei hoch.');
}

/** Rule-based extraction for when no AI is connected: contact data, skills and languages. */
export function parseProfileFromText(text: string): Partial<Profile> {
  const found: Partial<Profile> = {};
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
  if (email) found.email = email[0];
  const phone = text.match(/(?:\+\d{2}|\b0)[\d\s/()-]{7,18}\d/);
  if (phone) found.phone = phone[0].replace(/\s+/g, ' ').trim();
  const linkedin = text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+/i);
  if (linkedin) found.linkedinUrl = linkedin[0].startsWith('http') ? linkedin[0] : `https://${linkedin[0]}`;
  const city = text.match(/\b(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ]?[a-zäöüß]+)?)/);
  if (city) found.city = `${city[1]} ${city[2]}`;

  const nameLine = text
    .split('\n')
    .map((l) => l.trim())
    .slice(0, 12)
    .find(
      (l) =>
        /^[A-ZÄÖÜ][\p{L}'-]+(?:\s+[A-ZÄÖÜ][\p{L}'-]+){1,3}$/u.test(l) &&
        !/lebenslauf|curriculum|vitae|resume|bewerbung|kontakt|contact|profil|summary|skills|kenntnisse/i.test(l),
    );
  if (nameLine) found.name = nameLine;

  const normalized = normalizeText(text);
  found.skills = SKILL_DICTIONARY.filter((s) => containsTerm(normalized, normalizeText(s)));
  found.languages = [...new Set(Object.entries(LANGUAGE_NAMES).filter(([key]) => containsTerm(normalized, key)).map(([, label]) => label))];
  return found;
}
