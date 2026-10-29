export type Status = 'saved' | 'preparing' | 'applied' | 'interview' | 'offer' | 'rejected';
export type WorkTime = '' | 'vz' | 'tz' | 'ho' | 'mj';
export type Theme = 'system' | 'light' | 'dark';

export interface Application {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  /** Reference number of the Arbeitsagentur listing, used to recognise already saved jobs. */
  refnr: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  /** Dates as yyyy-mm-dd, empty when unset. */
  appliedAt: string;
  followUpAt: string;
  contact: string;
  salary: string;
  notes: string;
  description: string;
  coverLetter: string;
  checklist: Record<string, boolean>;
  /** Interview date as yyyy-mm-ddThh:mm (local time), empty when unset. */
  interviewAt: string;
  history: StatusChange[];
}

export interface StatusChange {
  at: string;
  status: Status;
}

/** A job search the user wants to be alerted about. */
export interface SavedSearch {
  id: string;
  what: string;
  where: string;
  radius: number;
  workTime: string;
  offerType: string;
  noAgencies: boolean;
  createdAt: string;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  headline: string;
  summary: string;
  experienceYears: string;
  desiredRoles: string[];
  skills: string[];
  languages: string[];
  searchLocation: string;
  radius: number;
  workTime: WorkTime;
  salary: string;
  availableFrom: string;
  linkedinUrl: string;
  portfolioUrl: string;
  cvText: string;
  cvFileName: string;
  linkedinText: string;
  linkedinFileName: string;
}

export interface Settings {
  apiKey: string;
  model: string;
  weeklyGoal: number;
  theme: Theme;
  proxyUrl: string;
  trackerView: 'table' | 'board';
}

export interface AppState {
  version: 1;
  profile: Profile;
  applications: Application[];
  checklist: Record<string, boolean>;
  settings: Settings;
  searches: SavedSearch[];
  /** Reference numbers of job ads already shown, to highlight new ones. */
  seenJobs: string[];
}
