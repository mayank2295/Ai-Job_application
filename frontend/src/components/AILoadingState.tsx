import { Sparkles } from 'lucide-react';

interface AILoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AILoadingState({
  message = 'AI is thinking...',
  submessage,
  size = 'md',
}: AILoadingStateProps) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 40 : 28;
  const containerSize = size === 'sm' ? 48 : size === 'lg' ? 88 : 64;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: size === 'sm' ? 16 : 40,
      textAlign: 'center',
    }}>
      {/* Animated icon */}
      <div style={{
        width: containerSize, height: containerSize, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
        border: '2px solid rgba(99,102,241,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: size === 'sm' ? 12 : 20,
        animation: 'pulse 2s infinite',
        position: 'relative',
      }}>
        <Sparkles size={iconSize} color="var(--accent-primary)" />
        {/* Orbiting dot */}
        <div style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent-primary)', top: -2, right: -2,
          animation: 'spin 2s linear infinite',
        }} />
      </div>

      <div style={{
        fontSize: size === 'sm' ? 13 : size === 'lg' ? 18 : 15,
        fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {message}
      </div>

      {submessage && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
          {submessage}
        </div>
      )}

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent-primary)',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            opacity: 0.7,
          }} />
        ))}
      </div>
    </div>
  );
}

// Inline version for use inside cards/buttons
export function AILoadingInline({ message = 'Processing...' }: { message?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
      <Sparkles size={14} color="var(--accent-primary)" style={{ animation: 'pulse 1.5s infinite' }} />
      {message}
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 4, height: 4, borderRadius: '50%',
            background: 'var(--accent-primary)',
            display: 'inline-block',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </span>
    </span>
  );
}

// Full page overlay for long AI operations
export function AILoadingOverlay({ message = 'AI is working...', visible }: { message?: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: '32px 40px',
        border: '1px solid var(--border-primary)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        textAlign: 'center', maxWidth: 320,
      }}>
        <AILoadingState message={message} size="lg" />
      </div>
    </div>
  );
}
