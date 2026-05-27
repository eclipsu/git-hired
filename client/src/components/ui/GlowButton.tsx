import type { ButtonHTMLAttributes, ReactNode } from 'react';

type GlowVariant = 'primary' | 'ghost' | 'danger';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: GlowVariant;
}

const variants: Record<GlowVariant, string> = {
  primary:
    'bg-primary text-primary-foreground border-primary hover:brightness-110 active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:border-border disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100',
  ghost:
    'bg-transparent text-foreground border-border hover:bg-secondary active:scale-[0.98]',
  danger:
    'bg-transparent text-destructive border-destructive hover:bg-destructive/10 active:scale-[0.98]',
};

export default function GlowButton({
  children,
  variant = 'primary',
  className = '',
  disabled,
  style,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded font-medium text-sm transition-all duration-150 cursor-pointer select-none border ${variants[variant]} ${className}`}
      disabled={disabled}
      style={
        variant === 'primary' && !disabled
          ? {
              boxShadow: '0 0 16px rgba(88,166,255,0.25), 0 0 4px rgba(88,166,255,0.15)',
              ...style,
            }
          : style
      }
      {...props}
    >
      {children}
    </button>
  );
}
