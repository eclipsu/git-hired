import { useCallback, useState } from 'react';
import type { TailoredResume } from '../types/resume';

export type AppStep = 'connect' | 'analyze' | 'enrich' | 'bullets' | 'tailor' | 'export';

export interface RepoItem {
  name: string;
  displayName: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  commitCount: number;
  selected: boolean;
}

export interface BulletItem {
  id: string;
  text: string;
  repo: string;
  displayName: string;
  included: boolean;
}

export interface UserProfile {
  githubId: string;
  username: string;
  avatarUrl: string;
}

export interface ParsedResume {
  filename: string;
  text: string;
}

export interface AppState {
  step: AppStep;
  user: UserProfile | null;
  repos: RepoItem[];
  bullets: BulletItem[];
  parsedResume: ParsedResume | null;
  notes: string;
  jobDescription: string;
  generatedTex: string;
  originalTex: string;
  tailoredResume: TailoredResume | null;
  atsMatchPercent: number;
}

export const STEP_ORDER: AppStep[] = [
  'connect',
  'analyze',
  'enrich',
  'bullets',
  'tailor',
  'export',
];

export const STEP_LABELS: Record<AppStep, string> = {
  connect: 'Connect',
  analyze: 'Analyze',
  enrich: 'Enrich',
  bullets: 'Bullets',
  tailor: 'Tailor',
  export: 'Export',
};

const initialState: AppState = {
  step: 'analyze',
  user: null,
  repos: [],
  bullets: [],
  parsedResume: null,
  notes: '',
  jobDescription: '',
  generatedTex: '',
  originalTex: '',
  tailoredResume: null,
  atsMatchPercent: 0,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  const setStep = useCallback((step: AppStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const patch = useCallback((partial: Partial<AppState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  return { state, setStep, patch };
}
