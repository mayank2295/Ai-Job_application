import { TriangleAlert, CircleCheck, Lightbulb, TrendingUp, CircleAlert, CircleX } from 'lucide-react';
import { memo } from 'react';
import type { RecommendationsPanelProps } from './types';

const TYPE_CONFIG = {
  critical:  { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.2)',  Icon: CircleAlert  },
  important: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', Icon: TriangleAlert },
  suggested: { color: '#6366f1', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)', Icon: Lightbulb    },
};

const IMPACT_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6366f1' };

export default memo(function RecommendationsPanel({ recommendations, matchedKeywords, missingKeywords }: RecommendationsPanelProps) {
  const highMissing = missingKeywords.filter(k => k.importance === 'high');
  const medMissing  = missingKeywords.filter(k => k.importance === 'medium');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Matched keywords */}
      {matchedKeywords.length > 0 && (
        <div className="card" style={{ padding: 20, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CircleCheck size={16} color="#10b981" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>Matched Keywords ({matchedKeywords.length})</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Your resume includes these keywords from the job description:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matchedKeywords.map((k, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                {k.keyword}{k.count > 1 && <span style={{ opacity: 0.7, marginLeft: 3 }}>x{k.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing keywords */}
      {missingKeywords.length > 0 && (
        <div className="card" style={{ padding: 20, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CircleX size={16} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>Missing Keywords ({missingKeywords.length})</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Consider adding these to improve your ATS score:</p>
          {highMissing.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>High Priority</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {highMissing.map((k, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '2px solid rgba(239,68,68,0.25)' }}>{k.keyword}</span>
                ))}
              </div>
            </div>
          )}
          {medMissing.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Medium Priority</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {medMissing.map((k, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>{k.keyword}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recommendations ({recommendations.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map(rec => {
              const cfg = TYPE_CONFIG[rec.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.suggested;
              const { Icon } = cfg;
              const impactColor = IMPACT_COLOR[rec.impact as keyof typeof IMPACT_COLOR] || '#6366f1';
              return (
                <div key={rec.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rec.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${impactColor}15`, color: impactColor, textTransform: 'uppercase' }}>{rec.impact}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ padding: 18, background: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Lightbulb size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Pro Tips</span>
        </div>
        {[
          'Use exact keywords from the job description in your resume',
          'Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")',
          'Quantify achievements with numbers and metrics when possible',
          'Keep formatting simple and ATS-friendly (avoid tables, images, headers/footers)',
        ].map(tip => (
          <div key={tip} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>-</span> {tip}
          </div>
        ))}
      </div>
    </div>
  );
});
