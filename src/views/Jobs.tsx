import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, BookmarkCheck, Briefcase, Building, CalendarDays, Clock, ExternalLink, MapPin, PenLine, Search, SearchX, WifiOff } from 'lucide-react';
import { Button, Card, Dialog, EmptyState, LinkButton, MatchBadge, PageHeader, Segmented, toast } from '../components/ui';
import { OFFER_OPTIONS, RADIUS_OPTIONS, SINCE_OPTIONS, WORKTIME_OPTIONS, companyLinks, jobBoardLinks } from '../lib/content';
import { baUrl, fetchJobDetails, jobUrl, searchJobs, type Job, type JobDetails, type JobQuery } from '../lib/jobs';
import { matchJob, type MatchInfo } from '../lib/match';
import { navigate } from '../lib/router';
import { actions, useStore } from '../lib/store';
import type { Application } from '../lib/types';
import { cls, formatDate, initials, relativeDays } from '../lib/utils';

type Sort = 'match' | 'distance' | 'date';

interface Results {
  query: JobQuery;
  jobs: Job[];
  total: number;
}

// Module scope so results survive switching between views.
let lastResults: Results | null = null;

const place = (job: Job) => [job.plz, job.city].filter(Boolean).join(' ') || job.region || 'Deutschland';

export default function Jobs() {
  const profile = useStore((s) => s.profile);
  const apps = useStore((s) => s.applications);
  const [form, setForm] = useState<JobQuery>(
    () =>
      lastResults?.query ?? {
        what: profile.desiredRoles[0] ?? profile.headline,
        where: profile.searchLocation || profile.city.replace(/^\d{5}\s*/, ''),
        radius: profile.radius || 25,
        workTime: profile.workTime,
        offerType: '1',
        since: '',
        noAgencies: false,
        page: 1,
      },
  );
  const [results, setResults] = useState<Results | null>(lastResults);
  const [loading, setLoading] = useState<'search' | 'more' | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<Sort>('match');
  const [selected, setSelected] = useState<{ job: Job; match: MatchInfo | null } | null>(null);

  const set = <K extends keyof JobQuery>(key: K, value: JobQuery[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function run(query: JobQuery, append = false) {
    setLoading(append ? 'more' : 'search');
    setError('');
    try {
      const { jobs, total } = await searchJobs(query);
      const next = { query, total, jobs: append && results ? [...results.jobs, ...jobs] : jobs };
      lastResults = next;
      setResults(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(null);
    }
  }

  // Search right away when the profile already tells us what and where.
  useEffect(() => {
    if (!lastResults && (form.what.trim() || form.where.trim())) void run({ ...form, page: 1 });
  }, []);

  const savedByRef = useMemo(() => new Map(apps.filter((a) => a.refnr).map((a) => [a.refnr, a])), [apps]);

  const items = useMemo(() => {
    const list = (results?.jobs ?? []).map((job) => ({ job, match: matchJob(profile, job) }));
    if (sort === 'match') list.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
    else if (sort === 'distance') list.sort((a, b) => (a.job.distance ?? 9999) - (b.job.distance ?? 9999));
    else list.sort((a, b) => b.job.publishedAt.localeCompare(a.job.publishedAt));
    return list;
  }, [results, profile, sort]);

  function save(job: Job, description = ''): string {
    const existing = savedByRef.get(job.refnr);
    if (existing) return existing.id;
    const app = actions.addApplication({
      title: job.title,
      company: job.company,
      location: place(job),
      url: jobUrl(job),
      source: 'Arbeitsagentur',
      refnr: job.refnr,
      description,
    });
    toast(`„${job.title}“ in deinen Bewerbungen gemerkt`);
    return app.id;
  }

  function write(job: Job, description = '') {
    const existing: Application | undefined = savedByRef.get(job.refnr);
    const id = save(job, description);
    actions.updateApplication(id, {
      ...(!existing || existing.status === 'saved' ? { status: 'preparing' as const } : {}),
      ...(description && !existing?.description ? { description } : {}),
    });
    navigate(`writer?app=${id}`);
  }

  const searchFor = (what: string) => {
    const query = { ...form, what, page: 1 };
    setForm(query);
    void run(query);
  };

  return (
    <>
      <PageHeader title="Jobs finden" description="Aktuelle Stellen aus der Jobbörse der Bundesagentur für Arbeit – sortiert nach Passung zu deinem Profil." />

      <form
        className="card search-card"
        onSubmit={(e) => {
          e.preventDefault();
          void run({ ...form, page: 1 });
        }}
      >
        <div className="search-row">
          <label className="input-icon what">
            <Search size={16} />
            <input className="input" value={form.what} onChange={(e) => set('what', e.target.value)} placeholder="Jobtitel, Stichwort oder Firma" aria-label="Was" />
          </label>
          <label className="input-icon where">
            <MapPin size={16} />
            <input className="input" value={form.where} onChange={(e) => set('where', e.target.value)} placeholder="Ort oder PLZ" aria-label="Wo" />
          </label>
          <select className="input radius" value={form.radius} onChange={(e) => set('radius', Number(e.target.value))} aria-label="Umkreis">
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" icon={Search} loading={loading === 'search'}>
            Suchen
          </Button>
        </div>
        <div className="filter-row">
          <select className="input input-sm" value={form.workTime} onChange={(e) => set('workTime', e.target.value)} aria-label="Arbeitszeit">
            {WORKTIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input input-sm" value={form.offerType} onChange={(e) => set('offerType', e.target.value)} aria-label="Angebotsart">
            {OFFER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input input-sm" value={form.since} onChange={(e) => set('since', e.target.value)} aria-label="Veröffentlicht">
            {SINCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="check-inline">
            <input type="checkbox" checked={form.noAgencies} onChange={(e) => set('noAgencies', e.target.checked)} />
            Ohne Zeitarbeit & Vermittler
          </label>
        </div>
        {profile.desiredRoles.length > 0 && (
          <div className="suggestions">
            <span className="muted small">Deine Wunschpositionen:</span>
            {profile.desiredRoles.map((role) => (
              <button key={role} type="button" className={cls('chip', form.what === role && 'active')} onClick={() => searchFor(role)}>
                {role}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="jobs-layout">
        <section className="stack">
          {error ? (
            <Card>
              <div className="notice">
                <span className="notice-icon">
                  <WifiOff size={18} />
                </span>
                <div>
                  <h3>Live-Suche gerade nicht verfügbar</h3>
                  <p>{error}</p>
                  <p className="muted">
                    Kein Problem: Unter „Auch suchen auf“ öffnest du dieselbe Suche direkt bei LinkedIn, Indeed, StepStone & Co. Passende Stellen trägst du dann unter „Bewerbungen“ ein.
                  </p>
                </div>
              </div>
            </Card>
          ) : loading === 'search' && !results ? (
            <div className="job-list">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          ) : results && results.jobs.length > 0 ? (
            <>
              <div className="results-head">
                <p>
                  <strong>{results.total.toLocaleString('de-DE')}</strong> Stellen gefunden
                </p>
                <Segmented
                  size="sm"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'match', label: 'Passend' },
                    { value: 'distance', label: 'Nähe' },
                    { value: 'date', label: 'Neueste' },
                  ]}
                />
              </div>
              <div className={cls('job-list', loading === 'search' && 'is-loading')}>
                {items.map(({ job, match }) => (
                  <JobCard key={job.refnr} job={job} match={match} saved={savedByRef.has(job.refnr)} onOpen={() => setSelected({ job, match })} onSave={() => save(job)} />
                ))}
              </div>
              {results.jobs.length < results.total && (
                <Button className="load-more" loading={loading === 'more'} onClick={() => run({ ...results.query, page: results.query.page + 1 }, true)}>
                  Weitere Stellen laden
                </Button>
              )}
            </>
          ) : (
            <Card>
              {results ? (
                <EmptyState icon={SearchX} title="Keine Treffer">
                  Versuche einen allgemeineren Begriff, vergrößere den Umkreis oder entferne Filter.
                </EmptyState>
              ) : (
                <EmptyState icon={Briefcase} title="Wonach suchst du?">
                  Gib einen Jobtitel und deinen Ort ein. Tipp: Hinterlege im Profil deine Wunschpositionen – dann sucht die App automatisch passend.
                </EmptyState>
              )}
            </Card>
          )}
        </section>

        <aside className="stack">
          <Card title="Auch suchen auf" description="Dieselbe Suche, vorausgefüllt für andere Jobbörsen.">
            <div className="link-list">
              {jobBoardLinks(form.what, form.where, form.radius).map((b) => (
                <a key={b.name} className="link-row" href={b.url} target="_blank" rel="noreferrer">
                  {b.name}
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </div>
          </Card>
          <Card title="So entsteht der Match">
            <p className="muted small">
              Der Match vergleicht Jobtitel mit deinen Wunschpositionen und Skills und berücksichtigt Entfernung und Aktualität. Pflege dein Profil, damit die Sortierung „Passend“ wirklich passt.
            </p>
          </Card>
        </aside>
      </div>

      {selected && (
        <JobDrawer
          job={selected.job}
          match={selected.match}
          savedId={savedByRef.get(selected.job.refnr)?.id}
          onClose={() => setSelected(null)}
          onSave={(description) => save(selected.job, description)}
          onWrite={(description) => write(selected.job, description)}
        />
      )}
    </>
  );
}

function JobCard({ job, match, saved, onOpen, onSave }: { job: Job; match: MatchInfo | null; saved: boolean; onOpen: () => void; onSave: () => void }) {
  return (
    <article className="job-card" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <span className="job-logo" aria-hidden>
        {initials(job.company)}
      </span>
      <div className="job-main">
        <h3 className="job-title">{job.title}</h3>
        <p className="job-company">{job.company}</p>
        <div className="job-meta">
          <span>
            <MapPin size={13} />
            {job.city || job.region || 'Deutschland'}
            {job.distance != null && ` · ${job.distance} km`}
          </span>
          {job.publishedAt && (
            <span>
              <Clock size={13} />
              {relativeDays(job.publishedAt)}
            </span>
          )}
        </div>
      </div>
      <div className="job-side">
        {match && <MatchBadge score={match.score} />}
        <Button
          size="sm"
          icon={saved ? BookmarkCheck : Bookmark}
          className={cls(saved && 'is-saved')}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          {saved ? 'Gemerkt' : 'Merken'}
        </Button>
      </div>
    </article>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="fact">
      <Icon size={16} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function JobDrawer({
  job,
  match,
  savedId,
  onClose,
  onSave,
  onWrite,
}: {
  job: Job;
  match: MatchInfo | null;
  savedId?: string;
  onClose: () => void;
  onSave: (description: string) => void;
  onWrite: (description: string) => void;
}) {
  // undefined while loading, null when the API has no details for this listing.
  const [details, setDetails] = useState<JobDetails | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void fetchJobDetails(job.refnr).then((d) => alive && setDetails(d));
    return () => {
      alive = false;
    };
  }, [job.refnr]);

  const description = details?.description ?? '';

  return (
    <Dialog
      title={job.title}
      description={job.company}
      onClose={onClose}
      footer={
        <>
          {savedId ? (
            <Button icon={BookmarkCheck} onClick={() => navigate(`applications?id=${savedId}`)}>
              In Bewerbungen öffnen
            </Button>
          ) : (
            <Button icon={Bookmark} onClick={() => onSave(description)}>
              Merken
            </Button>
          )}
          <Button variant="primary" icon={PenLine} onClick={() => onWrite(description)}>
            Anschreiben erstellen
          </Button>
        </>
      }
    >
      <div className="facts">
        <Fact icon={MapPin} label="Arbeitsort" value={`${place(job)}${job.distance != null ? ` (${job.distance} km)` : ''}`} />
        <Fact icon={Clock} label="Veröffentlicht" value={job.publishedAt ? `${formatDate(job.publishedAt)} · ${relativeDays(job.publishedAt)}` : '—'} />
        <Fact icon={CalendarDays} label="Eintritt" value={job.startDate ? formatDate(job.startDate) : 'nach Vereinbarung'} />
        <Fact icon={Building} label="Berufsfeld" value={job.occupation || '—'} />
      </div>

      {match && (
        <div className="match-box">
          <MatchBadge score={match.score} />
          <p>
            {match.roles.length ? `Passt zu deiner Wunschposition „${match.roles[0]}“.` : 'Keine direkte Übereinstimmung mit deinen Wunschpositionen.'}
            {match.skills.length > 0 && ` Gefundene Skills: ${match.skills.join(', ')}.`}
          </p>
        </div>
      )}

      <div className="row wrap">
        <LinkButton href={jobUrl(job)} icon={ExternalLink}>
          Zur Stellenanzeige
        </LinkButton>
        {job.externalUrl && (
          <LinkButton href={baUrl(job.refnr)} variant="ghost" icon={ArrowUpRight}>
            Bei der Arbeitsagentur
          </LinkButton>
        )}
      </div>

      <section className="section">
        <h4>Stellenbeschreibung</h4>
        {details === undefined ? (
          <p className="muted">Lade Details …</p>
        ) : description ? (
          <div className="prose-text">{description}</div>
        ) : (
          <p className="muted">
            Die vollständige Beschreibung findest du in der Originalanzeige. Tipp: Kopiere den Text später ins Anschreiben-Studio – dann wird dein Anschreiben noch passgenauer.
          </p>
        )}
      </section>

      <section className="section">
        <h4>Arbeitgeber recherchieren</h4>
        <div className="link-list">
          {companyLinks(job.company).map((l) => (
            <a key={l.name} className="link-row" href={l.url} target="_blank" rel="noreferrer">
              {l.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        </div>
      </section>
    </Dialog>
  );
}
