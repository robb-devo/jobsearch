import { useRef, useState } from 'react';
import { ArrowUpRight, Download, Eye, EyeOff, KeyRound, Monitor, Smartphone, Trash, Upload } from 'lucide-react';
import { Button, Card, Field, PageHeader, Segmented, toast } from '../components/ui';
import { MODELS, describeAiError, testConnection } from '../lib/ai';
import { RELEASES_URL } from '../lib/content';
import { isNativeApp } from '../lib/native';
import { useInstallPrompt } from '../lib/pwa';
import { actions, getState, useStore } from '../lib/store';
import type { Theme } from '../lib/types';
import { downloadFile, todayISO } from '../lib/utils';

function AppDownloads() {
  const install = useInstallPrompt();
  return (
    <Card title="Jobsearch als App" description="Eigenes Fenster, Symbol auf Desktop bzw. Homescreen, offline nutzbar. Daten nimmst du per Backup mit (siehe unten).">
      <div className="app-tiles">
        <a className="app-tile" href={RELEASES_URL} target="_blank" rel="noreferrer">
          <Monitor size={20} />
          <span>
            <strong>Windows</strong>
            <small>Installer oder portable .exe</small>
          </span>
          <ArrowUpRight size={15} />
        </a>
        <a className="app-tile" href={RELEASES_URL} target="_blank" rel="noreferrer">
          <Smartphone size={20} />
          <span>
            <strong>Android</strong>
            <small>.apk direkt aufs Handy</small>
          </span>
          <ArrowUpRight size={15} />
        </a>
        {install && (
          <button type="button" className="app-tile" onClick={() => void install()}>
            <Download size={20} />
            <span>
              <strong>Aus dem Browser</strong>
              <small>Mit einem Klick installieren</small>
            </span>
          </button>
        )}
      </div>
    </Card>
  );
}

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function test() {
    setTesting(true);
    try {
      await testConnection(settings.apiKey, settings.model);
      toast('Verbindung erfolgreich – Claude ist startklar.');
    } catch (err) {
      toast(describeAiError(err), 'error');
    } finally {
      setTesting(false);
    }
  }

  function exportBackup() {
    const state = getState();
    // The API key never leaves the browser, not even in backups.
    const backup = { ...state, settings: { ...state.settings, apiKey: '' } };
    downloadFile(`jobsearch-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json');
  }

  async function importBackup(file: File) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !('applications' in data || 'profile' in data)) throw new Error('invalid');
      const apiKey = getState().settings.apiKey;
      actions.importData(data);
      if (apiKey && !getState().settings.apiKey) actions.updateSettings({ apiKey });
      toast('Backup importiert');
    } catch {
      toast('Die Datei ist kein gültiges Jobsearch-Backup.', 'error');
    }
  }

  function reset() {
    if (!confirm('Wirklich alle Daten löschen – Profil, Bewerbungen und Einstellungen? Das lässt sich nicht rückgängig machen.')) return;
    actions.reset();
    toast('Alle Daten gelöscht', 'info');
  }

  return (
    <>
      <PageHeader title="Einstellungen" description="KI-Anbindung, Ziele, Darstellung und deine Daten." />
      <div className="stack narrow">
        {!isNativeApp() && <AppDownloads />}
        <Card title="Claude verbinden" description="Für KI-Anschreiben, Stellen-Checks und automatisches Profil-Ausfüllen.">
          <div className="stack">
            <Field
              label="Anthropic API-Key"
              hint={
                <>
                  Erstelle einen Key in der{' '}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
                    Anthropic Console
                  </a>
                  . Ein Anschreiben kostet je nach Modell meist nur wenige Cent.
                </>
              }
            >
              <div className="row">
                <input
                  className="input"
                  type={showKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => actions.updateSettings({ apiKey: e.target.value.trim() })}
                  placeholder="sk-ant-…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button icon={showKey ? EyeOff : Eye} onClick={() => setShowKey((v) => !v)} aria-label={showKey ? 'Key verbergen' : 'Key anzeigen'} />
              </div>
            </Field>
            <div className="option-list" role="radiogroup" aria-label="Modell">
              {MODELS.map((m) => (
                <label key={m.id} className="option">
                  <input type="radio" name="model" checked={settings.model === m.id} onChange={() => actions.updateSettings({ model: m.id })} />
                  <span>
                    <strong>{m.label}</strong>
                    <small>{m.description}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="row wrap">
              <Button variant="primary" icon={KeyRound} disabled={!settings.apiKey} loading={testing} onClick={test}>
                Verbindung testen
              </Button>
            </div>
            <p className="info-box">
              <strong>Datenschutz:</strong> Der Key wird nur lokal in diesem Browser gespeichert und direkt an die Anthropic-API gesendet. Nutze die App dafür nur auf deinem eigenen Gerät.
              <br />
              <strong>Ohne Key:</strong> Im Bereich „Anschreiben & KI“ kopiert „In Claude öffnen“ den fertigen Prompt – einfach in claude.ai einfügen.
            </p>
          </div>
        </Card>

        <Card title="Ziele & Darstellung">
          <div className="form-grid">
            <Field label="Wochenziel (Bewerbungen)" hint="Erscheint als Fortschritt in der Übersicht.">
              <input
                className="input"
                type="number"
                min={1}
                max={50}
                value={settings.weeklyGoal}
                onChange={(e) => actions.updateSettings({ weeklyGoal: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
              />
            </Field>
            <Field label="Farbschema">
              <Segmented<Theme>
                value={settings.theme}
                onChange={(theme) => actions.updateSettings({ theme })}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Hell' },
                  { value: 'dark', label: 'Dunkel' },
                ]}
              />
            </Field>
          </div>
        </Card>

        <Card title="Daten & Backup" description="Alle Daten liegen ausschließlich in diesem Browser. Sichere sie regelmäßig oder übertrage sie so auf ein anderes Gerät.">
          <div className="row wrap">
            <Button icon={Download} onClick={exportBackup}>
              Backup herunterladen
            </Button>
            <Button icon={Upload} onClick={() => fileRef.current?.click()}>
              Backup einspielen
            </Button>
            <span className="spacer" />
            <Button variant="danger" icon={Trash} onClick={reset}>
              Alle Daten löschen
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importBackup(file);
                e.target.value = '';
              }}
            />
          </div>
        </Card>

        <Card title="Jobsuche (erweitert)" description="Nur nötig, wenn die Live-Suche auf deinem Hosting nicht funktioniert.">
          <Field label="Eigene Proxy-URL" hint="Leer lassen für die Standardeinstellung. Auf Vercel und Netlify ist der Proxy bereits eingerichtet (/api/ba).">
            <input
              className="input"
              value={settings.proxyUrl}
              onChange={(e) => actions.updateSettings({ proxyUrl: e.target.value.trim() })}
              placeholder="https://mein-proxy.example.com"
            />
          </Field>
        </Card>
      </div>
    </>
  );
}
