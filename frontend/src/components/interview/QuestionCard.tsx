import { Bot } from 'lucide-react';
import { memo } from 'react';
import type { QuestionCardProps } from './types';

export default memo(function QuestionCard({ question, isLatest = false }: QuestionCardProps) {
  const time = new Date(question.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={18} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interviewer</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{time}</span>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${isLatest ? 'rgba(99,102,241,0.3)' : 'var(--border-primary)'}`,
          borderRadius: '0 12px 12px 12px', padding: '14px 16px',
          fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65,
          boxShadow: isLatest ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
        }}>
          {question.text}
        </div>
        {isLatest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--accent-primary)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
            Awaiting your response...
          </div>
        )}
      </div>
    </div>
  );
});
