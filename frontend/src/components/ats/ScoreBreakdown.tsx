import { memo } from 'react';
import type { ScoreBreakdownProps } from './types';

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}

export default memo(function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const total    = scores.reduce((a, s) => a + s.score, 0);
  const maxTotal = scores.reduce((a, s) => a + s.maxScore, 0);

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 18px' }}>Score Breakdown</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {scores.map((item, i) => {
          const pct = (item.score / item.maxScore) * 100;
          const color = scoreColor(item.score);
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.category}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{item.score}/{item.maxScore}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{item.description}</p>
              {i < scores.length - 1 && <div style={{ height: 1, background: 'var(--border-primary)', marginTop: 12 }} />}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '2px solid var(--border-primary)' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Total Score</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>{total}/{maxTotal}</span>
      </div>
    </div>
  );
});
