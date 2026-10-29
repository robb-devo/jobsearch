import type { Profile } from './types';
import { cleanTitle } from './utils';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Opens the letter in DIN-5008-like layout and triggers the print dialog (→ "Als PDF speichern"). */
export function printLetter(opts: {
  profile: Profile;
  title: string;
  company: string;
  contact: string;
  location: string;
  body: string;
  language: 'de' | 'en';
}): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  const { profile: p, language } = opts;
  const en = language === 'en';
  const place = p.city.replace(/^\d{4,5}\s*/, '');
  const date = new Date().toLocaleDateString(en ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const sender = [p.name, p.street, p.city, [p.phone, p.email].filter(Boolean).join(' · ')].filter(Boolean);
  const recipient = [opts.company, opts.contact, opts.location].filter(Boolean);
  const title = cleanTitle(opts.title);
  const subject = en ? `Application for the position of ${title}` : `Bewerbung als ${title}`;

  win.document.write(`<!doctype html>
<html lang="${en ? 'en' : 'de'}"><head><meta charset="utf-8">
<title>${escapeHtml(subject)}${opts.company ? ` – ${escapeHtml(opts.company)}` : ''}</title>
<style>
  @page { size: A4; margin: 22mm 20mm 20mm 25mm; }
  body { margin: 0; font: 10.5pt/1.55 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111; }
  .sender { text-align: right; font-size: 9pt; line-height: 1.5; color: #444; }
  .sender strong { font-size: 11pt; color: #111; }
  .recipient { margin-top: 14mm; min-height: 22mm; }
  .date { text-align: right; margin-top: 6mm; }
  h1 { font-size: 11pt; margin: 10mm 0 7mm; }
  .body { white-space: pre-wrap; }
  @media screen { body { max-width: 165mm; margin: 24px auto; padding: 18mm 20mm; box-shadow: 0 2px 18px rgba(0,0,0,.14); } }
</style></head><body>
<div class="sender">${sender.map((l, i) => (i === 0 ? `<strong>${escapeHtml(l)}</strong>` : escapeHtml(l))).join('<br>')}</div>
<div class="recipient">${recipient.map(escapeHtml).join('<br>')}</div>
<div class="date">${escapeHtml(place ? `${place}, ${date}` : date)}</div>
<h1>${escapeHtml(subject)}</h1>
<div class="body">${escapeHtml(opts.body.trim())}</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`);
  win.document.close();
  return true;
}
