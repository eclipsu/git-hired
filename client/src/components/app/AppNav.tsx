import { Link } from 'react-router-dom';
import { STEP_LABELS, STEP_ORDER, type AppStep } from '../../hooks/useAppState';
import GitHubHeader, { GitHubSubNav } from '../github/GitHubHeader';
import { ghBtnClass } from '../github/GitHubButton';

interface AppNavProps {
  current: AppStep;
  completed: AppStep[];
}

export default function AppNav({ current, completed }: AppNavProps) {
  const subnavItems = STEP_ORDER.filter((s) => s !== 'connect').map((step) => ({
    key: step,
    label: STEP_LABELS[step],
    active: step === current,
    done: completed.includes(step),
  }));

  return (
    <>
      <GitHubHeader
        right={
          <Link to="/dashboard" className={`${ghBtnClass('invisible')} gh-btn-sm !text-white/80 hover:!text-white`}>
            Dashboard
          </Link>
        }
      />
      <GitHubSubNav items={subnavItems} />
    </>
  );
}
