export default function GitHubBox({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`gh-box ${className}`} {...props}>
      {children}
    </div>
  );
}

export function GitHubBoxHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="gh-box-header">
      <h3 className="gh-box-title">{title}</h3>
      {action}
    </div>
  );
}

export function GitHubLabel({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'accent' | 'success' | 'attention' }) {
  return <span className={`gh-label gh-label-${variant}`}>{children}</span>;
}

export function GitHubFlash({
  variant = 'default',
  children,
}: {
  variant?: 'default' | 'success' | 'warn' | 'error';
  children: React.ReactNode;
}) {
  return <div className={`gh-flash gh-flash-${variant}`}>{children}</div>;
}
