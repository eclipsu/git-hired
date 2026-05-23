import { Loader2, Plus } from 'lucide-react';
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
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-gray-900" htmlFor="jd">
            Paste Job Description
          </label>
          <textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the full job description here. We'll rewrite bullets to match the role's language and maximize ATS keyword match."
            className="mt-3 h-72 w-full resize-none rounded-xl border border-gray-200 p-4 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
          {skills.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key Skills Detected</p>
                <button type="button" className="cursor-pointer text-xs text-[#7C3AED] hover:underline">
                  Edit Keywords
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-[#7C3AED]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {jobDescription.trim() && (
            <p className="mt-3 text-xs text-gray-400">~{matchPercent}% keyword overlap with your bullets</p>
          )}
        </div>

        <div>
          {jobDescription.trim() && (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Tailored for {jobTitle(jobDescription)}
            </span>
          )}
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Tailored Resume (Preview)</h3>
          <div className="mt-4 max-h-[560px] overflow-y-auto rounded-xl border border-gray-200 shadow-sm">
            <ResumePreview contactInfo={contactInfo} bullets={bullets} />
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={onGenerate}
            className="btn-primary mt-6 w-full !rounded-lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Tailor My Resume
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
