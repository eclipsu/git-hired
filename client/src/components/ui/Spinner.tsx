export default function Spinner({ className = '' }: { className?: string }) {
  const lg = className.includes('h-8') || className.includes('h-10');
  return <div className={`ui-spinner ${lg ? 'ui-spinner-lg' : ''} ${className}`} role="status" aria-label="Loading" />;
}
