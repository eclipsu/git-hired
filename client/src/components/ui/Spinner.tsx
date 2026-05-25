export default function Spinner({ className = '' }: { className?: string }) {
  const lg = className.includes('h-8') || className.includes('h-10');
  return <div className={`gh-spinner ${lg ? 'gh-spinner-lg' : ''} ${className}`} role="status" aria-label="Loading" />;
}
