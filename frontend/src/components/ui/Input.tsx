import type { InputHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<{ size?: number }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, iconPosition = 'left', fullWidth = false, className = '', style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ width: fullWidth ? '100%' : undefined }} className={className}>
        {label && (
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {Icon && iconPosition === 'left' && (
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <Icon size={16} />
            </div>
          )}
          <input
            ref={ref}
            onFocus={e => { setFocused(true); props.onFocus?.(e); }}
            onBlur={e => { setFocused(false); props.onBlur?.(e); }}
            style={{
              width: '100%', padding: Icon && iconPosition === 'left' ? '10px 12px 10px 36px' : '10px 12px',
              borderRadius: 8, border: `1.5px solid ${error ? '#ef4444' : focused ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
              ...style,
            }}
            {...props}
          />
          {Icon && iconPosition === 'right' && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <Icon size={16} />
            </div>
          )}
        </div>
        {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
        {helperText && !error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
