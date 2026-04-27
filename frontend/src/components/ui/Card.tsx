import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const PADDING = { none: 0, sm: 16, md: 20, lg: 28 };

export default function Card({ children, variant = 'default', padding = 'md', hover = false, style, ...props }: CardProps) {
  return (
    <div
      style={{
        borderRadius: 12, padding: PADDING[padding],
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        boxShadow: variant === 'elevated' ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
        cursor: hover ? 'pointer' : undefined,
        transition: hover ? 'box-shadow 0.2s, transform 0.15s' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
