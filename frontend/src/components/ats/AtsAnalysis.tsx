import { Sparkles } from 'lucide-react';
import type { AtsAnalysisProps } from './types';

const STAGES = [
  'Extracting resume content...',
  'Parsing job description...',
  'Matching keywords...',
  'Analyzing compatibility...',
  'Generating recommendations...',
];

export default function AtsAnalysis({ progress, message }: AtsAnalysisProps) {
  const stageIndex = Math.min(Math.floor((progress / 100) * STAGES.length), STAGES.length - 1);
  const displayMessage = message || STAGES[stageIndex];

  return (
    <div className="page-container" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>

        {/* Animated icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
          border: '2px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'pulse 2s infinite',
        }}>
          <Sparkles size={28} color="var(--accent-primary)" />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Analyzing your resume
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          {displayMessage}
        </p>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>{progress}%</div>

        {/* Stage dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {STAGES.map((_, i) => (
            <div key={i} style={{
              width: i <= stageIndex ? 20 : 8, height: 8, borderRadius: 999,
              background: i <= stageIndex ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              transition: 'all 0.4s ease',
            }} />
          ))}
        </div>

        {/* Fun fact */}
        <div style={{
          marginTop: 28, padding: '12px 16px',
          background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
          borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          {progress < 40
            ? '75% of resumes are rejected by ATS before reaching a human recruiter'
            : progress < 70
            ? 'Using keywords from the job description can increase your ATS score by up to 40%'
            : 'The average recruiter spends only 6-7 seconds reviewing a resume'}
        </div>
      </div>
    </div>
  );
}
