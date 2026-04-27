import type { TextareaHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = false, resize = 'vertical', className = '', style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ width: fullWidth ? '100%' : undefined }} className={className}>
        {label && (
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: `1.5px solid ${error ? '#ef4444' : focused ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
            background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            resize, lineHeight: 1.6, transition: 'border-color 0.15s',
            ...style,
          }}
          {...props}
        />
        {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
        {helperText && !error && <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
export default Textarea;
