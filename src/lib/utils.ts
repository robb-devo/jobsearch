import { isAndroidApp, shareFile } from './native';

export const cls =(...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

export function parseDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysSince(iso: string): number {
  const d = parseDate(iso);
  if (!d) return Infinity;
  return Math.round((parseDate(todayISO())!.getTime() - d.getTime()) / 86_400_000);
}

const dateFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDate = (iso: string) => {
  const d = parseDate(iso);
  return d ? dateFormat.format(d) : '—';
};

const dateTimeFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "Do., 5. Nov., 10:00" for timestamps and datetime-local values. */
export const formatDateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormat.format(d);
};

export function relativeDays(iso: string): string {
  const n = daysSince(iso);
  if (!Number.isFinite(n)) return '';
  if (n <= 0) return 'heute';
  if (n === 1) return 'gestern';
  if (n < 7) return `vor ${n} Tagen`;
  if (n < 14) return 'vor 1 Woche';
  if (n < 60) return `vor ${Math.floor(n / 7)} Wochen`;
  return `vor ${Math.floor(n / 30)} Monaten`;
}

/** Monday of the current week as yyyy-mm-dd. */
export function startOfWeek(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISODate(d);
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

export function initials(text: string): string {
  const parts = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

const GENDER_SUFFIX = /\s*\((?:[mwdfx]|div|all|gn)(?:\s*[/|,]\s*(?:[mwdfx]|div|gn))*\)/gi;

/** Removes gender suffixes such as "(m/w/d)" from job titles. */
export const cleanTitle = (title: string) => title.replace(GENDER_SUFFIX, '').trim();

/** Lowercase, transliterate umlauts and drop gender suffixes like "(m/w/d)" for fuzzy matching. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(GENDER_SUFFIX, ' ')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}

export const slug = (s: string) => normalizeText(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  if (isAndroidApp()) {
    void shareFile(filename, content).catch(() => undefined);
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Semicolon-separated with BOM so German Excel opens it correctly. */
export function toCSV(rows: string[][]): string {
  const escape = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
