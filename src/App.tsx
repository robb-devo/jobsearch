import { useEffect, useState, type ComponentType } from 'react';
import { Briefcase, Download, Lock, Menu, Search, UserRound } from 'lucide-react';
import { CommandPalette, openCommandPalette } from './components/CommandPalette';
import { Toaster } from './components/ui';
import { useInstallPrompt } from './lib/pwa';
import { useRoute } from './lib/router';
import { useStore } from './lib/store';
import { cls, initials } from './lib/utils';
import { NAV, SETTINGS_NAV } from './nav';
import Applications from './views/Applications';
import Checklist from './views/Checklist';
import Dashboard from './views/Dashboard';
import Jobs from './views/Jobs';
import Profile from './views/Profile';
import SettingsView from './views/Settings';
import Writer from './views/Writer';

const VIEWS: Record<string, ComponentType> = {
  dashboard: Dashboard,
  jobs: Jobs,
  applications: Applications,
  writer: Writer,
  profile: Profile,
  checklist: Checklist,
  settings: SettingsView,
};

const SHORTCUT = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Strg K';

function Brand() {
  return (
    <a href="#/dashboard" className="brand">
      <span className="brand-mark">
        <Briefcase size={16} strokeWidth={2.25} />
      </span>
      <span className="brand-text">
        <strong>Jobsearch</strong>
        <small>Bewerbungs-Cockpit</small>
      </span>
    </a>
  );
}

function Sidebar({ active, open, onClose }: { active: string; open: boolean; onClose: () => void }) {
  const profile = useStore((s) => s.profile);
  const apps = useStore((s) => s.applications);
  const install = useInstallPrompt();
  const openCount = apps.filter((a) => a.status !== 'offer' && a.status !== 'rejected').length;

  return (
    <>
      <div className={cls('scrim', open && 'show')} onClick={onClose} />
      <aside className={cls('sidebar', open && 'open')}>
        <div className="sidebar-top">
          <Brand />
        </div>
        <button type="button" className="search-trigger" onClick={openCommandPalette}>
          <Search size={15} />
          Suchen …<kbd>{SHORTCUT}</kbd>
        </button>
        <nav className="nav">
          {NAV.map((item) => (
            <a key={item.path} href={`#/${item.path}`} className={cls('nav-item', active === item.path && 'active')}>
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.path === 'applications' && openCount > 0 && <span className="nav-count">{openCount}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {install && (
            <button type="button" className="nav-item" onClick={() => void install()}>
              <Download size={18} />
              <span>App installieren</span>
            </button>
          )}
          <a href={`#/${SETTINGS_NAV.path}`} className={cls('nav-item', active === SETTINGS_NAV.path && 'active')}>
            <SETTINGS_NAV.icon size={18} />
            <span>{SETTINGS_NAV.label}</span>
          </a>
          <a href="#/profile" className="sidebar-profile">
            <span className="avatar">{profile.name ? initials(profile.name) : <UserRound size={16} />}</span>
            <span className="sidebar-profile-text">
              <strong>{profile.name || 'Profil anlegen'}</strong>
              <small>{profile.headline || 'Lebenslauf hochladen'}</small>
            </span>
          </a>
          <p className="privacy-note">
            <Lock size={12} /> Deine Daten bleiben auf diesem Gerät.
          </p>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const route = useRoute();
  const theme = useStore((s) => s.settings.theme);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, [route.path]);

  const View = VIEWS[route.path] ?? Dashboard;

  return (
    <div className="app">
      <Sidebar active={route.path} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon" onClick={() => setNavOpen(true)} aria-label="Menü öffnen">
            <Menu size={20} />
          </button>
          <Brand />
        </header>
        <main className="container">
          <View key={`${route.path}?${route.params}`} />
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
