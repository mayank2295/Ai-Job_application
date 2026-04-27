import { Plus, Trash2, FolderOpen } from 'lucide-react';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import type { Project } from '../types';

interface ProjectsStepProps { data: Project[]; onChange: (d: Project[]) => void; }

export default function ProjectsStep({ data, onChange }: ProjectsStepProps) {
  const add = () => onChange([...data, { name: '', description: '', tech: '', link: '' }]);
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Project, val: string) =>
    onChange(data.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Projects</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Showcase your portfolio and side projects</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', borderRadius: 12, border: '2px dashed var(--border-primary)', background: 'var(--bg-glass)' }}>
            <FolderOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>No projects added yet</p>
            <button onClick={add} className="btn btn-primary" style={{ gap: 6 }}><Plus size={14} /> Add First Project</button>
          </div>
        ) : (
          <>
            {data.map((proj, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Project #{i + 1}</span>
                  <button onClick={() => remove(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input label="Project Name" placeholder="Portfolio Site" value={proj.name} onChange={e => update(i, 'name', e.target.value)} fullWidth />
                  <Textarea label="Description" placeholder="Describe what the project does and your role..." value={proj.description} onChange={e => update(i, 'description', e.target.value)} rows={3} fullWidth />
                  <Input label="Technologies" placeholder="React, Vite, CSS" value={proj.tech} onChange={e => update(i, 'tech', e.target.value)} fullWidth helperText="Comma-separated" />
                  <Input label="Link (Optional)" placeholder="github.com/you/project" value={proj.link || ''} onChange={e => update(i, 'link', e.target.value)} fullWidth helperText="GitHub, live demo, or project URL" />
                </div>
              </div>
            ))}
            <button onClick={add} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: '2px dashed var(--border-primary)', background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={14} /> Add Another Project
            </button>
          </>
        )}
      </div>
    </div>
  );
}
