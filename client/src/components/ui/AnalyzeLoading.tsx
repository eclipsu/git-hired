import { useEffect, useState } from 'react';
import { Check, Loader2, Rocket } from 'lucide-react';

const STEPS = [
  'Fetching repositories',
  'Analyzing commits',
  'Identifying key contributions',
  'Extracting technologies',
  'Generating resume bullets',
  'Optimizing for impact',
];

interface AnalyzeLoadingProps {
  active?: boolean;
}

export default function AnalyzeLoading({ active = true }: AnalyzeLoadingProps) {
  const [completedStep, setCompletedStep] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    setCompletedStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setCompletedStep(i + 1), (i + 1) * 900),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const activeIndex = Math.min(completedStep, STEPS.length - 1);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Analyzing your GitHub activity...</h2>
        <p className="mt-1 text-sm text-gray-500">This usually takes 30–60 seconds.</p>

        <ul className="mt-8 space-y-4">
          {STEPS.map((label, i) => {
            const done = completedStep > i;
            const isActive = !done && activeIndex === i;
            return (
              <li key={label} className="flex items-center gap-3">
                {done ? (
                  <span className="flex h-6 w-6 animate-check-in items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : isActive ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
                ) : (
                  <span className="h-6 w-6 rounded-full border-2 border-gray-200" />
                )}
                <span className={`text-sm ${done ? 'text-gray-900' : isActive ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-[#7C3AED]" />
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Tip:</span> The more active your GitHub, the better your resume will be.
          </p>
        </div>
      </div>
    </div>
  );
}
