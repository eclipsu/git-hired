import { Link } from 'react-router-dom';
import { STEP_LABELS, STEP_ORDER, type AppStep } from '../../hooks/useAppState';
import AppHeader, { AppSubNav } from '../ui/AppHeader';
import { uiBtnClass } from '../ui/AppButton';

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
      <AppHeader
        right={
          <Link to="/dashboard" className={`${uiBtnClass('invisible')} ui-btn-sm !text-white/80 hover:!text-white`}>
            Dashboard
          </Link>
        }
      />
      <AppSubNav items={subnavItems} />
    </>
  );
}
