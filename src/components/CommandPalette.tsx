import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, CornerDownLeft, FileText, Plus, Search, type LucideIcon } from 'lucide-react';
import { NAV, SETTINGS_NAV } from '../nav';
import { navigate } from '../lib/router';
import { useStore } from '../lib/store';
import { cls } from '../lib/utils';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

const OPEN_EVENT = 'open-command-palette';
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

/** Ctrl/Cmd + K: jump anywhere, search jobs or open an application without touching the mouse. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const apps = useStore((s) => s.applications);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    setQuery('');
    setActive(0);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector('.palette-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (s: string) => !q || s.toLowerCase().includes(q);
    const result: Command[] = [];
    if (q) result.push({ id: 'search', group: 'Aktionen', label: `Jobs suchen: „${query.trim()}“`, icon: Search, run: () => navigate(`jobs?q=${encodeURIComponent(query.trim())}`) });
    const quick: Command[] = [
      { id: 'new', group: 'Aktionen', label: 'Bewerbung eintragen', icon: Plus, run: () => navigate('applications?new=1') },
      { id: 'write', group: 'Aktionen', label: 'Anschreiben erstellen', icon: FileText, run: () => navigate('writer') },
    ];
    result.push(...quick.filter((c) => matches(c.label)));
    for (const item of [...NAV, SETTINGS_NAV]) {
      if (matches(item.label)) result.push({ id: `nav-${item.path}`, group: 'Gehe zu', label: item.label, icon: item.icon, run: () => navigate(item.path) });
    }
    if (q) {
      for (const app of apps.filter((a) => matches(`${a.title} ${a.company}`)).slice(0, 6)) {
        result.push({ id: app.id, group: 'Bewerbungen', label: app.title || app.company, hint: app.company, icon: Briefcase, run: () => navigate(`applications?id=${app.id}`) });
      }
    }
    return result;
  }, [query, apps]);

  if (!open) return null;

  const run = (command?: Command) => {
    if (!command) return;
    setOpen(false);
    command.run();
  };

  return (
    <div className="overlay overlay-palette" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Schnellsuche">
        <div className="palette-input">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            placeholder="Suchen, springen oder Jobs finden …"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, commands.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(commands[active]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" ref={list}>
          {commands.length === 0 && <p className="palette-empty">Keine Treffer</p>}
          {commands.map((c, i) => (
            <Fragment key={c.id}>
              {(i === 0 || commands[i - 1].group !== c.group) && <div className="palette-group">{c.group}</div>}
              <button type="button" className={cls('palette-item', i === active && 'active')} onMouseMove={() => setActive(i)} onClick={() => run(c)}>
                <c.icon size={16} />
                <span>{c.label}</span>
                {c.hint && <small>{c.hint}</small>}
                {i === active && <CornerDownLeft size={14} className="palette-enter" />}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
