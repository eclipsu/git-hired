export interface ResumeEntry {
  title: string;
  org: string;
  dates: string;
  location?: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  techStack: string;
  dates: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  dates: string;
  degree: string;
  location?: string;
}

export interface LeadershipEntry {
  org: string;
  dates: string;
  role: string;
  location?: string;
  bullets: string[];
}

export interface TailoredResume {
  skills: Record<string, string[]>;
  softSkills?: string[];
  experience: ResumeEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  leadership?: LeadershipEntry[];
}
