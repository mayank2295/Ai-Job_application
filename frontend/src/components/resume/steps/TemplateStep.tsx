import { Check } from 'lucide-react';
import type { Template } from '../types';

const TEMPLATES = [
  { id: 'modern'   as Template, name: 'Modern',   description: 'Clean two-column layout with purple accents', color: '#6366f1', emoji: '🎨' },
  { id: 'classic'  as Template, name: 'Classic',  description: 'Traditional single-column serif design',      color: '#1e293b', emoji: '📄' },
  { id: 'minimal'  as Template, name: 'Minimal',  description: 'Ultra-clean with thin lines and subtle colors', color: '#64748b', emoji: '✨' },
  { id: 'creative' as Template, name: 'Creative', description: 'Colorful gradient sidebar with bold typography', color: '#0ea5e9', emoji: '🚀' },
];

interface TemplateStepProps { selected: Template; onSelect: (t: Template) => void; }

export default function TemplateStep({ selected, onSelect }: TemplateStepProps) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Choose Your Template</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Select a design that best represents your professional style</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {TEMPLATES.map(t => (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              border: `2px solid ${selected === t.id ? t.color : 'var(--border-primary)'}`,
              background: 'var(--bg-card)', transition: 'all 0.2s',
              boxShadow: selected === t.id ? `0 0 0 3px ${t.color}20` : 'none',
            }}
          >
            {/* Color preview */}
            <div style={{
              height: 100, background: `linear-gradient(135deg, ${t.color}ee, ${t.color}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}>
              <span style={{ fontSize: 36 }}>{t.emoji}</span>
              {selected === t.id && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 24, height: 24, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color={t.color} />
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
