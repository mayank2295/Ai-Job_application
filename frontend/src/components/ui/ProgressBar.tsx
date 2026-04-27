interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const HEIGHT = { sm: 4, md: 8, lg: 14 };
const GRADIENT = {
  primary: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
  success: 'linear-gradient(90deg, #10b981, #34d399)',
  warning: 'linear-gradient(90deg, #f59e0b, #f97316)',
  danger:  'linear-gradient(90deg, #ef4444, #f43f5e)',
};

export default function ProgressBar({ current, total, showLabel = true, size = 'md', color = 'primary' }: ProgressBarProps) {
  const pct = Math.min(Math.round((current / total) * 100), 100);
  const h = HEIGHT[size];
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Step {current} of {total}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>{pct}%</span>
        </div>
      )}
      <div style={{ width: '100%', height: h, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: GRADIENT[color], borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
