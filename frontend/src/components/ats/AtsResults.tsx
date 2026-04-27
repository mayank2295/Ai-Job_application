import { Download, RefreshCw, CircleCheck, CircleX, TrendingUp, TriangleAlert } from 'lucide-react';
import type { AtsResultsProps } from './types';

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  if (s >= 40) return '#f97316';
  return '#ef4444';
}
function scoreLabel(s: number) {
  if (s >= 80) return 'Excellent Match';
  if (s >= 60) return 'Good Match';
  if (s >= 40) return 'Fair Match';
  return 'Needs Improvement';
}
function scoreMessage(s: number) {
  if (s >= 80) return 'Your resume is highly compatible with this job.';
  if (s >= 60) return 'Good compatibility. A few tweaks could push you higher.';
  if (s >= 40) return 'Some relevant keywords found, but significant gaps remain.';
  return 'Major revisions needed to match this job description.';
}

export default function AtsResults({ analysis, onTryAgain, onExportReport }: AtsResultsProps) {
  const color = scoreColor(analysis.overallScore ?? 0);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - ((analysis.overallScore ?? 0) / 100) * circumference;

  const scoreBreakdown = analysis.scoreBreakdown ?? [];
  const matchedKeywords = analysis.matchedKeywords ?? [];
  const missingKeywords = analysis.missingKeywords ?? [];
  const recommendations = analysis.recommendations ?? [];

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Top row: score + summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, marginBottom: 16 }}>

        {/* Score card */}
        <div className="card" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={65} cy={65} r={54} fill="none" stroke="var(--bg-tertiary)" strokeWidth={10} />
            <circle cx={65} cy={65} r={54} fill="none" stroke={color} strokeWidth={10}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div style={{ marginTop: -100, marginBottom: 60, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1 }}>{analysis.overallScore}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>ATS Score</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{scoreLabel(analysis.overallScore)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{scoreMessage(analysis.overallScore)}</div>
        </div>

        {/* Summary + score breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary */}
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Summary</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{analysis.summary}</p>
          </div>

          {/* Score breakdown bars */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scoreBreakdown.map(item => (
                <div key={item.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(item.score) }}>{item.score}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, background: scoreColor(item.score),
                      width: `${item.score}%`, transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keywords row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Matched */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CircleCheck size={15} color="#10b981" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Matched Keywords <span style={{ color: '#10b981', fontWeight: 800 }}>({matchedKeywords.length})</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matchedKeywords.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No matches found</span>
            ) : matchedKeywords.map(k => (
              <span key={k.keyword} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>{k.keyword}</span>
            ))}
          </div>
        </div>

        {/* Missing */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CircleX size={15} color="#ef4444" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Missing Keywords <span style={{ color: '#ef4444', fontWeight: 800 }}>({missingKeywords.length})</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {missingKeywords.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None missing</span>
            ) : missingKeywords.map(k => (
              <span key={k.keyword} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>{k.keyword}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TriangleAlert size={15} color="var(--accent-amber)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recommendations</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((r, i) => {
              const impactColor = r.impact === 'high' ? '#ef4444' : r.impact === 'medium' ? '#f59e0b' : '#6366f1';
              return (
                <div key={r.id} style={{
                  display: 'flex', gap: 12, padding: '12px 14px',
                  background: 'var(--bg-glass)', borderRadius: 8,
                  border: '1px solid var(--border-primary)',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${impactColor}15`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 800, color: impactColor, marginTop: 1,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                        background: `${impactColor}15`, color: impactColor, textTransform: 'uppercase',
                      }}>{r.impact}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{r.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onTryAgain} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14, gap: 8 }}>
          <RefreshCw size={15} /> Analyze Another
        </button>
        <button onClick={onExportReport} className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: 14, gap: 8 }}>
          <Download size={15} /> Export Report
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>
        Analyzed {new Date(analysis.analyzedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
