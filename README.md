# Jobsearch – dein Bewerbungs-Cockpit

Jobs in der Nähe finden, Bewerbungen im Blick behalten und Anschreiben in Sekunden erstellen – in einer schlanken Web-App, die komplett im Browser läuft. Keine Anmeldung, kein Server, deine Daten bleiben bei dir.

## Funktionen

| Bereich | Was du damit machst |
| --- | --- |
| **Übersicht** | Wochenziel, aktive Bewerbungen, Gespräche, Rücklaufquote, Pipeline und automatisch priorisierte nächste Schritte (z. B. „Bei Firma X nachfassen“). |
| **Jobs finden** | Live-Suche in der Jobbörse der Bundesagentur für Arbeit mit Umkreis, Arbeitszeit, Angebotsart und Zeitarbeits-Filter. Treffer werden nach Passung zu deinem Profil sortiert (Match-Score). Dieselbe Suche mit einem Klick auf LinkedIn, Indeed, StepStone, XING und Google Jobs. |
| **Bewerbungen** | Tracker-Tabelle mit Status (Gemerkt → In Vorbereitung → Beworben → Gespräch → Angebot/Absage), Bewerbungs- und Nachfassdatum (wird automatisch auf +7 Tage gesetzt), Notizen, Checkliste pro Bewerbung, Arbeitgeber-Recherche (kununu, LinkedIn, News) und CSV-Export. |
| **Anschreiben & KI** | Anschreiben, Bewerbungs-E-Mail, Recruiter-Nachricht, Stellen-Check und Interview-Vorbereitung – auf Deutsch oder Englisch, klassisch oder modern. Mit eigenem API-Key direkt per Claude, ohne Key per „In Claude öffnen“ (Prompt wird kopiert). Anschreiben lassen sich im Briefformat drucken bzw. als PDF speichern. |
| **Profil & Lebenslauf** | Lebenslauf (PDF, DOCX, TXT) und LinkedIn-PDF hochladen. Kontaktdaten, Skills und Sprachen werden automatisch erkannt; mit Claude zusätzlich Wunschpositionen und Kurzprofil. |
| **Checkliste** | Unterlagen, Online-Präsenz, Strategie und Vorstellungsgespräch – zum Abhaken. |

**LinkedIn:** LinkedIn bietet keine öffentliche Schnittstelle für Profile oder Jobs. Deshalb: Profil auf LinkedIn als PDF exportieren („Mehr“ → „Als PDF speichern“) und hochladen; Jobsuche und Recruiter-Recherche öffnen LinkedIn mit vorausgefüllter Suche.

## Online stellen (empfohlen: Vercel, kostenlos)

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New… → Project** → Repository `jobsearch` importieren → **Deploy**.
2. Fertig. Vercel erkennt Vite automatisch, jeder Push auf `main` aktualisiert die Seite.

Die `vercel.json` leitet `/api/ba/*` an die Arbeitsagentur-API weiter, damit die Live-Jobsuche im Browser funktioniert (die API ist für direkte Browser-Anfragen fremder Domains nicht gedacht).

**Alternativen**

- **Netlify:** Repository importieren – `netlify.toml` enthält Build und Proxy bereits.
- **GitHub Pages:** Unter *Settings → Pages* „GitHub Actions“ als Quelle wählen und den Workflow *Deploy to GitHub Pages (optional)* manuell starten. Alles funktioniert – nur die Live-Jobsuche braucht ggf. einen Proxy (in den Einstellungen der App hinterlegbar); die Links zu den anderen Jobbörsen gehen immer.

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft dann unter http://localhost:5173 – inklusive Proxy für die Jobsuche.

## KI (Claude) verbinden

1. API-Key in der [Anthropic Console](https://console.anthropic.com/settings/keys) erstellen.
2. In der App unter **Einstellungen** einfügen, Modell wählen (Standard: Claude Opus 5.5) und „Verbindung testen“.

Der Key wird nur im `localStorage` deines Browsers gespeichert und direkt an die Anthropic-API gesendet – nutze die App mit Key daher nur auf deinem eigenen Gerät. Backups enthalten den Key nicht. Für Opus und Sonnet ist der serverseitige Refusal-Fallback von Anthropic aktiviert (`fallbacks: "default"`).

## Daten & Datenschutz

- Alle Daten (Profil, Lebenslauf-Text, Bewerbungen) liegen ausschließlich im Browser (`localStorage`).
- Lebensläufe werden lokal ausgelesen (pdf.js, mammoth) – es wird nichts hochgeladen.
- Unter **Einstellungen → Daten & Backup** lässt sich alles als JSON sichern, auf ein anderes Gerät übertragen oder löschen.

## Technik

React 19 · TypeScript · Vite · pdf.js · mammoth · Anthropic TypeScript SDK · lucide-react · Inter. Keine Server-Komponente, kein Tracking.

```
src/
  App.tsx            Layout, Navigation, Routing (Hash-basiert)
  views/             Übersicht, Jobs, Bewerbungen, Anschreiben, Profil, Checkliste, Einstellungen
  components/ui.tsx  Buttons, Cards, Dialoge, Toasts, Tag-Eingabe …
  lib/               Store (localStorage), Jobsuche-API, Match-Score, Lebenslauf-Import, Claude-Anbindung
```
