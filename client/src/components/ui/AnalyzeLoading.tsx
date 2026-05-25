import { useEffect, useState } from 'react';
import AppBox from './AppBox';
import Spinner from './Spinner';

const STEPS = [
  'Fetching repositories',
  'Analyzing commits',
  'Identifying key contributions',
  'Extracting technologies',
  'Generating resume bullets',
  'Optimizing for impact',
];

const STEP_MS = 4500;
const LAST_STEP_INDEX = STEPS.length - 1;

interface AnalyzeLoadingProps {
  active?: boolean;
}

export default function AnalyzeLoading({ active = true }: AnalyzeLoadingProps) {
  const [completedStep, setCompletedStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setAllDone(true);
      return undefined;
    }

    setCompletedStep(0);
    setAllDone(false);
    setElapsedSec(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < LAST_STEP_INDEX; i += 1) {
      timers.push(
        setTimeout(() => setCompletedStep(i + 1), (i + 1) * STEP_MS),
      );
    }

    const elapsedId = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(elapsedId);
    };
  }, [active]);

  const visibleCompleted = allDone ? STEPS.length : completedStep;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <AppBox className="w-full max-w-lg">
        <h2 className="text-base font-semibold">Analyzing your repositories</h2>
        <p className="mt-1 text-sm text-[var(--ui-fg-muted)]">
          This usually takes 30–90 seconds.
          {elapsedSec >= 10 && (
            <span className="block mt-1 text-xs">{elapsedSec}s elapsed…</span>
          )}
        </p>

        <ul className="mt-6 space-y-3">
          {STEPS.map((label, i) => {
            const isLast = i === LAST_STEP_INDEX;
            const done = !isLast ? visibleCompleted > i : allDone;
            const isActive = !done && (isLast ? active : visibleCompleted === i);
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                {done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ui-success-subtle)] text-[var(--ui-success-fg)] text-xs">✓</span>
                ) : isActive ? (
                  <Spinner />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-[var(--ui-border-default)]" />
                )}
                <span className={done || isActive ? 'text-[var(--ui-fg-default)]' : 'text-[var(--ui-fg-subtle)]'}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </AppBox>
    </div>
  );
}
