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
}

export interface AppState {
  version: 1;
  profile: Profile;
  applications: Application[];
  checklist: Record<string, boolean>;
  settings: Settings;
}
