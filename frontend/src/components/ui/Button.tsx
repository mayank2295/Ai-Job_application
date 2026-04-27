import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ size?: number }>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none' },
  secondary: { background: 'transparent', color: 'var(--accent-primary)', border: '1.5px solid var(--accent-primary)' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' },
  danger: { background: '#ef4444', color: '#fff', border: 'none' },
  success: { background: '#10b981', color: '#fff', border: 'none' },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12 },
  md: { padding: '9px 18px', fontSize: 14 },
  lg: { padding: '12px 28px', fontSize: 15 },
};

const ICON_SIZES = { sm: 13, md: 15, lg: 16 };

export default function Button({
  variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left',
  loading = false, fullWidth = false, children, disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontWeight: 600, borderRadius: 8, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.55 : 1, fontFamily: 'inherit',
        transition: 'opacity 0.15s, transform 0.1s', width: fullWidth ? '100%' : undefined,
        ...VARIANT_STYLES[variant], ...SIZE_STYLES[size], ...style,
      }}
      {...props}
    >
      {loading ? (
        <><div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading...</>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={ICON_SIZES[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={ICON_SIZES[size]} />}
        </>
      )}
    </button>
  );
}
