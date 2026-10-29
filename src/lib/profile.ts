import type { Profile } from './types';

export function profileChecks(p: Profile) {
  return [
    { label: 'Lebenslauf oder LinkedIn importiert', done: Boolean(p.cvText || p.linkedinText) },
    { label: 'Wunschposition angegeben', done: p.desiredRoles.length > 0 },
    { label: 'Suchort festgelegt', done: Boolean(p.searchLocation) },
    { label: 'Mindestens 3 Skills', done: p.skills.length >= 3 },
    { label: 'Name & Kontaktdaten', done: Boolean(p.name && p.email) },
    { label: 'Kurzprofil geschrieben', done: Boolean(p.summary) },
  ];
}

export function profileCompleteness(p: Profile): number {
  const checks = profileChecks(p);
  return Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
}

/** Fills only empty fields and adds new list entries, so manual edits are never overwritten. */
export function mergeProfile(current: Profile, found: Partial<Profile>): { patch: Partial<Profile>; filled: number } {
  const patch: Record<string, unknown> = {};
  let filled = 0;
  for (const [key, value] of Object.entries(found)) {
    const existing = current[key as keyof Profile];
    if (Array.isArray(value) && Array.isArray(existing)) {
      const additions = value.filter(
        (v): v is string => typeof v === 'string' && v.trim() !== '' && !existing.some((e) => e.toLowerCase() === v.trim().toLowerCase()),
      );
      if (additions.length) {
        patch[key] = [...existing, ...additions.map((v) => v.trim())];
        filled++;
      }
    } else if (typeof value === 'string' && value.trim() && typeof existing === 'string' && !existing.trim()) {
      patch[key] = value.trim();
      filled++;
    }
  }
  // Use the home town as search location if none is set yet.
  const city = (patch.city as string | undefined) ?? '';
  if (city && !current.searchLocation) patch.searchLocation = city.replace(/^\d{4,5}\s*/, '');
  return { patch: patch as Partial<Profile>, filled };
}
