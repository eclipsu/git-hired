import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DesignLogo from './DesignLogo';

interface PageTopBarProps {
  crumb?: string;
  back?: { label: string; onClick: () => void };
  centered?: boolean;
  right?: ReactNode;
  homeLink?: string;
}

export default function PageTopBar({ crumb, back, centered, right, homeLink }: PageTopBarProps) {
  if (centered) {
    return (
      <div className="border-b border-border px-6 py-3 flex items-center flex-shrink-0">
        {back ? (
          <button
            type="button"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm cursor-pointer"
            onClick={back.onClick}
          >
            <ArrowLeft size={14} /> {back.label}
          </button>
        ) : (
          <div className="w-24" />
        )}
        <div className="flex-1 flex justify-center">
          <DesignLogo />
        </div>
        <div className="flex items-center gap-3 w-24 justify-end">{right}</div>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-8 py-4 flex items-center gap-4">
      {back ? (
        <>
          <button
            type="button"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-mono text-sm cursor-pointer"
            onClick={back.onClick}
          >
            <ArrowLeft size={14} /> {back.label}
          </button>
          <span className="text-border">/</span>
        </>
      ) : null}
      {homeLink ? (
        <Link to={homeLink}>
          <DesignLogo />
        </Link>
      ) : (
        <DesignLogo />
      )}
      {crumb && (
        <>
          <span className="text-border">/</span>
          <span className="text-muted-foreground font-mono text-sm">{crumb}</span>
        </>
      )}
      {right && <div className="ml-auto flex items-center gap-3">{right}</div>}
    </div>
  );
}
