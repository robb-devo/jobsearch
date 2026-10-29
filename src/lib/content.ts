import type { Profile, Status } from './types';
import { cleanTitle, slug } from './utils';

/** Desktop (.exe) and Android (.apk) builds are published here by the "Apps" workflow. */
export const RELEASES_URL = 'https://github.com/robb-devo/jobsearch/releases/latest';

export const STATUS_ORDER: Status[] = ['saved', 'preparing', 'applied', 'interview', 'offer', 'rejected'];

export const STATUS_LABEL: Record<Status, string> = {
  saved: 'Gemerkt',
  preparing: 'In Vorbereitung',
  applied: 'Beworben',
  interview: 'Gespräch',
  offer: 'Angebot',
  rejected: 'Absage',
};

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 200];

export const WORKTIME_OPTIONS = [
  { value: '', label: 'Alle Arbeitszeiten' },
  { value: 'vz', label: 'Vollzeit' },
  { value: 'tz', label: 'Teilzeit' },
  { value: 'ho', label: 'Homeoffice' },
  { value: 'mj', label: 'Minijob' },
] as const;

export const OFFER_OPTIONS = [
  { value: '1', label: 'Jobs' },
  { value: '4', label: 'Ausbildung / Duales Studium' },
  { value: '34', label: 'Praktikum / Trainee' },
];

export const SINCE_OPTIONS = [
  { value: '', label: 'Beliebiges Datum' },
  { value: '1', label: 'Seit gestern' },
  { value: '7', label: 'Letzte 7 Tage' },
  { value: '14', label: 'Letzte 14 Tage' },
  { value: '30', label: 'Letzte 30 Tage' },
];

export function jobBoardLinks(what: string, where: string, radius: number) {
  const q = encodeURIComponent(what.trim());
  const l = encodeURIComponent(where.trim());
  const miles = [5, 10, 25, 50, 100].find((m) => m >= radius / 1.6) ?? 100;
  const google = encodeURIComponent(`${what} jobs ${where}`.trim());
  return [
    { name: 'LinkedIn Jobs', url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}&distance=${miles}` },
    { name: 'Indeed', url: `https://de.indeed.com/jobs?q=${q}&l=${l}&radius=${radius}` },
    {
      name: 'StepStone',
      url: `https://www.stepstone.de/jobs/${slug(what) || 'alle'}${where.trim() ? `/in-${slug(where)}` : ''}?radius=${radius}`,
    },
    { name: 'XING Jobs', url: `https://www.xing.com/jobs/search?keywords=${q}&location=${l}&radius=${radius}` },
    { name: 'Google Jobs', url: `https://www.google.com/search?q=${google}&ibp=htl;jobs` },
    {
      name: 'Arbeitsagentur',
      url: `https://www.arbeitsagentur.de/jobsuche/suche?angebotsart=1&was=${q}&wo=${l}&umkreis=${radius}`,
    },
  ];
}

export function companyLinks(company: string) {
  const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  return [
    { name: 'Bewertungen auf kununu', url: search(`${company} kununu`) },
    { name: 'Unternehmensseite auf LinkedIn', url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}` },
    { name: 'Recruiter & Ansprechpersonen', url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company} recruiting`)}` },
    { name: 'Aktuelle News', url: `${search(company)}&tbm=nws` },
  ];
}

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export const CHECKLIST_GROUPS: { id: string; title: string; description: string; items: ChecklistItem[] }[] = [
  {
    id: 'docs',
    title: 'Unterlagen',
    description: 'Die Basis jeder Bewerbung',
    items: [
      { id: 'cv-current', label: 'Lebenslauf aktuell und lückenlos', hint: 'Max. 2 Seiten, neueste Station zuerst, Erfolge statt Aufgaben.' },
      { id: 'cv-pdf', label: 'Lebenslauf als PDF gespeichert', hint: 'Dateiname z. B. „Nachname_Vorname_Lebenslauf.pdf“.' },
      { id: 'certificates', label: 'Zeugnisse & Zertifikate gesammelt', hint: 'Arbeitszeugnisse, Abschlüsse, relevante Weiterbildungen.' },
      { id: 'bundle', label: 'Alles in einer PDF unter 5 MB', hint: 'Anschreiben, Lebenslauf, Anlagen – in dieser Reihenfolge.' },
      { id: 'photo', label: 'Professionelles Foto (optional)', hint: 'In Deutschland verbreitet, aber kein Muss.' },
    ],
  },
  {
    id: 'online',
    title: 'Online-Präsenz',
    description: 'Recruiter googeln dich – sei vorbereitet',
    items: [
      { id: 'li-profile', label: 'LinkedIn-Profil aktualisiert', hint: 'Foto, klare Headline, Info-Text mit relevanten Keywords.' },
      { id: 'li-open', label: '„Open to Work“ aktiviert', hint: 'Auf Wunsch nur für Recruiter sichtbar.' },
      { id: 'xing', label: 'XING-Profil gepflegt (falls relevant)', hint: 'Im DACH-Raum besonders im Mittelstand verbreitet.' },
      { id: 'google-self', label: 'Eigenen Namen gegoogelt', hint: 'Unpassende Inhalte entfernen oder privat stellen.' },
      { id: 'email', label: 'Seriöse E-Mail-Adresse', hint: 'Am besten vorname.nachname@…' },
    ],
  },
  {
    id: 'strategy',
    title: 'Strategie',
    description: 'Gezielt statt mit der Gießkanne',
    items: [
      { id: 'target-roles', label: '2–3 Zielpositionen festgelegt', hint: 'Im Profil hinterlegen – dann passen die Jobvorschläge.' },
      { id: 'target-companies', label: '10 Wunscharbeitgeber notiert', hint: 'Als „Gemerkt“ im Tracker anlegen.' },
      { id: 'weekly-goal', label: 'Wochenziel definiert', hint: 'Lieber 5 gezielte als 20 generische Bewerbungen.' },
      { id: 'network', label: 'Netzwerk aktiviert', hint: '5 Kontakte anschreiben: Ex-Kolleg:innen, Freunde, Alumni.' },
      { id: 'pitch', label: 'Elevator Pitch geübt', hint: '60 Sekunden: Wer bin ich, was kann ich, was suche ich?' },
    ],
  },
  {
    id: 'interview',
    title: 'Vorstellungsgespräch',
    description: 'Wenn die Einladung kommt',
    items: [
      { id: 'star', label: '5 Erfolgsbeispiele vorbereitet', hint: 'STAR-Methode: Situation, Aufgabe, Aktion, Resultat – mit Zahlen.' },
      { id: 'questions', label: 'Eigene Fragen notiert', hint: 'Team, Einarbeitung, Erwartungen an die ersten 100 Tage.' },
      { id: 'salary', label: 'Gehaltsvorstellung recherchiert', hint: 'Realistische Spanne mit Begründung.' },
      { id: 'thanks', label: 'Danke-Mail nach dem Gespräch', hint: 'Innerhalb von 24 Stunden, kurz und persönlich.' },
    ],
  },
];

export const APPLICATION_CHECKLIST: ChecklistItem[] = [
  { id: 'read', label: 'Anzeige genau gelesen, Keywords notiert' },
  { id: 'research', label: 'Unternehmen recherchiert' },
  { id: 'contact', label: 'Ansprechperson herausgefunden' },
  { id: 'cv', label: 'Lebenslauf auf die Stelle angepasst' },
  { id: 'letter', label: 'Anschreiben individuell formuliert' },
  { id: 'proofread', label: 'Rechtschreibung geprüft' },
  { id: 'sent', label: 'Bewerbung abgeschickt' },
  { id: 'followup', label: 'Nach 7–10 Tagen nachgefasst' },
];

export const TIPS = [
  'Bewirb dich möglichst in den ersten 72 Stunden nach Veröffentlichung – dann ist die Aufmerksamkeit am höchsten.',
  'Übernimm wichtige Begriffe aus der Anzeige wörtlich: Viele Unternehmen filtern Bewerbungen automatisch vor.',
  'Zahlen überzeugen: „Bearbeitungszeit um 30 % gesenkt“ wirkt stärker als „verantwortlich für Prozesse“.',
  'Ein kurzer Anruf vor der Bewerbung zeigt echtes Interesse – und liefert Material für dein Anschreiben.',
  'Fasse nach 7–10 Tagen freundlich nach. Das wirkt engagiert, nicht aufdringlich.',
  'Qualität vor Quantität: Fünf gezielte Bewerbungen bringen meist mehr als zwanzig generische.',
  'Sei auf LinkedIn sichtbar: Ein Beitrag oder Kommentar pro Woche bringt dich bei Recruitern ins Gespräch.',
];

/** Common skills recognised in uploaded CVs without AI. */
export const SKILL_DICTIONARY = [
  'Microsoft Office', 'MS Office', 'Excel', 'PowerPoint', 'MS Word', 'Outlook', 'SAP', 'SAP S/4HANA', 'DATEV', 'Lexware',
  'Salesforce', 'HubSpot', 'CRM', 'ERP', 'Jira', 'Confluence', 'Notion', 'Asana', 'MS Project', 'Projektmanagement',
  'Scrum', 'Kanban', 'Agile', 'PRINCE2', 'PMP', 'Lean', 'Six Sigma', 'Controlling', 'Buchhaltung', 'Finanzbuchhaltung',
  'Lohnbuchhaltung', 'Rechnungswesen', 'Einkauf', 'Vertrieb', 'Key Account Management', 'Business Development', 'Marketing',
  'Online-Marketing', 'Performance Marketing', 'SEO', 'SEA', 'Google Ads', 'Social Media', 'Content Marketing',
  'Google Analytics', 'Kundenservice', 'Customer Success', 'Recruiting', 'Personalwesen', 'Logistik', 'Supply Chain',
  'Qualitätsmanagement', 'ISO 9001', 'Teamführung', 'Führungserfahrung', 'Präsentation', 'Verhandlung', 'Moderation',
  'Datenanalyse', 'Data Analysis', 'Reporting', 'Power BI', 'Tableau', 'SQL', 'Python', 'Java', 'JavaScript',
  'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'PHP', 'C#', '.NET', 'C++', 'Kotlin', 'Swift', 'HTML', 'CSS',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Linux', 'Git', 'CI/CD', 'DevOps', 'Terraform',
  'Machine Learning', 'Künstliche Intelligenz', 'Figma', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro',
  'UX Design', 'UI Design', 'AutoCAD', 'SolidWorks', 'CATIA', 'SPS', 'Elektrotechnik', 'Pflege', 'Erste Hilfe',
  'Führerschein Klasse B', 'Staplerschein',
];

/** German language names, with English spellings as they appear in English LinkedIn exports. */
export const LANGUAGE_NAMES: Record<string, string> = {
  deutsch: 'Deutsch', german: 'Deutsch',
  englisch: 'Englisch', english: 'Englisch',
  franzoesisch: 'Französisch', french: 'Französisch',
  spanisch: 'Spanisch', spanish: 'Spanisch',
  italienisch: 'Italienisch', italian: 'Italienisch',
  portugiesisch: 'Portugiesisch', portuguese: 'Portugiesisch',
  niederlaendisch: 'Niederländisch', dutch: 'Niederländisch',
  polnisch: 'Polnisch', polish: 'Polnisch',
  russisch: 'Russisch', russian: 'Russisch',
  tuerkisch: 'Türkisch', turkish: 'Türkisch',
  arabisch: 'Arabisch', arabic: 'Arabisch',
  ukrainisch: 'Ukrainisch', ukrainian: 'Ukrainisch',
  chinesisch: 'Chinesisch', chinese: 'Chinesisch',
  japanisch: 'Japanisch', japanese: 'Japanisch',
};

function joinList(items: string[], and: string): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}` : items[0] ?? '';
}

export function salutation(contact: string, language: 'de' | 'en'): string {
  const c = contact.trim();
  if (language === 'en') {
    if (/^frau\s+/i.test(c)) return `Dear Ms ${c.replace(/^frau\s+/i, '')},`;
    if (/^herr\s+/i.test(c)) return `Dear Mr ${c.replace(/^herr\s+/i, '')},`;
    return c ? `Dear ${c},` : 'Dear Hiring Team,';
  }
  if (/^frau\s+/i.test(c)) return `Sehr geehrte ${c},`;
  if (/^herr\s+/i.test(c)) return `Sehr geehrter ${c},`;
  return 'Sehr geehrte Damen und Herren,';
}

/** Offline fallback when no AI is connected: a solid letter with clearly marked placeholders. */
export function coverLetterTemplate(
  p: Profile,
  job: { title: string; company: string; contact: string },
  language: 'de' | 'en',
): string {
  const title = cleanTitle(job.title) || (language === 'en' ? '[position]' : '[Position]');
  const company = job.company.trim() || (language === 'en' ? '[company]' : '[Unternehmen]');
  const skills = p.skills.slice(0, 3);
  const name = p.name.trim() || (language === 'en' ? '[Your name]' : '[Dein Name]');

  if (language === 'en') {
    const role = p.headline.trim() || '[current role]';
    const years = p.experienceYears.trim() ? `${p.experienceYears.trim()} years of experience` : '[X] years of experience';
    return `${salutation(job.contact, 'en')}

Your opening for the position of ${title} immediately caught my attention because it builds on exactly what I do best. As a ${role} with ${years}, I would love to bring my expertise to ${company}.

My core strengths include ${skills.length ? joinList(skills, 'and') : '[your key skills]'}. [A concrete project or result that fits the role – ideally with numbers.]

What draws me to ${company} in particular is [what convinces you about the company: products, values, projects]. I work in a structured, solution-oriented way and enjoy taking ownership as part of a team.

I am available ${p.availableFrom.trim() ? `from ${p.availableFrom.trim()}` : '[immediately / from DATE]'} and would be delighted to discuss in a personal conversation how I can contribute to your team.

Kind regards

${name}`;
  }

  const role = p.headline.trim() || '[aktuelle Position]';
  const years = p.experienceYears.trim() ? `${p.experienceYears.trim()} Jahren Berufserfahrung` : '[X] Jahren Berufserfahrung';
  return `${salutation(job.contact, 'de')}

Ihre Ausschreibung für die Position als ${title} hat mich sofort angesprochen, denn sie setzt genau dort an, wo meine Stärken liegen. Als ${role} mit ${years} möchte ich meine Erfahrung künftig bei ${company} einbringen.

Zu meinen Kernkompetenzen gehören ${skills.length ? joinList(skills, 'und') : '[deine wichtigsten Kompetenzen]'}. [Ein konkretes Projekt oder Ergebnis, das zur Stelle passt – am besten mit Zahlen.]

An ${company} reizt mich besonders [was dich am Unternehmen überzeugt: Produkte, Werte, Projekte]. Ich arbeite strukturiert und lösungsorientiert, übernehme gern Verantwortung und schätze die Zusammenarbeit im Team.

Ich stehe Ihnen ${p.availableFrom.trim() ? `ab ${p.availableFrom.trim()}` : '[ab sofort / zum TT.MM.JJJJ]'} zur Verfügung und freue mich darauf, Sie in einem persönlichen Gespräch von mir zu überzeugen.

Mit freundlichen Grüßen

${name}`;
}
