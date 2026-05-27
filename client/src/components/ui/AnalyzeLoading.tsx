import { useEffect, useState } from 'react';
import { Check, Loader2, Terminal } from 'lucide-react';

const STEPS = [
  'Fetching repositories',
  'Analyzing commits',
  'Reading pull requests',
  'Generating bullet points',
  'Optimizing for ATS keywords',
  'Done.',
];

interface AnalyzeLoadingProps {
  active?: boolean;
  repoNames?: string[];
}

export default function AnalyzeLoading({ active = true, repoNames = [] }: AnalyzeLoadingProps) {
  const [steps, setSteps] = useState<{ text: string; done: boolean }[]>([]);

  useEffect(() => {
    if (!active) return;

    const log = STEPS.map((text, i) => {
      if (i === 0 && repoNames.length > 0) {
        return `Fetching commits from ${repoNames[0]}...`;
      }
      if (i === 1 && repoNames.length > 1) {
        return `Reading PRs from ${repoNames[1]}...`;
      }
      if (i === 2 && repoNames.length > 2) {
        return `Scanning ${repoNames[2]} activity...`;
      }
      return text;
    });

    setSteps(log.map((text) => ({ text, done: false })));

    const timers: ReturnType<typeof setTimeout>[] = [];
    log.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setSteps((s) => s.map((step, si) => (si <= i ? { ...step, done: true } : step)));
        }, 800 * (i + 1)),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [active, repoNames]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-lg rounded border border-border bg-card p-6 mx-4">
        <div className="flex items-center gap-3 mb-5">
          <Terminal size={16} className="text-primary" />
          <span className="font-mono font-semibold text-sm text-foreground">
            Analyzing repositories
          </span>
        </div>
        <div className="space-y-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 font-mono text-sm">
              {step.done ? (
                <Check size={14} className="text-success flex-shrink-0" />
              ) : (
                <Loader2 size={14} className="text-muted-foreground animate-spin flex-shrink-0" />
              )}
              <span className={step.done ? 'text-foreground/80' : 'text-foreground'}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
