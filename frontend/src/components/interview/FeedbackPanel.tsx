import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Lightbulb } from 'lucide-react';
import type { FeedbackPanelProps } from './types';

export default function FeedbackPanel({ feedback, isVisible, onClose }: FeedbackPanelProps) {
  const [expanded, setExpanded] = useState(true);
  if (!isVisible || !feedback) return null;

  return (
    <div style={{
      padding: 16, borderRadius: 10,
      background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={15} color="#06b6d4" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0e7490' }}>Instant Feedback</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: '#06b6d4', display: 'flex' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: '#06b6d4', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <>
          <p style={{ fontSize: 13, color: '#0e7490', lineHeight: 1.6, margin: '0 0 8px' }}>{feedback}</p>
          <p style={{ fontSize: 11, color: '#0891b2', margin: 0, paddingTop: 8, borderTop: '1px solid rgba(6,182,212,0.2)' }}>
            Tip: Use this feedback to improve your next answer
          </p>
        </>
      )}
    </div>
  );
}
