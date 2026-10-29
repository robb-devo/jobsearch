import { useEffect, useRef, useState } from 'react';
import { ClipboardCopy, Copy, Download, ExternalLink, FileText, GraduationCap, Lightbulb, Mail, MessageSquareText, Printer, Save, Sparkles, Square, Target, WandSparkles, type LucideIcon } from 'lucide-react';
import { Button, Card, Field, PageHeader, Segmented, toast } from '../components/ui';
import { buildPrompt, describeAiError, generate, promptForClaudeAi, type DocKind, type PromptInput } from '../lib/ai';
import { coverLetterTemplate } from '../lib/content';
import { printLetter } from '../lib/print';
import { useRoute } from '../lib/router';
import { actions, useStore } from '../lib/store';
import { cls, copyText, downloadFile, slug, wordCount } from '../lib/utils';

const KINDS: { id: DocKind; label: string; description: string; icon: LucideIcon }[] = [
  { id: 'letter', label: 'Anschreiben', description: 'Individuell, auf die Stelle zugeschnitten', icon: FileText },
  { id: 'email', label: 'Bewerbungs-E-Mail', description: 'Kurzer Begleittext mit Betreff', icon: Mail },
  { id: 'linkedin', label: 'Recruiter-Nachricht', description: 'Für LinkedIn oder XING', icon: MessageSquareText },
  { id: 'analysis', label: 'Stellen-Check', description: 'Passung, Lücken und Keywords', icon: Target },
  { id: 'interview', label: 'Interview-Vorbereitung', description: 'Fragen, Antworten, Rückfragen', icon: GraduationCap },
];

interface JobFields {
  title: string;
  company: string;
  location: string;
  contact: string;
  description: string;
}

const EMPTY_JOB: JobFields = { title: '', company: '', location: '', contact: '', description: '' };

export default function Writer() {
  const route = useRoute();
  const apps = useStore((s) => s.applications);
  const profile = useStore((s) => s.profile);
  const { apiKey, model } = useStore((s) => s.settings);

  const [appId, setAppId] = useState(() => route.params.get('app') ?? '');
  const app = apps.find((a) => a.id === appId);
  const [manual, setManual] = useState<JobFields>(EMPTY_JOB);
  const job: JobFields = app ? { title: app.title, company: app.company, location: app.location, contact: app.contact, description: app.description } : manual;

  const [kind, setKind] = useState<DocKind>(() => (KINDS.some((k) => k.id === route.params.get('kind')) ? (route.params.get('kind') as DocKind) : 'letter'));
  const [tone, setTone] = useState<'formal' | 'modern'>('formal');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [output, setOutput] = useState(() => (kind === 'letter' ? (app?.coverLetter ?? '') : ''));
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setJob = (patch: Partial<JobFields>) => (app ? actions.updateApplication(app.id, patch) : setManual((m) => ({ ...m, ...patch })));
  const input = (): PromptInput => ({ kind, tone, language, job, profile });
  const kindLabel = KINDS.find((k) => k.id === kind)!.label;

  async function runAi() {
    if (!apiKey) {
      toast('Verbinde Claude in den Einstellungen – oder nutze „In Claude öffnen“.', 'info');
      return;
    }
    if (!job.title.trim() && !job.description.trim()) {
      toast('Gib mindestens die Position oder die Stellenbeschreibung an.', 'error');
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setOutput('');
    try {
      const text = await generate({ apiKey, model, prompt: buildPrompt(input()), signal: controller.signal, onText: (delta) => setOutput((o) => o + delta) });
      setOutput(text.trim());
      toast('Fertig! Lies den Text gegen und ergänze die Platzhalter.');
    } catch (err) {
      if (!controller.signal.aborted) toast(describeAiError(err), 'error');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function copyPrompt(openClaude: boolean) {
    if (!(await copyText(promptForClaudeAi(input())))) {
      toast('Kopieren nicht möglich – bitte die Zwischenablage im Browser erlauben.', 'error');
      return;
    }
    toast(openClaude ? 'Prompt kopiert – in Claude mit Strg/Cmd + V einfügen.' : 'Prompt kopiert');
    if (openClaude) window.open('https://claude.ai/new', '_blank', 'noopener');
  }

  function saveToApp() {
    if (!app || !output.trim()) return;
    if (kind === 'letter') actions.updateApplication(app.id, { coverLetter: output });
    else actions.updateApplication(app.id, { notes: [app.notes.trim(), `— ${kindLabel} —\n${output.trim()}`].filter(Boolean).join('\n\n') });
    toast(kind === 'letter' ? 'Anschreiben in der Bewerbung gespeichert' : 'In den Notizen der Bewerbung gespeichert');
  }

  function print() {
    if (!output.trim()) return;
    if (!printLetter({ profile, ...job, body: output, language })) toast('Pop-up blockiert – bitte Pop-ups für diese Seite erlauben.', 'error');
  }

  const fileName = `${slug(kindLabel)}-${slug(job.company || job.title || 'bewerbung')}.txt`;

  return (
    <>
      <PageHeader title="Anschreiben & KI" description="Anschreiben, E-Mails, Stellen-Checks und Interview-Vorbereitung – individuell und in Sekunden." />

      {!profile.cvText && !profile.linkedinText && (
        <div className="banner">
          <Lightbulb size={16} />
          <span>
            Tipp: Lade im <a href="#/profile">Profil</a> deinen Lebenslauf hoch – dann werden die Texte deutlich persönlicher.
          </span>
        </div>
      )}

      <div className="writer">
        <div className="stack">
          <Card title="1. Stelle">
            <div className="form-grid">
              <Field label="Bewerbung" full>
                <select
                  className="input"
                  value={appId}
                  onChange={(e) => {
                    const next = apps.find((a) => a.id === e.target.value);
                    setAppId(e.target.value);
                    if (kind === 'letter') setOutput(next?.coverLetter ?? '');
                  }}
                >
                  <option value="">Neue Stelle manuell eingeben</option>
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} · {a.company}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Position">
                <input className="input" value={job.title} onChange={(e) => setJob({ title: e.target.value })} placeholder="z. B. Projektmanager" />
              </Field>
              <Field label="Unternehmen">
                <input className="input" value={job.company} onChange={(e) => setJob({ company: e.target.value })} />
              </Field>
              <Field label="Ansprechperson">
                <input className="input" value={job.contact} onChange={(e) => setJob({ contact: e.target.value })} placeholder="z. B. Frau Müller" />
              </Field>
              <Field label="Ort">
                <input className="input" value={job.location} onChange={(e) => setJob({ location: e.target.value })} />
              </Field>
              <Field label="Stellenbeschreibung" full hint="Kopiere den Anzeigentext hier hinein – je mehr Details, desto passgenauer das Ergebnis.">
                <textarea className="input" rows={7} value={job.description} onChange={(e) => setJob({ description: e.target.value })} placeholder="Aufgaben, Anforderungen, Benefits …" />
              </Field>
            </div>
          </Card>

          <Card title="2. Was möchtest du erstellen?">
            <div className="kind-grid">
              {KINDS.map((k) => (
                <button key={k.id} type="button" className={cls('kind', kind === k.id && 'active')} onClick={() => setKind(k.id)}>
                  <k.icon size={18} />
                  <span>
                    <strong>{k.label}</strong>
                    <small>{k.description}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <Field label="Tonalität">
                <Segmented
                  value={tone}
                  onChange={setTone}
                  options={[
                    { value: 'formal', label: 'Klassisch' },
                    { value: 'modern', label: 'Modern' },
                  ]}
                />
              </Field>
              <Field label="Sprache">
                <Segmented
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: 'de', label: 'Deutsch' },
                    { value: 'en', label: 'Englisch' },
                  ]}
                />
              </Field>
            </div>
          </Card>

          <div className="generate">
            {busy ? (
              <Button size="lg" icon={Square} onClick={() => abortRef.current?.abort()}>
                Stoppen
              </Button>
            ) : (
              <Button size="lg" variant="primary" icon={Sparkles} onClick={runAi}>
                Mit Claude erstellen
              </Button>
            )}
            <div className="row wrap center">
              {kind === 'letter' && (
                <Button size="sm" variant="ghost" icon={WandSparkles} onClick={() => setOutput(coverLetterTemplate(profile, job, language))}>
                  Vorlage einsetzen
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={ClipboardCopy} onClick={() => copyPrompt(false)}>
                Prompt kopieren
              </Button>
              <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => copyPrompt(true)}>
                In Claude öffnen
              </Button>
            </div>
            {!apiKey && (
              <p className="muted small center">
                Ohne API-Key: „In Claude öffnen“ kopiert den fertigen Prompt für claude.ai. Oder <a href="#/settings">Claude direkt verbinden</a>.
              </p>
            )}
          </div>
        </div>

        <Card
          className="output-card"
          title={kindLabel}
          description={app ? `${app.title} · ${app.company}` : 'Ergebnis'}
          actions={
            <>
              <Button size="sm" variant="ghost" icon={Copy} disabled={!output} aria-label="Kopieren" title="Kopieren" onClick={() => copyText(output).then((ok) => toast(ok ? 'Text kopiert' : 'Kopieren nicht möglich', ok ? 'success' : 'error'))} />
              <Button size="sm" variant="ghost" icon={Download} disabled={!output} aria-label="Als Textdatei speichern" title="Als Textdatei speichern" onClick={() => downloadFile(fileName, output)} />
              {kind === 'letter' && <Button size="sm" variant="ghost" icon={Printer} disabled={!output} aria-label="Drucken oder als PDF speichern" title="Drucken / als PDF speichern" onClick={print} />}
              {app && (
                <Button size="sm" icon={Save} disabled={!output || busy} onClick={saveToApp}>
                  Speichern
                </Button>
              )}
            </>
          }
        >
          <textarea
            className="output"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Hier erscheint dein Text. Du kannst ihn anschließend frei bearbeiten, kopieren, als PDF drucken oder in der Bewerbung speichern."
            aria-label="Ergebnis"
          />
          <div className="output-foot">
            {busy ? (
              <span className="writing">
                <span className="pulse" /> Claude schreibt …
              </span>
            ) : (
              <span>{output.includes('[') ? 'Platzhalter in [eckigen Klammern] noch ergänzen.' : ''}</span>
            )}
            <span>
              {wordCount(output)} Wörter · {output.length} Zeichen
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
