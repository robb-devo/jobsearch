import { Briefcase, LayoutDashboard, ListChecks, Search, Settings, Sparkles, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { path: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { path: 'jobs', label: 'Jobs finden', icon: Search },
  { path: 'applications', label: 'Bewerbungen', icon: Briefcase },
  { path: 'writer', label: 'Anschreiben & KI', icon: Sparkles },
  { path: 'profile', label: 'Profil & Lebenslauf', icon: UserRound },
  { path: 'checklist', label: 'Checkliste', icon: ListChecks },
];

export const SETTINGS_NAV: NavItem = { path: 'settings', label: 'Einstellungen', icon: Settings };
