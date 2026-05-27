import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import PageTopBar from '../ui/PageTopBar';
import { computeAtsMatch } from '../../utils/atsMatch';
import type { BulletItem } from '../../hooks/useAppState';

interface StepTailorProps {
  jobDescription: string;
  bullets: BulletItem[];
  generating: boolean;
  onJobDescriptionChange: (jd: string) => void;
  onGenerate: () => void;
  onBack: () => void;
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
      found.add(
        skill === 'nodejs' || skill === 'node.js'
          ? 'Node.js'
          : skill.charAt(0).toUpperCase() + skill.slice(1),
      );
    }
  }
  if (lower.includes('rest api')) found.add('REST APIs');
  return Array.from(found).slice(0, 10);
}

function useProgress(generating: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!generating) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8));
    }, 300);
    return () => clearInterval(interval);
  }, [generating]);

  return progress;
}

export default function StepTailor({
  jobDescription,
  bullets,
  generating,
  onJobDescriptionChange,
  onGenerate,
  onBack,
}: StepTailorProps) {
  const progress = useProgress(generating);
  const bulletText = bullets.filter((b) => b.included).map((b) => b.text).join(' ');
  const matchPercent = computeAtsMatch(jobDescription, bulletText);
  const skills = extractSkills(jobDescription);

  return (
    <div className="min-h-screen bg-background">
      <PageTopBar back={{ label: 'enrich', onClick: onBack }} crumb="tailor" />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-sans font-bold text-2xl text-foreground mb-2">Tailor to a job</h1>
        <p className="text-muted-foreground text-sm font-sans mb-8">
          Paste any job posting and we&apos;ll optimize your resume for it. Leave blank for a general resume.
        </p>

        <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
          Job description (optional)
        </label>
        <textarea
          className="w-full h-72 rounded border border-border bg-card text-foreground text-sm font-sans p-4 resize-none placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          placeholder={`Paste any job posting — we'll optimize your resume for it. Leave blank for a general resume.\n\nExample:\n\nSenior Software Engineer — Infrastructure\nWe're looking for an experienced engineer to join our platform team...`}
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
        />

        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded-sm border border-primary/30 bg-primary/5 text-primary"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {jobDescription.trim() && (
          <p className="mt-3 text-xs text-muted-foreground font-mono">
            ~{matchPercent}% keyword overlap with your bullets
          </p>
        )}

        <div className="mt-6">
          {generating ? (
            <div className="relative w-full h-12 rounded border border-primary/40 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 96)}%`,
                  background: 'linear-gradient(90deg, rgba(88,166,255,0.3), rgba(88,166,255,0.15))',
                  boxShadow: '1px 0 8px rgba(88,166,255,0.5)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-sm text-primary flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing and writing your resume...
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              className="w-full h-12 rounded font-semibold font-sans text-sm transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #58A6FF 0%, #4493f8 100%)',
                color: '#0D1117',
                boxShadow: '0 0 20px rgba(88,166,255,0.3), 0 0 6px rgba(88,166,255,0.15)',
              }}
            >
              Generate resume →
            </button>
          )}
          {!generating && (
            <p className="text-center text-xs text-muted-foreground font-mono mt-2">
              This usually takes 10–15 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
