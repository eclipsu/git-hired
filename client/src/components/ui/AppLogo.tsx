import { Link } from 'react-router-dom';
import { FileCode2 } from 'lucide-react';

export function AppIcon({ size = 28 }: { size?: number }) {
  return <FileCode2 size={size} strokeWidth={2} aria-hidden />;
}

export function GitApplyLogo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="ui-logo">
      <AppIcon size={28} />
      <span className="ui-logo-text">GitApply</span>
    </Link>
  );
}
