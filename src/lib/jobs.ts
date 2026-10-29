import { isNativeApp, nativeGetJson } from './native';
import { getState } from './store';

// Public job search API of the Bundesagentur für Arbeit (https://jobsuche.api.bund.dev).
const API_KEY = 'jobboerse-jobsuche';
const DIRECT_BASE = 'https://rest.arbeitsagentur.de';
const PROXY_BASE = '/api/ba';
const SEARCH_PATH = '/jobboerse/jobsuche-service/pc/v4/jobs';
const DETAILS_PATH = '/jobboerse/jobsuche-service/pc/v4/jobdetails/';

export interface Job {
  refnr: string;
  title: string;
  occupation: string;
  company: string;
  plz: string;
  city: string;
  region: string;
  distance?: number;
  publishedAt: string;
  startDate: string;
  externalUrl: string;
}

export interface JobQuery {
  what: string;
  where: string;
  radius: number;
  workTime: string;
  offerType: string;
  since: string;
  noAgencies: boolean;
  page: number;
}

export interface JobDetails {
  description: string;
}

interface ApiJob {
  refnr: string;
  titel?: string;
  beruf?: string;
  arbeitgeber?: string;
  arbeitsort?: { plz?: string; ort?: string; region?: string; entfernung?: string | number };
  aktuelleVeroeffentlichungsdatum?: string;
  eintrittsdatum?: string;
  externeUrl?: string;
}

export class JobApiError extends Error {}

// The first base that answers with JSON is remembered for the rest of the session.
let workingBase: string | null = null;

function bases(): string[] {
  if (workingBase) return [workingBase];
  const custom = getState().settings.proxyUrl.trim().replace(/\/+$/, '');
  return [...(custom ? [custom] : []), PROXY_BASE, DIRECT_BASE];
}

const HEADERS = { 'X-API-Key': API_KEY, Accept: 'application/json' };

const statusError = (status: number) =>
  new JobApiError(status === 429 ? 'Zu viele Anfragen in kurzer Zeit – bitte einen Moment warten.' : `Die Jobbörse hat mit Fehler ${status} geantwortet.`);

async function request<T>(path: string, timeoutMs = 15000): Promise<T> {
  // Desktop and Android apps call the API natively, without any proxy.
  if (isNativeApp()) {
    const res = await nativeGetJson(DIRECT_BASE + path, HEADERS).catch(() => {
      throw new JobApiError('Keine Verbindung zur Jobbörse – bitte prüfe deine Internetverbindung.');
    });
    if (res.status >= 400 || !res.data || typeof res.data !== 'object') throw statusError(res.status);
    return res.data as T;
  }
  for (const base of bases()) {
    try {
      const res = await fetch(base + path, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
      // Static hosts without the proxy answer /api/ba with an HTML 404 page: try the next base.
      if (!(res.headers.get('content-type') ?? '').includes('json')) continue;
      if (!res.ok) throw statusError(res.status);
      workingBase = base;
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof JobApiError) throw err;
    }
  }
  throw new JobApiError(
    'Die Jobbörse der Arbeitsagentur ist von dieser Seite aus gerade nicht erreichbar. Auf Vercel oder Netlify (siehe README) oder lokal mit „npm run dev“ funktioniert die Live-Suche.',
  );
}

const toJob = (j: ApiJob): Job => ({
  refnr: j.refnr,
  title: j.titel || j.beruf || 'Stellenangebot',
  occupation: j.beruf ?? '',
  company: j.arbeitgeber || 'Arbeitgeber nicht angegeben',
  plz: j.arbeitsort?.plz ?? '',
  city: j.arbeitsort?.ort ?? '',
  region: j.arbeitsort?.region ?? '',
  distance: j.arbeitsort?.entfernung != null ? Number(j.arbeitsort.entfernung) : undefined,
  publishedAt: j.aktuelleVeroeffentlichungsdatum ?? '',
  startDate: j.eintrittsdatum ?? '',
  externalUrl: j.externeUrl ?? '',
});

export async function searchJobs(q: JobQuery): Promise<{ jobs: Job[]; total: number }> {
  const params = new URLSearchParams({ angebotsart: q.offerType || '1', page: String(q.page), size: '25' });
  if (q.what.trim()) params.set('was', q.what.trim());
  if (q.where.trim()) {
    params.set('wo', q.where.trim());
    params.set('umkreis', String(q.radius));
  }
  if (q.workTime) params.set('arbeitszeit', q.workTime);
  if (q.since) params.set('veroeffentlichtseit', q.since);
  if (q.noAgencies) {
    params.set('zeitarbeit', 'false');
    params.set('pav', 'false');
  }
  const data = await request<{ stellenangebote?: ApiJob[]; maxErgebnisse?: string | number }>(`${SEARCH_PATH}?${params}`);
  const jobs = (data.stellenangebote ?? []).filter((j) => j.refnr).map(toJob);
  return { jobs, total: Number(data.maxErgebnisse ?? jobs.length) || jobs.length };
}

/** Best effort: the details endpoint is not always available, callers fall back to the listing link. */
export async function fetchJobDetails(refnr: string): Promise<JobDetails | null> {
  try {
    const data = await request<Record<string, unknown>>(DETAILS_PATH + encodeURIComponent(btoa(refnr)), 10000);
    const text = typeof data.stellenbeschreibung === 'string' ? data.stellenbeschreibung : '';
    return text ? { description: text.replace(/<[^>]+>/g, '').trim() } : null;
  } catch {
    return null;
  }
}

export const baUrl = (refnr: string) => `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(refnr)}`;

export const jobUrl = (job: Job) => job.externalUrl || baUrl(job.refnr);
