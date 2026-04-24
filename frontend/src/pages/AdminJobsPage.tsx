import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'];

const defaultForm = { title: '', location: '', type: 'Full-Time', department: '', salary_range: '', description: '', requirements: '' };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/all`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch(e) {} finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (job: any) => {
    setEditing(job);
    const reqs = (() => { try { return JSON.parse(job.requirements || '[]').join('\n'); } catch { return job.requirements || ''; } })();
    setForm({ title: job.title, location: job.location, type: job.type, department: job.department || '', salary_range: job.salary_range || '', description: job.description, requirements: reqs });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.location || !form.description) return;
    setSaving(true);
    try {
      const body = { ...form, requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean) };
      const url = editing ? `${API_BASE}/jobs/${editing.id}` : `${API_BASE}/jobs`;
      const method = editing ? 'PATCH' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setShowForm(false);
      loadJobs();
    } catch(e) {} finally { setSaving(false); }
  };

  const toggleActive = async (job: any) => {
    await fetch(`${API_BASE}/jobs/${job.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !job.is_active }) });
    loadJobs();
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
    loadJobs();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Manage Jobs</h1>
          <p>{jobs.length} job postings total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Post New Job</button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</span>
                  <span className={`badge badge-${job.is_active ? 'accepted' : 'rejected'}`} style={{ fontSize: 11 }}>{job.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>{job.location}</span>
                  <span>{job.type}</span>
                  {job.department && <span>{job.department}</span>}
                  {job.salary_range && <span style={{ color: 'var(--accent-emerald)' }}>{job.salary_range}</span>}
                  <span style={{ color: 'var(--accent-primary)' }}>{job.applicant_count || 0} applicants</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggleActive(job)} title={job.is_active ? 'Deactivate' : 'Activate'}
                  style={{ width: 34, height: 34, border: '1px solid var(--border-primary)', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: job.is_active ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {job.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => openEdit(job)} title="Edit"
                  style={{ width: 34, height: 34, border: '1px solid var(--border-primary)', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteJob(job.id)} title="Delete"
                  style={{ width: 34, height: 34, border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{editing ? 'Edit Job' : 'Post New Job'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['Job Title *', 'title', 'e.g. Senior Developer', 'text'],
                ['Location *', 'location', 'e.g. Bangalore, India', 'text'],
                ['Department', 'department', 'e.g. Engineering', 'text'],
                ['Salary Range', 'salary_range', 'e.g. ₹20L – ₹30L', 'text'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder as string}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe the role and responsibilities…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requirements (one per line)</label>
              <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={4} placeholder="5+ years of experience in React&#10;Strong TypeScript skills&#10;…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.location || !form.description} className="btn btn-primary">
                {saving ? 'Saving…' : editing ? 'Update Job' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
