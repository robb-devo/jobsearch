import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowUpRight, CalendarClock, CalendarPlus, Download, ExternalLink, Inbox, PenLine, Plus, Search, Trash } from 'lucide-react';
import { KeywordCheck } from '../components/KeywordCheck';
import { Button, Card, Dialog, EmptyState, Field, LinkButton, PageHeader, Progress, Segmented, StatusSelect, toast } from '../components/ui';
import { downloadInterviewIcs } from '../lib/calendar';
import { APPLICATION_CHECKLIST, STATUS_LABEL, STATUS_ORDER, companyLinks } from '../lib/content';
import { navigate, replacePath, useRoute } from '../lib/router';
import { actions, useStore } from '../lib/store';
import type { Application, Status } from '../lib/types';
import { cls, downloadFile, formatDate, formatDateTime, initials, toCSV, todayISO } from '../lib/utils';

const BEFORE_INTERVIEW = new Set<Status>(['saved', 'preparing', 'applied']);

export default function Applications() {
  const apps = useStore((s) => s.applications);
  const route = useRoute();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(() => route.params.get('id'));
  const [creating, setCreating] = useState(() => route.params.has('new'));
  const view = useStore((s) => s.settings.trackerView);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length };
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [apps]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps
      .filter((a) => !q || `${a.title} ${a.company} ${a.location} ${a.notes}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [apps, query]);
  const visible = filter === 'all' ? searched : searched.filter((a) => a.status === filter);

  const close = () => {
    setOpenId(null);
    setCreating(false);
    replacePath('applications');
  };

  const exportCsv = () => {
    const header = ['Position', 'Unternehmen', 'Ort', 'Status', 'Beworben am', 'Nachfassen am', 'Ansprechperson', 'Gehalt', 'Quelle', 'Link', 'Notizen'];
    const rows = apps.map((a) => [a.title, a.company, a.location, STATUS_LABEL[a.status], a.appliedAt, a.followUpAt, a.contact, a.salary, a.source, a.url, a.notes]);
    downloadFile(`bewerbungen-${todayISO()}.csv`, toCSV([header, ...rows]), 'text/csv;charset=utf-8');
  };

  const open = apps.find((a) => a.id === openId);
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Bewerbungen"
        description="Dein Tracker: Status, Termine, Notizen und Checkliste zu jeder Bewerbung an einem Ort."
        actions={
          <>
            {apps.length > 0 && (
              <Segmented
                value={view}
                onChange={(trackerView) => actions.updateSettings({ trackerView })}
                options={[
                  { value: 'table', label: 'Tabelle' },
                  { value: 'board', label: 'Board' },
                ]}
              />
            )}
            {apps.length > 0 && (
              <Button icon={Download} onClick={exportCsv}>
                CSV-Export
              </Button>
            )}
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
              Bewerbung hinzufügen
            </Button>
          </>
        }
      />

      {apps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Noch keine Bewerbungen"
            action={
              <div className="row">
                <Button variant="primary" icon={Search} onClick={() => navigate('jobs')}>
                  Jobs finden
                </Button>
                <Button icon={Plus} onClick={() => setCreating(true)}>
                  Manuell eintragen
                </Button>
              </div>
            }
          >
            Merke dir Stellen direkt in der Jobsuche oder trage Bewerbungen von LinkedIn, StepStone & Co. manuell ein.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="toolbar">
            <label className="input-icon search-field">
              <Search size={16} />
              <input className="input" placeholder="Firma, Position, Notiz …" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Bewerbungen durchsuchen" />
            </label>
            {view === 'table' && (
            <div className="chips">
              {(['all', ...STATUS_ORDER] as const).map((s) => (
                <button key={s} type="button" className={cls('chip', filter === s && 'active')} onClick={() => setFilter(s)}>
                  {s !== 'all' && <i className="dot" style={{ background: `var(--st-${s})` }} />}
                  {s === 'all' ? 'Alle' : STATUS_LABEL[s]}
                  <span className="chip-count">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>
            )}
          </div>

          {view === 'board' ? (
            <Board apps={searched} onOpen={setOpenId} />
          ) : (
          <div className="card card-flush table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Stelle</th>
                  <th>Status</th>
                  <th className="hide-sm">Beworben</th>
                  <th className="hide-sm">Nachfassen</th>
                  <th className="hide-md">Checkliste</th>
                  <th className="actions-col">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => {
                  const done = APPLICATION_CHECKLIST.filter((i) => a.checklist[i.id]).length;
                  const due = a.status === 'applied' && a.followUpAt !== '' && a.followUpAt <= today;
                  return (
                    <tr key={a.id} onClick={() => setOpenId(a.id)}>
                      <td>
                        <div className="cell-job">
                          <span className="job-logo sm">{initials(a.company || a.title)}</span>
                          <div>
                            <strong>{a.title || 'Ohne Titel'}</strong>
                            <span>{[a.company, a.location].filter(Boolean).join(' · ')}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusSelect value={a.status} onChange={(status) => actions.updateApplication(a.id, { status })} />
                      </td>
                      <td className="hide-sm nowrap">{a.appliedAt ? formatDate(a.appliedAt) : <span className="muted">—</span>}</td>
                      <td className="hide-sm nowrap">
                        {a.followUpAt ? (
                          <span className={cls(due && 'due')}>
                            {formatDate(a.followUpAt)}
                            {due && <span className="badge badge-danger">fällig</span>}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="hide-md">
                        <div className="mini-progress">
                          <Progress value={done} max={APPLICATION_CHECKLIST.length} />
                          <span>
                            {done}/{APPLICATION_CHECKLIST.length}
                          </span>
                        </div>
                      </td>
                      <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" icon={PenLine} title="Anschreiben erstellen" aria-label="Anschreiben erstellen" onClick={() => navigate(`writer?app=${a.id}`)} />
                        {a.url && <LinkButton size="sm" variant="ghost" icon={ExternalLink} href={a.url} title="Anzeige öffnen" aria-label="Anzeige öffnen" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visible.length === 0 && <p className="table-empty">Keine Bewerbungen für diesen Filter.</p>}
          </div>
          )}
        </>
      )}

      {open && <ApplicationDrawer app={open} onClose={close} />}
      {creating && <NewApplication onClose={close} />}
    </>
  );
}

function ApplicationDrawer({ app, onClose }: { app: Application; onClose: () => void }) {
  const update = (patch: Partial<Application>) => actions.updateApplication(app.id, patch);
  const done = APPLICATION_CHECKLIST.filter((i) => app.checklist[i.id]).length;
  const profile = useStore((s) => s.profile);

  const remove = () => {
    if (!confirm(`Bewerbung „${app.title || app.company}“ wirklich löschen?`)) return;
    actions.removeApplication(app.id);
    toast('Bewerbung gelöscht', 'info');
    onClose();
  };

  return (
    <Dialog
      title={app.title || 'Bewerbung'}
      description={[app.company, app.location].filter(Boolean).join(' · ')}
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" icon={Trash} onClick={remove}>
            Löschen
          </Button>
          <span className="spacer" />
          <Button icon={PenLine} onClick={() => navigate(`writer?app=${app.id}`)}>
            Anschreiben
          </Button>
          <Button variant="primary" onClick={onClose}>
            Fertig
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Status">
          <StatusSelect className="block" value={app.status} onChange={(status) => update({ status })} />
        </Field>
        <Field label="Quelle">
          <input className="input" value={app.source} onChange={(e) => update({ source: e.target.value })} placeholder="z. B. LinkedIn" />
        </Field>
        <Field label="Position" full>
          <input className="input" value={app.title} onChange={(e) => update({ title: e.target.value })} />
        </Field>
        <Field label="Unternehmen">
          <input className="input" value={app.company} onChange={(e) => update({ company: e.target.value })} />
        </Field>
        <Field label="Ort">
          <input className="input" value={app.location} onChange={(e) => update({ location: e.target.value })} />
        </Field>
        <Field label="Beworben am">
          <input className="input" type="date" value={app.appliedAt} onChange={(e) => update({ appliedAt: e.target.value })} />
        </Field>
        <Field label="Nachfassen am" hint="Wird beim Status „Beworben“ automatisch gesetzt.">
          <input className="input" type="date" value={app.followUpAt} onChange={(e) => update({ followUpAt: e.target.value })} />
        </Field>
        <Field label="Gesprächstermin" full hint="Setzt den Status auf „Gespräch“ – mit einem Klick in deinen Kalender, inklusive Erinnerung.">
          <div className="row">
            <input
              className="input"
              type="datetime-local"
              value={app.interviewAt}
              onChange={(e) => update({ interviewAt: e.target.value, ...(e.target.value && BEFORE_INTERVIEW.has(app.status) ? { status: 'interview' as const } : {}) })}
            />
            <Button icon={CalendarPlus} disabled={!app.interviewAt} onClick={() => downloadInterviewIcs(app)}>
              Kalender
            </Button>
          </div>
        </Field>
        <Field label="Ansprechperson">
          <input className="input" value={app.contact} onChange={(e) => update({ contact: e.target.value })} placeholder="z. B. Frau Müller" />
        </Field>
        <Field label="Gehalt">
          <input className="input" value={app.salary} onChange={(e) => update({ salary: e.target.value })} placeholder="z. B. 55.000 €" />
        </Field>
        <Field label="Link zur Anzeige" full>
          <input className="input" type="url" value={app.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Notizen" full>
          <textarea className="input" rows={3} value={app.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Eindrücke, Fragen, Gesprächstermine …" />
        </Field>
      </div>

      <section className="section">
        <div className="section-head">
          <h4>Checkliste</h4>
          <span className="muted small">
            {done}/{APPLICATION_CHECKLIST.length} erledigt
          </span>
        </div>
        <ul className="checklist compact">
          {APPLICATION_CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className="check">
                <input type="checkbox" checked={Boolean(app.checklist[item.id])} onChange={() => update({ checklist: { ...app.checklist, [item.id]: !app.checklist[item.id] } })} />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h4>Stellenbeschreibung</h4>
        <textarea
          className="input"
          rows={6}
          value={app.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Text der Stellenanzeige hier einfügen – für ATS-Check, Anschreiben und Stellen-Check."
        />
        <KeywordCheck ad={app.description} cv={`${profile.cvText}\n${profile.linkedinText}`} />
      </section>

      {app.coverLetter && (
        <section className="section">
          <div className="section-head">
            <h4>Gespeichertes Anschreiben</h4>
            <button className="link small" onClick={() => navigate(`writer?app=${app.id}`)}>
              Im Editor öffnen
            </button>
          </div>
          <div className="prose-text">{app.coverLetter}</div>
        </section>
      )}

      {app.history.length > 0 && (
        <section className="section">
          <h4>Verlauf</h4>
          <ol className="timeline">
            {[...app.history].reverse().map((h) => (
              <li key={h.at} style={{ '--c': `var(--st-${h.status})` } as CSSProperties}>
                {STATUS_LABEL[h.status]}
                <time>{formatDateTime(h.at)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}

      {app.company && (
        <section className="section">
          <h4>Arbeitgeber recherchieren</h4>
          <div className="link-list">
            {companyLinks(app.company).map((l) => (
              <a key={l.name} className="link-row" href={l.url} target="_blank" rel="noreferrer">
                {l.name}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>
      )}
    </Dialog>
  );
}

/** Kanban view: drag cards between status columns (click opens the details). */
function Board({ apps, onOpen }: { apps: Application[]; onOpen: (id: string) => void }) {
  const [over, setOver] = useState<Status | null>(null);
  const today = todayISO();

  const drop = (status: Status, id: string) => {
    setOver(null);
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === status) return;
    actions.updateApplication(id, { status });
    toast(`„${app.title || app.company}“ → ${STATUS_LABEL[status]}`);
  };

  return (
    <div className="board">
      {STATUS_ORDER.map((status) => {
        const items = apps.filter((a) => a.status === status);
        return (
          <section
            key={status}
            className={cls('column', over === status && 'over')}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              drop(status, e.dataTransfer.getData('text/plain'));
            }}
          >
            <header className="column-head">
              <i className="dot" style={{ background: `var(--st-${status})` }} />
              {STATUS_LABEL[status]}
              <span>{items.length}</span>
            </header>
            {items.map((a) => {
              const due = a.status === 'applied' && a.followUpAt !== '' && a.followUpAt <= today;
              return (
                <article
                  key={a.id}
                  className="board-card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', a.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onOpen(a.id)}
                >
                  <strong>{a.title || 'Ohne Titel'}</strong>
                  <span>{a.company}</span>
                  {a.status === 'interview' && a.interviewAt ? (
                    <small className="meta">
                      <CalendarClock size={12} />
                      {formatDateTime(a.interviewAt)}
                    </small>
                  ) : due ? (
                    <small className="meta due">Nachfassen fällig</small>
                  ) : (
                    a.appliedAt && <small className="meta">Beworben {formatDate(a.appliedAt)}</small>
                  )}
                </article>
              );
            })}
            {items.length === 0 && <p className="column-empty">Hierher ziehen</p>}
          </section>
        );
      })}
    </div>
  );
}

function NewApplication({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState({ title: '', company: '', location: '', url: '', source: '', status: 'saved' as Status, description: '' });
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.company.trim()) {
      toast('Bitte Position und Unternehmen angeben.', 'error');
      return;
    }
    actions.addApplication(draft);
    toast('Bewerbung angelegt');
    onClose();
  };

  return (
    <Dialog
      variant="modal"
      title="Bewerbung hinzufügen"
      description="Für Stellen von LinkedIn, StepStone, Firmenwebsites & Co."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" type="submit" form="new-application">
            Anlegen
          </Button>
        </>
      }
    >
      <form id="new-application" className="form-grid" onSubmit={submit}>
        <Field label="Position *" full>
          <input className="input" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus placeholder="z. B. Projektmanager (m/w/d)" />
        </Field>
        <Field label="Unternehmen *">
          <input className="input" value={draft.company} onChange={(e) => set({ company: e.target.value })} />
        </Field>
        <Field label="Ort">
          <input className="input" value={draft.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Status">
          <StatusSelect className="block" value={draft.status} onChange={(status) => set({ status })} />
        </Field>
        <Field label="Quelle">
          <input className="input" value={draft.source} onChange={(e) => set({ source: e.target.value })} placeholder="z. B. LinkedIn" />
        </Field>
        <Field label="Link zur Anzeige" full>
          <input className="input" type="url" value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Stellenbeschreibung (optional)" full hint="Hilft der KI beim Anschreiben.">
          <textarea className="input" rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </form>
    </Dialog>
  );
}
