# Jobsearch – dein Bewerbungs-Cockpit

Jobs in der Nähe finden, Bewerbungen im Blick behalten und Anschreiben in Sekunden erstellen. Als Web-App, Windows-App und Android-App – ohne Anmeldung, ohne Server, deine Daten bleiben auf deinem Gerät.

## Funktionen

| Bereich | Was du damit machst |
| --- | --- |
| **Übersicht** | Wochenziel, Pipeline, Rücklaufquote, Job-Alarme mit neuen Treffern und automatisch priorisierte nächste Schritte („Bei Firma X nachfassen“, „Gespräch am Do., 10:00 vorbereiten“). |
| **Jobs finden** | Live-Suche in der Jobbörse der Bundesagentur für Arbeit mit Umkreis und Filtern, sortiert nach Passung zu deinem Profil. „Neu“-Markierung für noch nicht gesehene Stellen, Hinweis bei Firmen, die schon im Tracker sind, Pendelweg per Google Maps. Suchen lassen sich als **Job-Alarm** speichern. Dieselbe Suche mit einem Klick auf LinkedIn, Indeed, StepStone, XING und Google Jobs. |
| **Bewerbungen** | Als Tabelle oder **Kanban-Board mit Drag & Drop**. Status, Bewerbungs- und Nachfassdatum (automatisch +7 Tage), **Gesprächstermin mit Kalender-Export (.ics)**, Verlauf aller Statuswechsel, Checkliste pro Bewerbung, Arbeitgeber-Recherche und CSV-Export. |
| **Anschreiben & KI** | Anschreiben, Bewerbungs-E-Mail, Recruiter-Nachricht, Stellen-Check, Interview-Vorbereitung, **Lebenslauf-Tuning**, **Nachfass-** und **Danke-Mail** – mit Claude oder per „In Claude öffnen“ ohne API-Key. Anschreiben im Briefformat drucken bzw. als PDF speichern. |
| **ATS-Check** | Sobald eine Stellenbeschreibung drin ist: Welche Schlüsselbegriffe der Anzeige stehen in deinem Lebenslauf, welche fehlen? Läuft lokal, ohne KI. |
| **Profil & Lebenslauf** | Lebenslauf (PDF, DOCX, TXT) und LinkedIn-PDF hochladen; Kontaktdaten, Skills und Sprachen werden erkannt, mit Claude auch Wunschpositionen und Kurzprofil. |
| **Schnellsuche** | `Strg + K` (Mac: `⌘ K`): überall hinspringen, Bewerbungen öffnen oder direkt Jobs suchen. |

**LinkedIn:** LinkedIn bietet keine öffentliche Schnittstelle. Deshalb Profil auf LinkedIn als PDF speichern („Mehr“ → „Als PDF speichern“) und hochladen; Jobsuche und Recruiter-Recherche öffnen LinkedIn mit vorausgefüllter Suche.

## Apps für Windows & Android

Bei jedem Push auf den Standard-Branch baut der Workflow **Apps (Windows & Android)** automatisch:

- `Jobsearch-Setup-x.y.z.exe` – Windows-Installer (oder `Jobsearch-Portable-…exe` ohne Installation)
- `Jobsearch-x.y.z.apk` – Android-App

Beides liegt danach unter **[Releases](../../releases/latest)**. Hinweise:

- **Windows** zeigt bei unsignierten Apps eine SmartScreen-Warnung → „Weitere Informationen“ → „Trotzdem ausführen“.
- **Android:** APK auf dem Handy öffnen und „Installation aus dieser Quelle zulassen“ bestätigen. Updates lassen sich direkt drüber installieren, die Daten bleiben erhalten (der Signaturschlüssel liegt dafür unter `.github/android-debug.keystore` – nur für den privaten Gebrauch gedacht).
- **Browser:** Die Web-Version lässt sich in Chrome/Edge und auf Android über „App installieren“ als eigenständige App hinzufügen und funktioniert offline.

Jede Variante speichert ihre Daten auf dem eigenen Gerät. Zum Umziehen: *Einstellungen → Backup herunterladen* und in der anderen App *Backup einspielen*.

Technik: Die Desktop-App ist ein schlanker Electron-Wrapper (`electron/`), die Android-App nutzt Capacitor (`capacitor.config.json`, Icons in `assets/`). Beide rufen die Jobbörse nativ ab, daher funktioniert die Live-Suche dort ohne Proxy.

## Web-Version online stellen (Vercel, kostenlos)

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New… → Project** → Repository `jobsearch` importieren → **Deploy**.
2. Fertig. Jeder Push aktualisiert die Seite. `vercel.json` leitet `/api/ba/*` an die Arbeitsagentur-API weiter, damit die Live-Jobsuche im Browser funktioniert.

Alternativ **Netlify** (`netlify.toml` ist enthalten) oder **GitHub Pages** (Workflow *Deploy to GitHub Pages*, manuell starten; die Live-Jobsuche braucht dort ggf. einen eigenen Proxy).

## Lokal starten

```bash
npm install
npm run dev
```

## KI (Claude) verbinden

1. API-Key in der [Anthropic Console](https://console.anthropic.com/settings/keys) erstellen.
2. In der App unter **Einstellungen** einfügen, Modell wählen (Standard: Claude Opus 5.5) und „Verbindung testen“.

Der Key wird nur lokal gespeichert und direkt an die Anthropic-API gesendet; Backups enthalten ihn nicht. Für Opus und Sonnet ist der serverseitige Refusal-Fallback aktiv (`fallbacks: "default"`).

## Technik

React 19 · TypeScript · Vite · pdf.js · mammoth · Anthropic TypeScript SDK · Capacitor · Electron · lucide-react · Inter. Kein Backend, kein Tracking.

```
src/
  App.tsx              Layout, Navigation, Routing (Hash-basiert)
  views/               Übersicht, Jobs, Bewerbungen, Anschreiben, Profil, Checkliste, Einstellungen
  components/          UI-Bausteine, Schnellsuche (Strg+K), ATS-Check
  lib/                 Store (localStorage), Jobsuche-API, Match & Keywords, Lebenslauf-Import, Claude, Kalender, App-Brücken
electron/              Desktop-App (Windows)
public/                Manifest, Service Worker, Icons
```
