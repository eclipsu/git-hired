import GitHubBox, { GitHubLabel } from '../github/GitHubBox';
import GitHubButton from '../github/GitHubButton';
import Spinner from '../ui/Spinner';
import { computeAtsMatch } from '../../utils/atsMatch';
import type { BulletItem } from '../../hooks/useAppState';
import type { ContactInfo } from '../../types/contact';
import ResumePreview from '../resume/ResumePreview';

interface StepTailorProps {
  jobDescription: string;
  bullets: BulletItem[];
  contactInfo: ContactInfo;
  generating: boolean;
  onJobDescriptionChange: (jd: string) => void;
  onGenerate: () => void;
}

const SKILL_WORDS = new Set([
  'react', 'node', 'nodejs', 'node.js', 'typescript', 'javascript', 'python', 'java',
  'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'rest', 'api', 'graphql',
  'authentication', 'auth', 'tailwind', 'next.js', 'nextjs', 'express', 'sql', 'redis',
]);

function extractSkills(jd: string): string[] {
  const found = new Set<string>();
  const lower = jd.toLowerCase();
  for (const skill of SKILL_WORDS) {
    if (lower.includes(skill)) {
      found.add(skill === 'nodejs' || skill === 'node.js' ? 'Node.js' : skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }
  if (lower.includes('rest api')) found.add('REST APIs');
  return Array.from(found).slice(0, 10);
}

function jobTitle(jd: string): string {
  const line = jd.trim().split('\n').find((l) => l.length > 5);
  return line?.slice(0, 50) ?? 'this role';
}

export default function StepTailor({
  jobDescription,
  bullets,
  contactInfo,
  generating,
  onJobDescriptionChange,
  onGenerate,
}: StepTailorProps) {
  const bulletText = bullets.filter((b) => b.included).map((b) => b.text).join(' ');
  const matchPercent = computeAtsMatch(jobDescription, bulletText);
  const skills = extractSkills(jobDescription);

  return (
    <div className="gh-container-wide py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <GitHubBox>
          <label className="gh-form-label" htmlFor="jd">Job description</label>
          <textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the full job description…"
            className="gh-textarea mt-2 h-72"
          />
          {skills.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[var(--gh-fg-muted)]">Detected skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => <GitHubLabel key={s} variant="accent">{s}</GitHubLabel>)}
              </div>
            </div>
          )}
          {jobDescription.trim() && (
            <p className="mt-3 text-xs text-[var(--gh-fg-muted)]">~{matchPercent}% keyword overlap with your bullets</p>
          )}
        </GitHubBox>

        <div>
          {jobDescription.trim() && (
            <GitHubLabel variant="success">Tailored for {jobTitle(jobDescription)}</GitHubLabel>
          )}
          <h3 className="mt-4 text-base font-semibold">Preview</h3>
          <div className="mt-3 max-h-[560px] overflow-y-auto rounded-md border border-[var(--gh-border-default)]">
            <ResumePreview contactInfo={contactInfo} bullets={bullets} />
          </div>
          <GitHubButton variant="primary" className="mt-4 w-full" disabled={generating} onClick={onGenerate}>
            {generating ? <><Spinner /> Generating…</> : 'Generate tailored resume'}
          </GitHubButton>
        </div>
      </div>
    </div>
  );
}
