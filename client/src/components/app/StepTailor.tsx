import { computeAtsMatch } from '../../utils/atsMatch';
import type { BulletItem } from '../../hooks/useAppState';

interface StepTailorProps {
  jobDescription: string;
  bullets: BulletItem[];
  generating: boolean;
  onJobDescriptionChange: (jd: string) => void;
  onGenerate: () => void;
}

export default function StepTailor({
  jobDescription,
  bullets,
  generating,
  onJobDescriptionChange,
  onGenerate,
}: StepTailorProps) {
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;
  const bulletText = bullets.filter((b) => b.included).map((b) => b.text).join(' ');
  const matchPercent = computeAtsMatch(jobDescription, bulletText);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
      <div className="app-card p-6">
        <label className="font-semibold text-[#1a1a1a]" htmlFor="jd">
          Paste a job description
        </label>
        <textarea
          id="jd"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the job description here. We'll rewrite and reorder your bullets to match the role's language and maximize ATS keyword match. Leave blank to generate a strong general-purpose resume."
          className="mt-4 h-56 w-full resize-none rounded-xl border border-[#E8E8E4] p-4 text-sm"
        />

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#64748B]">
          <span>{wordCount} words</span>
          {jobDescription.trim() && (
            <span className="rounded-full bg-[#E8EDE8] px-3 py-0.5 text-[#5A7A6A]">
              ~{matchPercent}% keyword overlap
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={generating}
          onClick={onGenerate}
          className="mt-6 flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {generating && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {generating ? 'Generating your resume...' : 'Generate resume →'}
        </button>
      </div>
    </div>
  );
}
