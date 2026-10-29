import { useRef, useState, type DragEvent } from 'react';
import { Eye, FileText, Link2, Sparkles, Trash, Upload, type LucideIcon } from 'lucide-react';
import { Button, Card, Dialog, Field, PageHeader, Progress, TagInput, toast } from '../components/ui';
import { describeAiError, extractProfile } from '../lib/ai';
import { RADIUS_OPTIONS, WORKTIME_OPTIONS } from '../lib/content';
import { extractText, parseProfileFromText } from '../lib/cv';
import { mergeProfile, profileCompleteness } from '../lib/profile';
import { navigate } from '../lib/router';
import { actions, getState, useStore } from '../lib/store';
import type { Profile as ProfileData, WorkTime } from '../lib/types';
import { cls } from '../lib/utils';

type Doc = 'cv' | 'linkedin';

export default function Profile() {
  const p = useStore((s) => s.profile);
  const { apiKey, model } = useStore((s) => s.settings);
  const [busy, setBusy] = useState<Doc | 'ai' | null>(null);
  const [viewing, setViewing] = useState<Doc | null>(null);
  const set = (patch: Partial<ProfileData>) => actions.updateProfile(patch);
  const completeness = profileCompleteness(p);

  async function importFile(file: File, doc: Doc) {
    setBusy(doc);
    try {
      const text = await extractText(file);
      if (text.length < 80) throw new Error('In der Datei wurde kaum Text gefunden (evtl. ein Scan). Füge den Text stattdessen manuell ein.');
      set(doc === 'cv' ? { cvText: text, cvFileName: file.name } : { linkedinText: text, linkedinFileName: file.name });
      const { patch, filled } = mergeProfile(getState().profile, parseProfileFromText(text));
      if (filled) set(patch);
      toast(`${file.name} importiert${filled ? ` · ${filled} Felder automatisch ergänzt` : ''}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Die Datei konnte nicht gelesen werden.', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function analyze() {
    const text = [p.cvText, p.linkedinText].filter(Boolean).join('\n\n-----\n\n');
    if (!text) {
      toast('Lade zuerst deinen Lebenslauf oder dein LinkedIn-PDF hoch.', 'info');
      return;
    }
    setBusy('ai');
    try {
      const { patch, filled } = mergeProfile(getState().profile, await extractProfile({ apiKey, model, text }));
      set(patch);
      toast(filled ? `Profil ergänzt: ${filled} Felder aktualisiert` : 'Keine neuen Angaben gefunden – dein Profil ist schon gut gefüllt.');
    } catch (err) {
      toast(describeAiError(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Profil & Lebenslauf"
        description="Je vollständiger dein Profil, desto besser passen Jobvorschläge, Match und Anschreiben."
        actions={
          <div className="completeness">
            <span>Profil zu {completeness} % vollständig</span>
            <Progress value={completeness} tone={completeness === 100 ? 'success' : undefined} />
          </div>
        }
      />

      <Card title="Unterlagen importieren" description="Die Dateien werden lokal in deinem Browser ausgelesen – nichts wird hochgeladen.">
        <div className="grid grid-2">
          <DocSlot
            title="Lebenslauf"
            hint="PDF, Word (DOCX) oder TXT"
            icon={FileText}
            fileName={p.cvFileName}
            text={p.cvText}
            busy={busy === 'cv'}
            onFile={(f) => importFile(f, 'cv')}
            onView={() => setViewing('cv')}
            onRemove={() => set({ cvText: '', cvFileName: '' })}
          />
          <DocSlot
            title="LinkedIn-Profil"
            hint="Auf LinkedIn: Profil → „Mehr“ → „Als PDF speichern“"
            icon={Link2}
            fileName={p.linkedinFileName}
            text={p.linkedinText}
            busy={busy === 'linkedin'}
            onFile={(f) => importFile(f, 'linkedin')}
            onView={() => setViewing('linkedin')}
            onRemove={() => set({ linkedinText: '', linkedinFileName: '' })}
          />
        </div>
        <div className="ai-row">
          <div>
            <strong>Profil automatisch ausfüllen</strong>
            <p className="muted small">
              {apiKey
                ? 'Claude liest deine Unterlagen und ergänzt Wunschpositionen, Skills, Sprachen und Kurzprofil. Bestehende Angaben bleiben erhalten.'
                : 'Kontaktdaten, Skills und Sprachen werden beim Upload schon erkannt. Mit verbundenem Claude kommen Wunschpositionen und Kurzprofil dazu.'}
            </p>
          </div>
          {apiKey ? (
            <Button variant="primary" icon={Sparkles} loading={busy === 'ai'} onClick={analyze}>
              Mit KI auswerten
            </Button>
          ) : (
            <Button icon={Sparkles} onClick={() => navigate('settings')}>
              Claude verbinden
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-2 align-start">
        <Card title="Was suchst du?" description="Grundlage für Jobvorschläge und Match.">
          <div className="form-grid">
            <Field label="Wunschpositionen" full hint="Mit Enter oder Komma hinzufügen. Die erste wird automatisch gesucht.">
              <TagInput value={p.desiredRoles} onChange={(desiredRoles) => set({ desiredRoles })} placeholder="z. B. Projektmanager, Product Owner" />
            </Field>
            <Field label="Suchort">
              <input className="input" value={p.searchLocation} onChange={(e) => set({ searchLocation: e.target.value })} placeholder="z. B. Köln oder 50667" />
            </Field>
            <Field label="Umkreis">
              <select className="input" value={p.radius} onChange={(e) => set({ radius: Number(e.target.value) })}>
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Arbeitszeit">
              <select className="input" value={p.workTime} onChange={(e) => set({ workTime: e.target.value as WorkTime })}>
                {WORKTIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Verfügbar ab">
              <input className="input" value={p.availableFrom} onChange={(e) => set({ availableFrom: e.target.value })} placeholder="z. B. sofort oder 01.02.2027" />
            </Field>
            <Field label="Gehaltswunsch" full>
              <input className="input" value={p.salary} onChange={(e) => set({ salary: e.target.value })} placeholder="z. B. 55.000–60.000 € brutto/Jahr" />
            </Field>
          </div>
        </Card>

        <Card title="Qualifikation" description="Fließt in Match und Anschreiben ein.">
          <div className="form-grid">
            <Field label="Aktuelle Position" full>
              <input className="input" value={p.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="z. B. Marketing Manager im E-Commerce" />
            </Field>
            <Field label="Berufserfahrung (Jahre)">
              <input className="input" inputMode="numeric" value={p.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
            </Field>
            <Field label="Sprachen">
              <TagInput value={p.languages} onChange={(languages) => set({ languages })} placeholder="z. B. Englisch" />
            </Field>
            <Field label="Skills" full>
              <TagInput value={p.skills} onChange={(skills) => set({ skills })} placeholder="z. B. SAP, Projektmanagement, Excel" />
            </Field>
            <Field label="Kurzprofil" full hint="2–3 Sätze: Wer bist du, was kannst du, was suchst du?">
              <textarea className="input" rows={4} value={p.summary} onChange={(e) => set({ summary: e.target.value })} />
            </Field>
          </div>
        </Card>
      </div>

      <Card title="Kontaktdaten" description="Erscheinen im Briefkopf deiner Anschreiben.">
        <div className="form-grid cols-3">
          <Field label="Name">
            <input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label="E-Mail">
            <input className="input" type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" />
          </Field>
          <Field label="Telefon">
            <input className="input" type="tel" value={p.phone} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" />
          </Field>
          <Field label="Straße & Hausnummer">
            <input className="input" value={p.street} onChange={(e) => set({ street: e.target.value })} autoComplete="street-address" />
          </Field>
          <Field label="PLZ & Ort">
            <input className="input" value={p.city} onChange={(e) => set({ city: e.target.value })} placeholder="z. B. 50667 Köln" />
          </Field>
          <Field label="LinkedIn-Profil">
            <input className="input" type="url" value={p.linkedinUrl} onChange={(e) => set({ linkedinUrl: e.target.value })} placeholder="https://www.linkedin.com/in/…" />
          </Field>
          <Field label="Website / Portfolio">
            <input className="input" type="url" value={p.portfolioUrl} onChange={(e) => set({ portfolioUrl: e.target.value })} placeholder="https://…" />
          </Field>
        </div>
      </Card>

      {viewing && (
        <Dialog
          variant="modal"
          wide
          title={viewing === 'cv' ? 'Lebenslauf als Text' : 'LinkedIn-Profil als Text'}
          description="Korrigiere oder ergänze den Text – er ist die Grundlage für die KI."
          onClose={() => setViewing(null)}
          footer={
            <Button variant="primary" onClick={() => setViewing(null)}>
              Fertig
            </Button>
          }
        >
          <textarea
            className="input mono-area"
            rows={18}
            value={viewing === 'cv' ? p.cvText : p.linkedinText}
            placeholder="Text hier einfügen …"
            onChange={(e) =>
              set(
                viewing === 'cv'
                  ? { cvText: e.target.value, cvFileName: p.cvFileName || 'Eingefügter Text' }
                  : { linkedinText: e.target.value, linkedinFileName: p.linkedinFileName || 'Eingefügter Text' },
              )
            }
          />
        </Dialog>
      )}
    </>
  );
}

function DocSlot({
  title,
  hint,
  icon: Icon,
  fileName,
  text,
  busy,
  onFile,
  onView,
  onRemove,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  fileName: string;
  text: string;
  busy: boolean;
  onFile: (f: File) => void;
  onView: () => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = () => input.current?.click();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const fileInput = (
    <input
      ref={input}
      type="file"
      hidden
      accept=".pdf,.docx,.txt,.md"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = '';
      }}
    />
  );

  if (fileName && !busy) {
    return (
      <div className="doc">
        <span className="doc-icon">
          <Icon size={18} />
        </span>
        <div className="doc-info">
          <strong>{title}</strong>
          <span>
            {fileName} · {text.length.toLocaleString('de-DE')} Zeichen
          </span>
        </div>
        <Button size="sm" variant="ghost" icon={Eye} onClick={onView} aria-label="Text ansehen" title="Text ansehen" />
        <Button size="sm" variant="ghost" icon={Upload} onClick={pick} aria-label="Datei ersetzen" title="Datei ersetzen" />
        <Button size="sm" variant="ghost" icon={Trash} onClick={onRemove} aria-label="Entfernen" title="Entfernen" />
        {fileInput}
      </div>
    );
  }

  return (
    <>
      <div
        className={cls('dropzone', over && 'over')}
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {busy ? (
          <span className="spinner lg" />
        ) : (
          <span className="doc-icon">
            <Icon size={20} />
          </span>
        )}
        <strong>{busy ? 'Wird ausgelesen …' : `${title} hochladen`}</strong>
        <span className="muted small">{hint}</span>
        <button
          type="button"
          className="link small"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          oder Text einfügen
        </button>
      </div>
      {fileInput}
    </>
  );
}
