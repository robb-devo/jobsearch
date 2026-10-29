import type { Profile } from './types';
import { daysSince, normalizeText } from './utils';

export interface MatchInfo {
  score: number;
  roles: string[];
  skills: string[];
}

interface MatchTarget {
  title: string;
  occupation: string;
  description?: string;
  distance?: number;
  publishedAt?: string;
}

const FILLER = new Set(['und', 'oder', 'mit', 'fuer', 'der', 'die', 'das', 'als', 'bei', 'von', 'zur', 'zum', 'junior', 'senior', 'mitarbeiter', 'mitarbeiterin', 'fachkraft']);

const terms = (s: string) => normalizeText(s).split(/[^a-z0-9+#]+/).filter((w) => w.length > 2 && !FILLER.has(w));

export function containsTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(haystack);
}

/** Lightweight local scoring: desired roles vs. title, skills vs. text, plus distance and freshness. */
export function matchJob(profile: Profile, job: MatchTarget): MatchInfo | null {
  const roles = profile.desiredRoles.length ? profile.desiredRoles : profile.headline ? [profile.headline] : [];
  if (!roles.length && !profile.skills.length) return null;

  const titleText = normalizeText(`${job.title} ${job.occupation}`);
  const fullText = `${titleText} ${normalizeText(job.description ?? '')}`;

  let roleFit = 0;
  const roleHits: string[] = [];
  for (const role of roles) {
    const words = terms(role);
    if (!words.length) continue;
    // Trim long German compounds slightly so "Projektmanagerin" also matches "Projektmanager".
    const hits = words.filter((w) => titleText.includes(w.length > 6 ? w.slice(0, -2) : w)).length;
    const fit = hits / words.length;
    if (fit >= 0.5) roleHits.push(role);
    roleFit = Math.max(roleFit, fit);
  }

  const skillHits = profile.skills
    .filter((s) => {
      const n = normalizeText(s);
      return n.length > 1 && containsTerm(fullText, n);
    })
    .slice(0, 6);

  let score = roleFit * 60 + Math.min(skillHits.length * 8, 24);
  if (job.distance != null) score += job.distance <= 10 ? 10 : job.distance <= 25 ? 7 : job.distance <= 50 ? 4 : 0;
  if (job.publishedAt && daysSince(job.publishedAt) <= 7) score += 6;

  return { score: Math.max(5, Math.min(99, Math.round(score))), roles: roleHits, skills: skillHits };
}
