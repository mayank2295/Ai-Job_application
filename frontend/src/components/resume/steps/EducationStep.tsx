import { Plus, Trash2, GraduationCap } from 'lucide-react';
import Input from '../../ui/Input';
import type { Education } from '../types';

interface EducationStepProps { data: Education[]; onChange: (d: Education[]) => void; }

export default function EducationStep({ data, onChange }: EducationStepProps) {
  const add = () => onChange([...data, { institution: '', degree: '', year: '', gpa: '' }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Education, val: string) =>
    onChange(data.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Education</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add your educational qualifications</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', borderRadius: 12, border: '2px dashed var(--border-primary)', background: 'var(--bg-glass)' }}>
            <GraduationCap size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>No education added yet</p>
            <button onClick={add} className="btn btn-primary" style={{ gap: 6 }}><Plus size={14} /> Add Education</button>
          </div>
        ) : (
          <>
            {data.map((edu, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Education #{i + 1}</span>
                  <button onClick={() => remove(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input label="Institution" placeholder="State University" value={edu.institution} onChange={e => update(i, 'institution', e.target.value)} fullWidth />
                  <Input label="Degree" placeholder="B.Tech Computer Science" value={edu.degree} onChange={e => update(i, 'degree', e.target.value)} fullWidth />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Year" placeholder="2021" value={edu.year} onChange={e => update(i, 'year', e.target.value)} fullWidth />
                    <Input label="GPA (Optional)" placeholder="3.8" value={edu.gpa || ''} onChange={e => update(i, 'gpa', e.target.value)} fullWidth />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={add} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '2px dashed var(--border-primary)', background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={14} /> Add Another Education
            </button>
          </>
        )}
      </div>
    </div>
  );
}
