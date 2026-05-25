import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'default' | 'danger' | 'invisible';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'ui-btn-primary',
  default: 'ui-btn-default',
  danger: 'ui-btn-danger',
  invisible: 'ui-btn-invisible',
};

export default function AppButton({
  variant = 'default',
  className = '',
  children,
  type = 'button',
  ...props
}: AppButtonProps) {
  return (
    <button type={type} className={`ui-btn ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function uiBtnClass(variant: Variant = 'default'): string {
  return `ui-btn ${VARIANT_CLASS[variant]}`;
}
