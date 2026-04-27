import { useState, memo } from 'react';
import { ArrowLeftRight, FileText, Sparkles } from 'lucide-react';
import type { ComparisonViewProps } from './types';

type ViewMode = 'split' | 'original' | 'improved';

export default memo(function ComparisonView({ originalText, improvedText, changes }: ComparisonViewProps) {
  const [mode, setMode] = useState<ViewMode>('split');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeftRight size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Resume Comparison</span>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['split', 'original', 'improved'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textTransform: 'capitalize',
              background: mode === m ? 'var(--bg-card)' : 'transparent',
              color: mode === m ? 'var(--accent-primary)' : 'var(--text-muted)',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>{m}</button>
          ))}
        </div>
      </div>

      {/* Changes list */}
      {changes.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border-primary)', borderRadius: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>{changes.length} improvement{changes.length !== 1 ? 's' : ''} suggested:</p>
          {changes.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span style={{ color: '#10b981', flexShrink: 0 }}>+</span> {c}
            </div>
          ))}
        </div>
      )}

      {/* Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: mode === 'split' ? '1fr 1fr' : '1fr', gap: 14 }}>
        {(mode === 'split' || mode === 'original') && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-primary)' }}>
              <FileText size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Original Resume</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>Before</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace' }}>
              {originalText || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No original text provided</span>}
            </div>
          </div>
        )}
        {(mode === 'split' || mode === 'improved') && (
          <div className="card" style={{ padding: 16, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
              <Sparkles size={14} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>Improved Resume</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>After</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace' }}>
              {improvedText || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No improved text available</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
