import type { ReactNode } from 'react';
import type { BulletItem } from '../../hooks/useAppState';
import type { ContactInfo } from '../../types/contact';
import type {
  EducationEntry,
  LeadershipEntry,
  ProjectEntry,
  ResumeEntry,
  TailoredResume,
} from '../../types/resume';

interface ResumePreviewProps {
  contactInfo: ContactInfo;
  bullets: BulletItem[];
  tailoredResume?: TailoredResume | null;
  className?: string;
}

const TECH_HINTS = [
  'TypeScript', 'JavaScript', 'Python', 'React', 'Node.js', 'Express', 'PostgreSQL',
  'MongoDB', 'AWS', 'Docker', 'Git', 'REST', 'GraphQL', 'Java', 'Go', 'Rust',
];

function inferTechStack(text: string): string {
  const lower = text.toLowerCase();
  const found = TECH_HINTS.filter((t) => lower.includes(t.toLowerCase()));
  return found.slice(0, 5).join(', ');
}

function bulletsToProjects(bullets: BulletItem[]): ProjectEntry[] {
  const included = bullets.filter((b) => b.included);
  const grouped = included.reduce<Record<string, string[]>>((acc, b) => {
    if (!acc[b.displayName]) acc[b.displayName] = [];
    acc[b.displayName].push(b.text);
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, texts]) => ({
    name,
    techStack: inferTechStack(texts.join(' ')),
    dates: '',
    bullets: texts,
  }));
}

function inferSkills(bullets: BulletItem[]): Record<string, string[]> {
  const text = bullets.filter((b) => b.included).map((b) => b.text).join(' ').toLowerCase();
  const langs: string[] = [];
  const frameworks: string[] = [];
  const tools: string[] = [];

  for (const hint of TECH_HINTS) {
    if (!text.includes(hint.toLowerCase())) continue;
    const l = hint.toLowerCase();
    if (['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'sql'].some((x) => l.includes(x))) {
      langs.push(hint);
    } else if (['react', 'node', 'express', 'graphql'].some((x) => l.includes(x))) {
      frameworks.push(hint);
    } else {
      tools.push(hint);
    }
  }

  const skills: Record<string, string[]> = {};
  if (langs.length) skills.Languages = langs;
  if (frameworks.length) skills['Frameworks & Libraries'] = frameworks;
  if (tools.length) skills['Tools & Technologies'] = tools;
  return skills;
}

function resolveResumeData(bullets: BulletItem[], tailoredResume?: TailoredResume | null) {
  if (tailoredResume) {
    return {
      education: tailoredResume.education ?? [],
      experience: tailoredResume.experience ?? [],
      projects: tailoredResume.projects ?? [],
      skills: tailoredResume.skills ?? {},
      leadership: tailoredResume.leadership ?? [],
    };
  }

  return {
    education: [] as EducationEntry[],
    experience: [] as ResumeEntry[],
    projects: bulletsToProjects(bullets),
    skills: inferSkills(bullets),
    leadership: [] as LeadershipEntry[],
  };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="resume-section-title">{children}</h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="resume-bullets">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function SubheadingBlock({
  primary,
  dates,
  secondary,
  location,
  bullets,
}: {
  primary: string;
  dates: string;
  secondary: string;
  location?: string;
  bullets?: string[];
}) {
  return (
    <div className="resume-subheading">
      <div className="resume-subheading-row">
        <span className="resume-subheading-primary">{primary}</span>
        {dates && <span className="resume-subheading-dates">{dates}</span>}
      </div>
      {(secondary || location) && (
        <div className="resume-subheading-row">
          {secondary && <span className="resume-subheading-secondary">{secondary}</span>}
          {location && <span className="resume-subheading-secondary">{location}</span>}
        </div>
      )}
      {bullets && <BulletList items={bullets} />}
    </div>
  );
}

function ProjectBlock({ project }: { project: ProjectEntry }) {
  return (
    <div className="resume-subheading">
      <div className="resume-subheading-row">
        <span className="resume-project-heading">
          <strong>{project.name}</strong>
          {project.techStack && (
            <>
              {' '}
              <span className="resume-project-sep">|</span>
              {' '}
              <em>{project.techStack}</em>
            </>
          )}
        </span>
        {project.dates && <span className="resume-subheading-dates">{project.dates}</span>}
      </div>
      <BulletList items={project.bullets} />
    </div>
  );
}

export default function ResumePreview({
  contactInfo,
  bullets,
  tailoredResume,
  className = '',
}: ResumePreviewProps) {
  const name = contactInfo.fullName?.trim() || 'Your Name';
  const { education, experience, projects, skills, leadership } = resolveResumeData(
    bullets,
    tailoredResume,
  );

  const contactParts: ReactNode[] = [];
  if (contactInfo.phone) {
    contactParts.push(
      <span key="phone">
        <i className="fa-solid fa-phone" aria-hidden /> {contactInfo.phone}
      </span>,
    );
  }
  if (contactInfo.email) {
    contactParts.push(
      <span key="email">
        <i className="fa-regular fa-envelope" aria-hidden />{' '}
        <span className="resume-link">{contactInfo.email}</span>
      </span>,
    );
  }
  if (contactInfo.linkedin) {
    contactParts.push(
      <span key="linkedin">
        <i className="fa-brands fa-linkedin" aria-hidden />{' '}
        <span className="resume-link">{contactInfo.linkedin.replace(/^https?:\/\//i, '')}</span>
      </span>,
    );
  }
  if (contactInfo.github) {
    contactParts.push(
      <span key="github">
        <i className="fa-brands fa-github" aria-hidden />{' '}
        <span className="resume-link">{contactInfo.github.replace(/^https?:\/\//i, '')}</span>
      </span>,
    );
  }

  return (
    <article className={`resume-jake ${className}`}>
      <header className="resume-header">
        <h1 className="resume-name">{name}</h1>
        {contactInfo.address?.trim() && (
          <p className="resume-address">{contactInfo.address}</p>
        )}
        {contactParts.length > 0 && (
          <p className="resume-contact">
            {contactParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="resume-contact-sep"> · </span>}
                {part}
              </span>
            ))}
          </p>
        )}
      </header>

      {education.length > 0 && (
        <section>
          <SectionTitle>Education</SectionTitle>
          {education.map((entry, i) => (
            <SubheadingBlock
              key={i}
              primary={entry.institution}
              dates={entry.dates}
              secondary={entry.degree}
              location={entry.location}
            />
          ))}
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <SectionTitle>Experience</SectionTitle>
          {experience.map((entry, i) => (
            <SubheadingBlock
              key={i}
              primary={entry.org}
              dates={entry.dates}
              secondary={entry.title}
              location={entry.location}
              bullets={entry.bullets}
            />
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <SectionTitle>Projects</SectionTitle>
          {projects.map((project, i) => (
            <ProjectBlock key={i} project={project} />
          ))}
        </section>
      )}

      {Object.keys(skills).length > 0 && (
        <section>
          <SectionTitle>Technical Skills</SectionTitle>
          <div className="resume-skills">
            {Object.entries(skills).map(([category, items]) =>
              items.length > 0 ? (
                <p key={category}>
                  <strong>{category}</strong>: {items.join(', ')}
                </p>
              ) : null,
            )}
          </div>
        </section>
      )}

      {leadership && leadership.length > 0 && (
        <section>
          <SectionTitle>Leadership</SectionTitle>
          {leadership.map((entry, i) => (
            <SubheadingBlock
              key={i}
              primary={entry.org}
              dates={entry.dates}
              secondary={entry.role}
              location={entry.location}
              bullets={entry.bullets}
            />
          ))}
        </section>
      )}
    </article>
  );
}
