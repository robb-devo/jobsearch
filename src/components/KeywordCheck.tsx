import { useMemo } from 'react';
import { Check, ScanSearch } from 'lucide-react';
import { keywordReport } from '../lib/keywords';
import { cls } from '../lib/utils';
import { Progress } from './ui';

/** Live ATS check: which keywords of the ad are covered by the CV. */
export function KeywordCheck({ ad, cv }: { ad: string; cv: string }) {
  const report = useMemo(() => keywordReport(ad, cv), [ad, cv]);

  if (!cv.trim()) {
    return (
      <p className="muted small">
        Tipp: Mit hochgeladenem <a href="#/profile">Lebenslauf</a> siehst du hier, welche Schlüsselbegriffe der Anzeige dir noch fehlen.
      </p>
    );
  }
  if (!report) return null;

  const tone = report.score >= 70 ? 'success' : report.score >= 45 ? 'warning' : 'danger';
  const total = report.matched.length + report.missing.length;
  return (
    <div className="ats">
      <div className="ats-head">
        <span className="ats-title">
          <ScanSearch size={15} /> ATS-Check
        </span>
        <span className={cls('ats-score', `tone-${tone}`)}>{report.score} %</span>
      </div>
      <Progress value={report.score} tone={tone} />
      <p className="muted small">
        {report.matched.length} von {total} Schlüsselbegriffen der Anzeige stehen in deinem Lebenslauf.
        {report.missing.length > 0 && ' Baue fehlende Begriffe ehrlich in Lebenslauf und Anschreiben ein, wo sie zutreffen.'}
      </p>
      <div className="kw-list">
        {report.missing.map((k) => (
          <span key={k} className="kw kw-miss" title="Fehlt im Lebenslauf">
            {k}
          </span>
        ))}
        {report.matched.map((k) => (
          <span key={k} className="kw kw-ok" title="Im Lebenslauf vorhanden">
            <Check size={12} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
