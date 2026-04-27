import { useState } from 'react';
import { Plus, X, Code } from 'lucide-react';

const SUGGESTIONS = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Git', 'SQL', 'Java', 'Figma'];

interface SkillsStepProps { data: string[]; onChange: (d: string[]) => void; }

export default function SkillsStep({ data, onChange }: SkillsStepProps) {
  const [input, setInput] = useState('');

  const add = (skill?: string) => {
    const s = (skill || input).trim();
    if (s && !data.includes(s)) { onChange([...data, s]); setInput(''); }
  };

  const remove = (s: string) => onChange(data.filter(x => x !== s));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Skills</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add your technical and professional skills</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Input row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="e.g. React, TypeScript, Node.js..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 14,
              border: '1.5px solid var(--border-primary)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-primary)')}
          />
          <button
            onClick={() => add()}
            disabled={!input.trim()}
            className="btn btn-primary"
            style={{ padding: '10px 18px', gap: 6, flexShrink: 0 }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Skills tags */}
        {data.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', borderRadius: 12, border: '2px dashed var(--border-primary)', background: 'var(--bg-glass)', marginBottom: 20 }}>
            <Code size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Type a skill and press Enter or click Add</p>
          </div>
        ) : (
          <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Skills ({data.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.map(skill => (
                <span key={skill} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}>
                  {skill}
                  <button onClick={() => remove(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--accent-primary)', opacity: 0.6, lineHeight: 1 }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Popular Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => add(s)}
                disabled={data.includes(s)}
                style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  border: '1px solid rgba(99,102,241,0.3)', background: data.includes(s) ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                  color: data.includes(s) ? 'var(--text-muted)' : 'var(--accent-primary)',
                  cursor: data.includes(s) ? 'default' : 'pointer', fontFamily: 'inherit',
                  opacity: data.includes(s) ? 0.5 : 1, transition: 'all 0.15s',
                }}
              >
                {data.includes(s) ? '✓ ' : '+ '}{s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
