import { Download, RefreshCw, TrendingUp, TriangleAlert, Lightbulb, CircleCheck } from 'lucide-react';
import type { InterviewResultsProps } from './types';

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}
function scoreLabel(s: number) {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Needs Work';
}

export default function InterviewResults({ result, onStartNew, onDownloadReport }: InterviewResultsProps) {
  const color = scoreColor(result.overallScore);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (result.overallScore / 100) * circumference;

  return (
    <div className="page-container" style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* Score hero */}
      <div className="card" style={{ padding: 32, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={70} cy={70} r={54} fill="none" stroke="var(--bg-tertiary)" strokeWidth={10} />
            <circle cx={70} cy={70} r={54} fill="none" stroke={color} strokeWidth={10}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div style={{ marginTop: -108, marginBottom: 68, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1 }}>{result.overallScore}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>out of 100</div>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 6 }}>{scoreLabel(result.overallScore)}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Interview Performance</div>
      </div>

      {/* Feedback */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Detailed Feedback</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
          {result.detailedFeedback}
        </p>
      </div>

      {/* Strengths + Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 20, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CircleCheck size={15} color="#10b981" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>Strengths</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <CircleCheck size={11} color="#10b981" />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TriangleAlert size={15} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>Improve On</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.improvements.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,158,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <TriangleAlert size={11} color="#f59e0b" />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CV Enhancements */}
      {result.cvEnhancements.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16, background: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Lightbulb size={15} color="var(--accent-primary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>CV Enhancement Tips</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.cvEnhancements.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  fontSize: 10, fontWeight: 800, color: 'var(--accent-primary)',
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
        <button onClick={onStartNew} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14, gap: 8 }}>
          <RefreshCw size={15} /> New Interview
        </button>
        <button onClick={onDownloadReport} className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: 14, gap: 8 }}>
          <Download size={15} /> Download Report
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
        Completed {new Date(result.completedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
