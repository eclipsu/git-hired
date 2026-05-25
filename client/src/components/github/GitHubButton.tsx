import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'default' | 'danger' | 'invisible';

interface GitHubButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'gh-btn-primary',
  default: 'gh-btn-default',
  danger: 'gh-btn-danger',
  invisible: 'gh-btn-invisible',
};

export default function GitHubButton({
  variant = 'default',
  className = '',
  children,
  type = 'button',
  ...props
}: GitHubButtonProps) {
  return (
    <button type={type} className={`gh-btn ${VARIANT_CLASS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ghBtnClass(variant: Variant = 'default'): string {
  return `gh-btn ${VARIANT_CLASS[variant]}`;
}
