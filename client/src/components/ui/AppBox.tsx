export default function AppBox({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ui-box ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AppBoxHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="ui-box-header">
      <h3 className="ui-box-title">{title}</h3>
      {action}
    </div>
  );
}

export function AppLabel({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'attention';
}) {
  return <span className={`ui-label ui-label-${variant}`}>{children}</span>;
}

export function AppFlash({
  variant = 'default',
  children,
}: {
  variant?: 'default' | 'success' | 'warn' | 'error';
  children: React.ReactNode;
}) {
  return <div className={`ui-flash ui-flash-${variant}`}>{children}</div>;
}
