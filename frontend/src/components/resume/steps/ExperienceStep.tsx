import { Plus, Trash2, Briefcase } from 'lucide-react';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import type { Experience } from '../types';

interface ExperienceStepProps { data: Experience[]; onChange: (d: Experience[]) => void; }

export default function ExperienceStep({ data, onChange }: ExperienceStepProps) {
  const add = () => onChange([...data, { company: '', role: '', duration: '', description: '' }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Experience, val: string) =>
    onChange(data.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Work Experience</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add your professional work history</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.length === 0 ? (
          <div style={{
            padding: 32, textAlign: 'center', borderRadius: 12,
            border: '2px dashed var(--border-primary)', background: 'var(--bg-glass)',
          }}>
            <Briefcase size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>No work experience added yet</p>
            <button onClick={add} className="btn btn-primary" style={{ gap: 6 }}><Plus size={14} /> Add First Experience</button>
          </div>
        ) : (
          <>
            {data.map((exp, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Experience #{i + 1}</span>
                  <button onClick={() => remove(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px',
                    borderRadius: 6, transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Company" placeholder="Acme Corp" value={exp.company} onChange={e => update(i, 'company', e.target.value)} fullWidth />
                    <Input label="Role" placeholder="Software Engineer" value={exp.role} onChange={e => update(i, 'role', e.target.value)} fullWidth />
                  </div>
                  <Input label="Duration" placeholder="Jan 2022 - Present" value={exp.duration} onChange={e => update(i, 'duration', e.target.value)} fullWidth />
                  <Textarea label="Description" placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={e => update(i, 'description', e.target.value)} rows={3} fullWidth />
                </div>
              </div>
            ))}
            <button onClick={add} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px', borderRadius: 10, border: '2px dashed var(--border-primary)',
              background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={14} /> Add Another Experience
            </button>
          </>
        )}
      </div>
    </div>
  );
}
