import type Anthropic from '@anthropic-ai/sdk';
import type { Profile } from './types';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', description: 'Beste Textqualität – empfohlen' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', description: 'Sehr gut, schneller und günstiger' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', description: 'Am schnellsten und günstigsten' },
];

export type DocKind = 'letter' | 'email' | 'linkedin' | 'analysis' | 'interview' | 'cv' | 'followup' | 'thanks';

export interface PromptInput {
  kind: DocKind;
  tone: 'formal' | 'modern';
  language: 'de' | 'en';
  job: { title: string; company: string; location: string; contact: string; description: string; appliedAt?: string };
  profile: Profile;
}

const SYSTEM = `Du bist ein erfahrener Karriere-Coach und Recruiting-Experte für den deutschsprachigen Arbeitsmarkt. Du hilfst Menschen, überzeugende, ehrliche und individuelle Bewerbungsunterlagen zu erstellen.

Grundsätze:
- Verwende ausschließlich Fakten aus Profil, Lebenslauf und LinkedIn-Profil. Erfinde keine Stationen, Abschlüsse, Zahlen oder Erfolge. Fehlt eine Angabe, setze einen klar erkennbaren Platzhalter in eckigen Klammern, z. B. [konkretes Projektbeispiel].
- Stelle konkrete Bezüge zwischen den Anforderungen der Stelle und belegbaren Erfahrungen her.
- Schreibe natürlich und selbstbewusst, ohne Floskeln wie „hiermit bewerbe ich mich“ oder „mit großem Interesse habe ich gelesen“.
- Gib reinen Text ohne Markdown aus (keine #, keine **, keine Tabellen).`;

const TASKS: Record<DocKind, string> = {
  letter: `Schreibe ein individuelles Anschreiben für diese Stelle.
- Umfang: 250–350 Wörter in 3–5 Absätzen.
- Beginne direkt mit der Anrede (bei bekannter Ansprechperson persönlich, sonst „Sehr geehrte Damen und Herren,“) und ende mit „Mit freundlichen Grüßen“ und dem Namen. Keine Adressblöcke, kein Datum, keine Betreffzeile – die ergänzt die App.
- Der Einstieg zeigt sofort, warum genau diese Stelle und dieses Unternehmen passen.
- Belege die 2–3 wichtigsten Anforderungen mit konkreten Erfahrungen aus dem Lebenslauf.
- Nenne Verfügbarkeit und Gehaltswunsch nur, wenn sie im Profil stehen und die Anzeige danach fragt.
- Schließe mit einem selbstbewussten Wunsch nach einem persönlichen Gespräch.`,
  email: `Schreibe eine kurze Bewerbungs-E-Mail als Begleittext, wenn Anschreiben und Lebenslauf als PDF angehängt werden.
- Erste Zeile: „Betreff: …“ (prägnant, mit Positionsbezeichnung).
- Danach Anrede, 2–3 kurze Absätze (max. 120 Wörter), Grußformel, Name, Telefon und E-Mail.`,
  linkedin: `Schreibe eine kurze, persönliche Nachricht an die Recruiterin, den Recruiter oder die Fachabteilung auf LinkedIn bzw. XING.
- Maximal 600 Zeichen.
- Bezug zur konkreten Stelle, die 1–2 stärksten Argumente und eine freundliche Frage nach einem kurzen Austausch.
- Kein Betreff, keine steife Briefform.`,
  analysis: `Analysiere die Passung zwischen Profil/Lebenslauf und dieser Stelle. Gliedere so:
PASSUNG GESAMT – Einschätzung in Prozent mit einem Satz Begründung.
STÄRKEN – die 3–5 Anforderungen, die klar erfüllt sind, jeweils mit Beleg aus dem Lebenslauf.
LÜCKEN & RISIKEN – was fehlt und wie man es im Anschreiben oder Gespräch souverän adressiert.
KEYWORDS – wichtige Begriffe aus der Anzeige, die in Lebenslauf und Anschreiben vorkommen sollten.
NÄCHSTE SCHRITTE – drei konkrete Empfehlungen.
Nutze die Überschriften in Großbuchstaben und Spiegelstriche (–).`,
  interview: `Bereite ein Vorstellungsgespräch für diese Stelle vor:
WAHRSCHEINLICHE FRAGEN – 8 Fragen (fachlich und persönlich), jeweils mit einer stichpunktartigen Antwortskizze auf Basis des Lebenslaufs (STAR-Methode, wo sinnvoll).
EIGENE FRAGEN – 3 kluge Rückfragen an das Unternehmen.
VORAB RECHERCHIEREN – 3 Punkte, die vor dem Gespräch geklärt sein sollten.
Nutze die Überschriften in Großbuchstaben und Spiegelstriche (–).`,
  cv: `Optimiere den Lebenslauf für diese Stelle, ohne Fakten zu erfinden:
KURZPROFIL – 3–4 Sätze für den Kopf des Lebenslaufs, zugeschnitten auf die Stelle.
STARKE STICHPUNKTE – für die 2–3 relevantesten Stationen je 3–4 umformulierte Stichpunkte: Verb zuerst, Wirkung statt Aufgabe, Zahlen nur aus dem Lebenslauf, sonst Platzhalter [Zahl].
KEYWORDS – Begriffe aus der Anzeige, die in den Lebenslauf gehören (nur wenn sie zutreffen).
UMBAUEN – was nach oben gehört, was gekürzt oder gestrichen werden kann.
Nutze die Überschriften in Großbuchstaben und Spiegelstriche (–).`,
  followup: `Schreibe eine kurze, freundliche Nachfass-E-Mail zu einer bereits verschickten Bewerbung.
- Erste Zeile: „Betreff: …“.
- Maximal 120 Wörter: Bezug auf die Bewerbung (mit Datum, falls bekannt), Interesse bekräftigen, ein starkes Argument, höfliche Frage nach dem Stand.
- Kein Vorwurf, kein Drängen. Grußformel und Name am Ende.`,
  thanks: `Schreibe eine kurze Danke-E-Mail nach dem Vorstellungsgespräch.
- Erste Zeile: „Betreff: …“.
- Maximal 150 Wörter: Dank für das Gespräch, Bezug auf einen Gesprächspunkt als Platzhalter [Thema aus dem Gespräch], bekräftigtes Interesse mit einem Argument, positiver Ausblick.
- Grußformel und Name am Ende.`,
};

function profileBlock(p: Profile): string {
  const rows: [string, string][] = [
    ['Name', p.name],
    ['Wohnort', p.city],
    ['Aktuelle Position', p.headline],
    ['Berufserfahrung (Jahre)', p.experienceYears],
    ['Wunschpositionen', p.desiredRoles.join(', ')],
    ['Skills', p.skills.join(', ')],
    ['Sprachen', p.languages.join(', ')],
    ['Kurzprofil', p.summary],
    ['Verfügbar ab', p.availableFrom],
    ['Gehaltswunsch', p.salary],
    ['Telefon', p.phone],
    ['E-Mail', p.email],
    ['LinkedIn', p.linkedinUrl],
    ['Website/Portfolio', p.portfolioUrl],
  ];
  const filled = rows.filter(([, v]) => v.trim());
  return filled.length ? filled.map(([k, v]) => `${k}: ${v}`).join('\n') : '(keine Profildaten hinterlegt)';
}

export function buildPrompt({ kind, tone, language, job, profile }: PromptInput): string {
  const parts = [
    `<aufgabe>\n${TASKS[kind]}\n</aufgabe>`,
    `<stelle>
Position: ${job.title || '(nicht angegeben)'}
Unternehmen: ${job.company || '(nicht angegeben)'}
Ort: ${job.location || '(nicht angegeben)'}
Ansprechperson: ${job.contact || '(unbekannt)'}${job.appliedAt ? `\nBeworben am: ${job.appliedAt}` : ''}

Stellenbeschreibung:
${job.description.trim() || '(keine Beschreibung vorhanden – orientiere dich an Position und Unternehmen)'}
</stelle>`,
    `<profil>\n${profileBlock(profile)}\n</profil>`,
  ];
  if (profile.cvText.trim()) parts.push(`<lebenslauf>\n${profile.cvText.trim()}\n</lebenslauf>`);
  if (profile.linkedinText.trim()) parts.push(`<linkedin_profil>\n${profile.linkedinText.trim()}\n</linkedin_profil>`);
  parts.push(
    `Ausgabesprache: ${language === 'en' ? 'Englisch' : 'Deutsch'}
Tonalität: ${tone === 'modern' ? 'modern, persönlich und direkt – trotzdem professionell' : 'klassisch-professionell, sachlich und verbindlich'}`,
  );
  return parts.join('\n\n');
}

/** Full prompt for pasting into claude.ai when no API key is configured. */
export const promptForClaudeAi = (input: PromptInput) => `${SYSTEM}\n\n${buildPrompt(input)}`;

// The SDK is loaded on first use to keep the initial page small.
let sdk: typeof Anthropic | null = null;

async function client(apiKey: string): Promise<Anthropic> {
  sdk ??= (await import('@anthropic-ai/sdk')).default;
  return new sdk({ apiKey, dangerouslyAllowBrowser: true });
}

// Server-side refusal fallback (Anthropic picks the fallback model); Haiku has none.
const fallbackOptions = (model: string) =>
  model.includes('haiku') ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const };

// Keep only text written after the last model switch, in case a fallback model took over mid-answer.
function finalText(blocks: ReadonlyArray<{ type: string; text?: string }>): string {
  let text = '';
  for (const block of blocks) {
    if (block.type === 'fallback') text = '';
    else if (block.type === 'text') text += block.text ?? '';
  }
  return text;
}

export async function generate(opts: {
  apiKey: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
  onText: (delta: string) => void;
}): Promise<string> {
  const stream = (await client(opts.apiKey)).beta.messages.stream(
    {
      model: opts.model,
      max_tokens: 64000,
      system: SYSTEM,
      messages: [{ role: 'user', content: opts.prompt }],
      output_config: { effort: 'medium' },
      ...fallbackOptions(opts.model),
    },
    { signal: opts.signal },
  );
  stream.on('text', opts.onText);
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error('Claude hat diese Anfrage abgelehnt. Prüfe die Eingaben und versuche es erneut.');
  return finalText(message.content);
}

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    street: { type: 'string', description: 'Straße und Hausnummer' },
    city: { type: 'string', description: 'PLZ und Ort, z. B. "50667 Köln"' },
    headline: { type: 'string', description: 'Aktuelle Berufsbezeichnung' },
    summary: { type: 'string', description: 'Kurzprofil in 2–3 Sätzen, Ich-Form' },
    experienceYears: { type: 'string', description: 'Berufserfahrung in Jahren als Zahl, z. B. "6"' },
    desiredRoles: { type: 'array', items: { type: 'string' }, description: '3–5 passende Jobtitel für die Jobsuche' },
    skills: { type: 'array', items: { type: 'string' }, description: 'Bis zu 15 wichtigste Fachkompetenzen und Tools' },
    languages: { type: 'array', items: { type: 'string' }, description: 'Sprachen auf Deutsch, z. B. "Englisch"' },
    linkedinUrl: { type: 'string' },
  },
  required: ['name', 'email', 'phone', 'street', 'city', 'headline', 'summary', 'experienceYears', 'desiredRoles', 'skills', 'languages', 'linkedinUrl'],
  additionalProperties: false,
};

export async function extractProfile(opts: { apiKey: string; model: string; text: string }): Promise<Partial<Profile>> {
  const message = await (await client(opts.apiKey)).beta.messages.create({
    model: opts.model,
    max_tokens: 16000,
    system:
      'Du extrahierst Profildaten aus Lebensläufen und LinkedIn-Profilen für eine Jobsuche-App. Verwende nur Informationen aus dem Dokument; unbekannte Felder bleiben leere Strings bzw. leere Listen. Jobtitel und Skills so, wie sie auf deutschen Jobbörsen gesucht werden.',
    messages: [{ role: 'user', content: `<dokument>\n${opts.text}\n</dokument>\n\nExtrahiere die Profildaten dieser Person.` }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: PROFILE_SCHEMA } },
    ...fallbackOptions(opts.model),
  });
  if (message.stop_reason === 'refusal') throw new Error('Claude konnte das Dokument nicht auswerten.');
  return JSON.parse(finalText(message.content)) as Partial<Profile>;
}

export async function testConnection(apiKey: string, model: string): Promise<void> {
  await (await client(apiKey)).models.retrieve(model);
}

export function describeAiError(err: unknown): string {
  if (sdk) {
    if (err instanceof sdk.AuthenticationError) return 'Der API-Key ist ungültig. Bitte prüfe ihn in den Einstellungen.';
    if (err instanceof sdk.PermissionDeniedError) return 'Dein API-Key hat keinen Zugriff auf dieses Modell.';
    if (err instanceof sdk.NotFoundError) return 'Das gewählte Modell ist für deinen Account nicht verfügbar.';
    if (err instanceof sdk.RateLimitError) return 'Zu viele Anfragen – bitte einen Moment warten und erneut versuchen.';
    if (err instanceof sdk.APIUserAbortError) return 'Abgebrochen.';
    if (err instanceof sdk.APIConnectionError) return 'Keine Verbindung zur Claude-API. Prüfe deine Internetverbindung.';
    if (err instanceof sdk.APIError) return `Claude-API-Fehler${err.status ? ` ${err.status}` : ''}: ${err.message}`;
  }
  if (err instanceof SyntaxError) return 'Die Antwort von Claude konnte nicht gelesen werden. Bitte erneut versuchen.';
  return err instanceof Error ? err.message : 'Unbekannter Fehler.';
}
