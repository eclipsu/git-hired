import fs from 'fs';
import path from 'path';

const LATEX_SPECIAL = /[&%$#_{}~^\\]/g;

export function escapeLatex(value: string): string {
  return value.replace(LATEX_SPECIAL, (char) => {
    switch (char) {
      case '\\':
        return '\\textbackslash{}';
      case '~':
        return '\\textasciitilde{}';
      case '^':
        return '\\textasciicircum{}';
      default:
        return `\\${char}`;
    }
  });
}

export interface ContactInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

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

function normalizeLinkedIn(value: string): { url: string; label: string } {
  const trimmed = value.trim().replace(/^https?:\/\//i, '');
  const handle = trimmed.replace(/^www\./i, '').replace(/^linkedin\.com\/in\//i, '');
  return {
    url: `https://linkedin.com/in/${handle}`,
    label: `linkedin.com/in/${handle}`,
  };
}

function normalizeGithub(value: string): { url: string; label: string } {
  const trimmed = value.trim().replace(/^https?:\/\//i, '');
  const handle = trimmed.replace(/^www\./i, '').replace(/^github\.com\//i, '');
  return {
    url: `https://github.com/${handle}`,
    label: `github.com/${handle}`,
  };
}

function bulletList(bullets: string[]): string {
  if (bullets.length === 0) return '';
  return `      \\resumeItemListStart
${bullets.map((b) => `        \\resumeItem{${escapeLatex(b)}}`).join('\n')}
      \\resumeItemListEnd`;
}

function sectionHeading(name: string): string {
  return `\\needspace{4\\baselineskip}\n\\section{${name}}`;
}

function experienceSection(entries: ResumeEntry[]): string {
  if (entries.length === 0) {
    return `%-----------EXPERIENCE-----------
${sectionHeading('Experience')}
  \\resumeSubHeadingListStart
  \\resumeSubHeadingListEnd
\\vspace{-10pt}
`;
  }

  const blocks = entries
    .map(
      (entry) => `    \\resumeSubheading
      {${escapeLatex(entry.org)}}{${escapeLatex(entry.dates)}}
      {${escapeLatex(entry.title)}}{${escapeLatex(entry.location ?? '')}}
${bulletList(entry.bullets)}`,
    )
    .join('\n\n');

  return `%-----------EXPERIENCE-----------
${sectionHeading('Experience')}
  \\resumeSubHeadingListStart

${blocks}

  \\resumeSubHeadingListEnd
\\vspace{-10pt}
`;
}

function projectsSection(entries: ProjectEntry[]): string {
  if (entries.length === 0) {
    return `%-----------PROJECTS-----------
${sectionHeading('Projects')}
    \\vspace{-5pt}
    \\resumeSubHeadingListStart
    \\resumeSubHeadingListEnd
\\vspace{-10pt}
`;
  }

  const blocks = entries
    .map((entry, i) => {
      const spacing = i < entries.length - 1 ? '\n          \\vspace{-8pt}' : '';
      return `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(entry.name)}} $|$ \\emph{${escapeLatex(entry.techStack)}}}{${escapeLatex(entry.dates)}}
${bulletList(entry.bullets)}${spacing}`;
    })
    .join('\n\n');

  return `%-----------PROJECTS-----------
${sectionHeading('Projects')}
    \\vspace{-4pt}
    \\resumeSubHeadingListStart

${blocks}

    \\resumeSubHeadingListEnd
\\vspace{-10pt}
`;
}

function educationSection(entries: EducationEntry[]): string {
  if (entries.length === 0) return '';

  const blocks = entries
    .map(
      (entry) => `    \\resumeSubheading
      {${escapeLatex(entry.institution)}}{${escapeLatex(entry.dates)}}
      {${escapeLatex(entry.degree)}}{${escapeLatex(entry.location ?? '')}}`,
    )
    .join('\n');

  return `%-----------EDUCATION-----------
${sectionHeading('Education')}
  \\resumeSubHeadingListStart
${blocks}
  \\resumeSubHeadingListEnd

`;
}

function skillsSection(skills: Record<string, string[]>, softSkills?: string[]): string {
  const lines = Object.entries(skills ?? {})
    .filter(([, items]) => items.length > 0)
    .map(
      ([category, items]) =>
        `     \\textbf{${escapeLatex(category)}}{: ${escapeLatex(items.join(', '))}} \\\\`,
    );

  if (softSkills && softSkills.length > 0) {
    lines.push(
      `     \\textbf{Soft Skills}{: ${escapeLatex(softSkills.join(', '))}} \\\\`,
    );
  }

  if (lines.length === 0) {
    return `%-----------TECHNICAL SKILLS-----------
${sectionHeading('Technical Skills')}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{}}
 \\end{itemize}
 \\vspace{-10pt}
`;
  }

  return `%-----------TECHNICAL SKILLS-----------
${sectionHeading('Technical Skills')}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${lines.join('\n')}
    }}
 \\end{itemize}
 \\vspace{-10pt}
`;
}

function leadershipSection(entries: LeadershipEntry[] | undefined): string {
  if (!entries || entries.length === 0) return '';

  const blocks = entries
    .map(
      (entry) => `        \\resumeSubheading{${escapeLatex(entry.org)}}{${escapeLatex(entry.dates)}}{${escapeLatex(entry.role)}}{${escapeLatex(entry.location ?? '')}}
${bulletList(entry.bullets)}`,
    )
    .join('\n');

  return `%-----------LEADERSHIP---------------
${sectionHeading('Leadership')}
    \\resumeSubHeadingListStart
${blocks}
    \\resumeSubHeadingListEnd

`;
}

function headingSection(contact: ContactInfo): string {
  const linkedin = normalizeLinkedIn(contact.linkedin || '');
  const github = normalizeGithub(contact.github || '');

  const addressLine = contact.address.trim()
    ? `${escapeLatex(contact.address)}  \\\\ \\vspace{1pt}`
    : '';

  return `%----------HEADING----------
\\begin{center}
    {\\Huge \\scshape ${escapeLatex(contact.fullName)}} \\\\ \\vspace{1pt}
    ${addressLine}
    \\small \\Telefon\\ ${escapeLatex(contact.phone)} ~
    \\href{mailto:${escapeLatex(contact.email)}}{\\Letter\\ \\underline{${escapeLatex(contact.email)}}} ~
    \\href{${escapeLatex(linkedin.url)}}{LinkedIn: \\underline{${escapeLatex(linkedin.label)}}}  ~
    \\href{${escapeLatex(github.url)}}{GitHub: \\underline{${escapeLatex(github.label)}}}
    \\vspace{-5pt}
\\end{center}

`;
}

function loadPreamble(): string {
  const templatePath = path.join(process.cwd(), 'tex', 'resume-template.tex');
  if (!fs.existsSync(templatePath)) {
    throw new Error('Missing tex/resume-template.tex');
  }

  return fs
    .readFileSync(templatePath, 'utf-8')
    .replace('\\input{glyphtounicode}\n', '')
    .trimEnd();
}

export function generateLatex(resume: TailoredResume, contact: ContactInfo): string {
  const preamble = loadPreamble();
  const body = [
    headingSection(contact),
    educationSection(resume.education ?? []),
    experienceSection(resume.experience ?? []),
    projectsSection(resume.projects ?? []),
    skillsSection(resume.skills ?? {}, resume.softSkills),
    leadershipSection(resume.leadership),
    '\\end{document}',
  ].join('\n');

  return `${preamble}\n\n\\begin{document}\n\n${body}\n`;
}

export const CONTACT_FIELD_LABELS: Record<keyof ContactInfo, string> = {
  fullName: 'full name',
  address: 'street address, city, state ZIP',
  phone: 'phone number',
  email: 'email address',
  linkedin: 'LinkedIn profile (e.g. linkedin.com/in/yourhandle)',
  github: 'GitHub profile (e.g. github.com/yourhandle)',
};

export const REQUIRED_CONTACT_FIELDS: (keyof ContactInfo)[] = [
  'fullName',
  'phone',
  'email',
  'linkedin',
  'github',
];

export function missingContactFields(contact: Partial<ContactInfo>): (keyof ContactInfo)[] {
  return REQUIRED_CONTACT_FIELDS.filter((field) => !contact[field]?.trim());
}
