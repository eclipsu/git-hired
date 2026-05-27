import { Link } from 'react-router-dom';

interface DesignLogoProps {
  to?: string;
  className?: string;
}

export default function DesignLogo({ to = '/', className = '' }: DesignLogoProps) {
  const logo = (
    <span className={`font-display font-bold text-foreground tracking-tight text-lg ${className}`}>
      <span className="text-primary">git</span>
      <span className="text-muted-foreground">-</span>
      <span>apply</span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="no-underline hover:opacity-90 transition-opacity">
        {logo}
      </Link>
    );
  }

  return logo;
}
