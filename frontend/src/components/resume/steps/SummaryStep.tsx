import { FileText } from 'lucide-react';
import Textarea from '../../ui/Textarea';

interface SummaryStepProps { value: string; onChange: (v: string) => void; }

export default function SummaryStep({ value, onChange }: SummaryStepProps) {
  const len = value.length;
  const good = len >= 100 && len <= 300;
  const pct = Math.min((len / 300) * 100, 100);
  const barColor = good ? '#10b981' : len > 300 ? '#f59e0b' : '#6366f1';

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Professional Summary</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>A brief overview of your background and key strengths</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Textarea
          label="Summary"
          placeholder="Experienced professional with a passion for building great products. Skilled in problem-solving and cross-functional collaboration..."
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={7}
          fullWidth
          helperText={`${len} characters - Recommended: 100-300`}
        />

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width 0.3s, background 0.3s' }} />
          </div>
          <FileText size={16} color={good ? '#10b981' : 'var(--text-muted)'} />
        </div>

        {/* Tips */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Tips for a great summary</div>
          {[
            'Highlight your most relevant skills and experience',
            'Keep it concise and impactful (2-3 sentences)',
            'Use action words and quantifiable achievements',
            'Focus on what makes you unique',
          ].map(tip => (
            <div key={tip} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>-</span> {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
