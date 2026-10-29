import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BellPlus, BellRing, ChevronRight, Circle, CircleCheck, FileText, Lightbulb, MessagesSquare, Plus, Search, Send, type LucideIcon } from 'lucide-react';
import { Button, Card, PageHeader, Progress } from '../components/ui';
import { STATUS_LABEL, STATUS_ORDER, TIPS } from '../lib/content';
import { searchJobs } from '../lib/jobs';
import { profileChecks, profileCompleteness } from '../lib/profile';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import type { Application } from '../lib/types';
import { cls, firstName, formatDateTime, greeting, relativeDays, startOfWeek, todayISO } from '../lib/utils';

const SENT = new Set(['applied', 'interview', 'offer', 'rejected']);
const ANSWERED = new Set(['interview', 'offer', 'rejected']);

function Kpi({ label, value, suffix, sub, children }: { label: string; value: ReactNode; suffix?: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="card kpi">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">
        {value}
        {suffix && <span className="kpi-suffix">{suffix}</span>}
      </div>
      {children}
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

interface Step {
  app: Application;
  title: string;
  meta: string;
  icon: LucideIcon;
  tone: 'danger' | 'warning' | 'primary' | '';
  to: string;
  rank: number;
}

function nextSteps(apps: Application[]): Step[] {
  const today = todayISO();
  const steps: Step[] = [];
  for (const app of apps) {
    const where = app.company || app.title;
    if (app.status === 'interview') {
      const meta = app.interviewAt ? `${formatDateTime(app.interviewAt)} · ${app.title}` : app.title;
      steps.push({ app, title: `Gespräch bei ${where} vorbereiten`, meta, icon: MessagesSquare, tone: 'warning', to: `writer?app=${app.id}&kind=interview`, rank: 0 });
    } else if (app.status === 'applied' && app.followUpAt && app.followUpAt <= today) {
      steps.push({ app, title: `Bei ${where} nachfassen`, meta: `Beworben ${relativeDays(app.appliedAt)} · ${app.title}`, icon: BellRing, tone: 'danger', to: `applications?id=${app.id}`, rank: 1 });
    } else if (app.status === 'preparing') {
      steps.push({ app, title: `Bewerbung an ${where} fertigstellen`, meta: app.title, icon: FileText, tone: 'primary', to: `writer?app=${app.id}`, rank: 2 });
    } else if (app.status === 'saved') {
      steps.push({ app, title: `${app.title} prüfen & bewerben`, meta: `${app.company} · gemerkt ${relativeDays(app.createdAt.slice(0, 10))}`, icon: Send, tone: '', to: `applications?id=${app.id}`, rank: 3 });
    }
  }
  return steps.sort((a, b) => a.rank - b.rank).slice(0, 6);
}

function Pipeline({ apps }: { apps: Application[] }) {
  const counts = STATUS_ORDER.map((status) => ({ status, count: apps.filter((a) => a.status === status).length }));
  if (!apps.length) return <p className="muted">Sobald du Bewerbungen einträgst, siehst du hier, wo jede gerade steht.</p>;
  return (
    <>
      <div className="pipeline" role="img" aria-label={counts.map((c) => `${STATUS_LABEL[c.status]}: ${c.count}`).join(', ')}>
        {counts
          .filter((c) => c.count)
          .map((c) => (
            <span key={c.status} style={{ flexGrow: c.count, background: `var(--st-${c.status})` }} title={`${STATUS_LABEL[c.status]}: ${c.count}`} />
          ))}
      </div>
      <ul className="legend">
        {counts.map((c) => (
          <li key={c.status}>
            <i style={{ background: `var(--st-${c.status})` }} />
            {STATUS_LABEL[c.status]}
            <strong>{c.count}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

// Per session, so the dashboard does not query the job API on every visit.
const alertCache = new Map<string, { at: number; refs: string[] }>();

function JobAlerts() {
  const searches = useStore((s) => s.searches);
  const seenJobs = useStore((s) => s.seenJobs);
  const [refs, setRefs] = useState<Record<string, string[] | null>>(() => Object.fromEntries([...alertCache].map(([id, v]) => [id, v.refs])));

  useEffect(() => {
    let alive = true;
    for (const search of searches) {
      const cached = alertCache.get(search.id);
      if (cached && Date.now() - cached.at < 10 * 60_000) continue;
      searchJobs({ ...search, since: '7', page: 1 })
        .then(({ jobs }) => {
          const list = jobs.map((j) => j.refnr);
          alertCache.set(search.id, { at: Date.now(), refs: list });
          if (alive) setRefs((r) => ({ ...r, [search.id]: list }));
        })
        .catch(() => alive && setRefs((r) => ({ ...r, [search.id]: null })));
    }
    return () => {
      alive = false;
    };
  }, [searches]);

  const seen = useMemo(() => new Set(seenJobs), [seenJobs]);

  return (
    <Card
      title="Job-Alarme"
      description="Neue Stellen der letzten 7 Tage"
      actions={
        <Button size="sm" variant="ghost" icon={BellPlus} onClick={() => navigate('jobs')}>
          Neu
        </Button>
      }
    >
      {searches.length === 0 ? (
        <p className="muted small">Speichere eine Suche unter „Jobs finden“ als Job-Alarm – hier siehst du dann sofort, wie viele neue Stellen dazugekommen sind.</p>
      ) : (
        <div className="task-list">
          {searches.map((s) => {
            const list = refs[s.id];
            const fresh = list ? list.filter((r) => !seen.has(r)).length : 0;
            return (
              <button key={s.id} type="button" className="task" onClick={() => navigate(`jobs?alert=${s.id}`)}>
                <span className="task-icon tone-primary">
                  <BellRing size={16} />
                </span>
                <span className="task-text">
                  <strong>{s.what || 'Alle Jobs'}</strong>
                  <span>{s.where ? `${s.where} · ${s.radius} km` : 'Deutschlandweit'}</span>
                </span>
                {list === undefined ? (
                  <span className="spinner" />
                ) : list === null ? (
                  <span className="muted small">offline</span>
                ) : fresh ? (
                  <span className="badge badge-primary">{fresh} neu</span>
                ) : (
                  <span className="muted small">aktuell</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const profile = useStore((s) => s.profile);
  const apps = useStore((s) => s.applications);
  const goal = useStore((s) => s.settings.weeklyGoal);
  const hasKey = useStore((s) => Boolean(s.settings.apiKey));

  const weekStart = startOfWeek();
  const sentThisWeek = apps.filter((a) => a.appliedAt && a.appliedAt >= weekStart).length;
  const sent = apps.filter((a) => a.appliedAt || SENT.has(a.status)).length;
  const answered = apps.filter((a) => ANSWERED.has(a.status)).length;
  const active = apps.filter((a) => a.status === 'preparing' || a.status === 'applied' || a.status === 'interview').length;
  const interviews = apps.filter((a) => a.status === 'interview').length;
  const offers = apps.filter((a) => a.status === 'offer').length;
  const steps = nextSteps(apps);
  const checks = profileChecks(profile);
  const completeness = profileCompleteness(profile);
  const name = firstName(profile.name);
  const today = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const tip = TIPS[new Date().getDate() % TIPS.length];

  const onboarding = [
    { title: 'Lebenslauf hochladen', text: 'PDF, Word oder LinkedIn-Export', done: Boolean(profile.cvText || profile.linkedinText), to: 'profile' },
    { title: 'Wunschjob & Ort', text: 'Für passende Vorschläge', done: profile.desiredRoles.length > 0 && Boolean(profile.searchLocation), to: 'profile' },
    { title: 'Jobs finden & merken', text: 'Live aus der Jobbörse', done: apps.length > 0, to: 'jobs' },
    { title: 'Claude verbinden', text: 'Optional – für KI-Anschreiben', done: hasKey, to: 'settings' },
  ];
  const showOnboarding = onboarding.slice(0, 3).some((s) => !s.done);

  return (
    <>
      <PageHeader
        title={name ? `${greeting()}, ${name}` : `${greeting()}!`}
        description={`${today} · Hier ist dein Bewerbungs-Überblick.`}
        actions={
          <>
            <Button icon={Plus} onClick={() => navigate('applications?new=1')}>
              Bewerbung eintragen
            </Button>
            <Button variant="primary" icon={Search} onClick={() => navigate('jobs')}>
              Jobs finden
            </Button>
          </>
        }
      />

      {showOnboarding && (
        <Card className="onboarding" title="In vier Schritten startklar" description="Je mehr die App über dich weiß, desto weniger Arbeit hast du später.">
          <div className="steps">
            {onboarding.map((s) => (
              <button key={s.title} type="button" className={cls('step', s.done && 'done')} onClick={() => navigate(s.to)}>
                {s.done ? <CircleCheck size={18} /> : <Circle size={18} />}
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-4">
        <Kpi label="Diese Woche beworben" value={sentThisWeek} suffix={`/ ${goal}`} sub={sentThisWeek >= goal ? 'Wochenziel erreicht – stark!' : `Noch ${goal - sentThisWeek} bis zum Wochenziel`}>
          <Progress value={sentThisWeek} max={goal} tone={sentThisWeek >= goal ? 'success' : undefined} />
        </Kpi>
        <Kpi label="Aktive Bewerbungen" value={active} sub={`${apps.length} insgesamt im Tracker`} />
        <Kpi label="Gespräche" value={interviews} sub={offers ? `${offers} ${offers === 1 ? 'Angebot' : 'Angebote'} erhalten` : 'Einladungen zu Interviews'} />
        <Kpi label="Rücklaufquote" value={sent ? `${Math.round((answered / sent) * 100)} %` : '–'} sub={sent ? `${answered} von ${sent} Bewerbungen beantwortet` : 'Noch keine Bewerbung versendet'} />
      </div>

      <div className="grid dash-grid">
        <div className="stack">
          <Card
            title="Nächste Schritte"
            description="Was jetzt am meisten bringt"
            actions={
              apps.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => navigate('applications')}>
                  Alle Bewerbungen
                </Button>
              )
            }
          >
            {steps.length ? (
              <div className="task-list">
                {steps.map((s) => (
                  <button key={s.app.id} type="button" className="task" onClick={() => navigate(s.to)}>
                    <span className={cls('task-icon', s.tone && `tone-${s.tone}`)}>
                      <s.icon size={16} />
                    </span>
                    <span className="task-text">
                      <strong>{s.title}</strong>
                      <span>{s.meta}</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">
                Keine offenen Aufgaben. <button className="link" onClick={() => navigate('jobs')}>Neue Jobs finden →</button>
              </p>
            )}
          </Card>
          <Card title="Pipeline" description="Wo deine Bewerbungen gerade stehen">
            <Pipeline apps={apps} />
          </Card>
        </div>
        <div className="stack">
          <JobAlerts />
          <Card title="Dein Profil" actions={<span className="muted small">{completeness} %</span>}>
            <Progress value={completeness} tone={completeness === 100 ? 'success' : undefined} />
            <ul className="check-list">
              {checks.map((c) => (
                <li key={c.label} className={cls(c.done && 'done')}>
                  {c.done ? <CircleCheck size={16} /> : <Circle size={16} />}
                  {c.label}
                </li>
              ))}
            </ul>
            {completeness < 100 && (
              <Button size="sm" onClick={() => navigate('profile')}>
                Profil vervollständigen
              </Button>
            )}
          </Card>
          <Card title="Tipp des Tages">
            <div className="tip">
              <span className="tip-icon">
                <Lightbulb size={16} />
              </span>
              <p>{tip}</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
