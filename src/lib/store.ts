import { useSyncExternalStore } from 'react';
import type { AppState, Application, Profile, SavedSearch, Settings } from './types';
import { addDays, todayISO, uid } from './utils';

const STORAGE_KEY = 'jobsearch:v1';

export const DEFAULT_MODEL = 'claude-opus-5-5';

export const emptyProfile: Profile = {
  name: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  headline: '',
  summary: '',
  experienceYears: '',
  desiredRoles: [],
  skills: [],
  languages: [],
  searchLocation: '',
  radius: 25,
  workTime: '',
  salary: '',
  availableFrom: '',
  linkedinUrl: '',
  portfolioUrl: '',
  cvText: '',
  cvFileName: '',
  linkedinText: '',
  linkedinFileName: '',
};

const defaultSettings: Settings = { apiKey: '', model: DEFAULT_MODEL, weeklyGoal: 5, theme: 'system', proxyUrl: '', trackerView: 'table' };

export function blankApplication(): Application {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: '',
    company: '',
    location: '',
    url: '',
    source: '',
    refnr: '',
    status: 'saved',
    createdAt: now,
    updatedAt: now,
    appliedAt: '',
    followUpAt: '',
    contact: '',
    salary: '',
    notes: '',
    description: '',
    coverLetter: '',
    checklist: {},
    interviewAt: '',
    history: [],
  };
}

function normalize(data: Partial<AppState> | null | undefined): AppState {
  const d = data ?? {};
  return {
    version: 1,
    profile: { ...emptyProfile, ...d.profile },
    applications: Array.isArray(d.applications) ? d.applications.map((a) => ({ ...blankApplication(), ...a })) : [],
    checklist: d.checklist ?? {},
    settings: { ...defaultSettings, ...d.settings },
    searches: Array.isArray(d.searches) ? d.searches : [],
    seenJobs: Array.isArray(d.seenJobs) ? d.seenJobs : [],
  };
}

function load(): AppState {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return normalize(null);
  }
}

let state = load();
const listeners = new Set<() => void>();

function commit(next: AppState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Keep several open tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  state = load();
  listeners.forEach((fn) => fn());
});

export const getState = () => state;

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// Logs every status change; when an application is marked as sent, fills in today's date and plans a follow-up a week later.
function applyStatusChange(next: Application, prev?: Application): Application {
  if (prev && prev.status === next.status) return next;
  const history = [...(prev?.history ?? []), { at: new Date().toISOString(), status: next.status }];
  if (next.status !== 'applied' || next.appliedAt) return { ...next, history };
  const appliedAt = todayISO();
  return { ...next, history, appliedAt, followUpAt: next.followUpAt || addDays(appliedAt, 7) };
}

export const actions = {
  updateProfile(patch: Partial<Profile>) {
    commit({ ...state, profile: { ...state.profile, ...patch } });
  },
  updateSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  addApplication(data: Partial<Application>): Application {
    const app = applyStatusChange({ ...blankApplication(), ...data, id: uid() });
    commit({ ...state, applications: [app, ...state.applications] });
    return app;
  },
  updateApplication(id: string, patch: Partial<Application>) {
    commit({
      ...state,
      applications: state.applications.map((a) =>
        a.id === id ? applyStatusChange({ ...a, ...patch, updatedAt: new Date().toISOString() }, a) : a,
      ),
    });
  },
  removeApplication(id: string) {
    commit({ ...state, applications: state.applications.filter((a) => a.id !== id) });
  },
  toggleChecklist(key: string) {
    commit({ ...state, checklist: { ...state.checklist, [key]: !state.checklist[key] } });
  },
  addSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>) {
    commit({ ...state, searches: [...state.searches, { ...search, id: uid(), createdAt: new Date().toISOString() }] });
  },
  removeSearch(id: string) {
    commit({ ...state, searches: state.searches.filter((s) => s.id !== id) });
  },
  markSeen(refnrs: string[]) {
    const seen = new Set(state.seenJobs);
    const fresh = refnrs.filter((r) => !seen.has(r));
    if (fresh.length) commit({ ...state, seenJobs: [...state.seenJobs, ...fresh].slice(-3000) });
  },
  importData(data: unknown) {
    commit(normalize(data as Partial<AppState>));
  },
  reset() {
    commit(normalize(null));
  },
};
