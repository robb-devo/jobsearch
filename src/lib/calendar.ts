import type { Application } from './types';
import { downloadFile, slug } from './utils';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** Downloads an .ics file so the interview lands in any calendar app, with a reminder one hour before. */
export function downloadInterviewIcs(app: Application) {
  const start = new Date(app.interviewAt);
  if (Number.isNaN(start.getTime())) return;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const description = [app.title, app.contact && `Ansprechperson: ${app.contact}`, app.url].filter(Boolean).join('\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jobsearch//DE',
    'BEGIN:VEVENT',
    `UID:${app.id}@jobsearch`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`Vorstellungsgespräch: ${app.company || app.title}`)}`,
    `DESCRIPTION:${escape(description)}`,
    ...(app.location ? [`LOCATION:${escape(app.location)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Vorstellungsgespräch',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  downloadFile(`gespraech-${slug(app.company || app.title || 'termin')}.ics`, ics, 'text/calendar;charset=utf-8');
}
