import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Banknote, Building2, CheckCircle2, ArrowLeft, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractPdfText } from '../lib/careerbot-api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const TYPE_COLORS: Record<string, string> = {
  'Full-Time': '#6366f1', 'Part-Time': '#f59e0b', 'Remote': '#10b981', 'Internship': '#06b6d4', 'Contract': '#f43f5e',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    fetch(`${API_BASE}/jobs/${id}`)
      .then(r => r.json())
      .then(d => { setJob(d.job); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!resumeFile || !user) return;
    setSubmitting(true);
    try {
      // Extract text from PDF for AI analysis
      let resumeText = '';
      try { resumeText = await extractPdfText(resumeFile); } catch(e) {}

      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('job_id', id!);
      formData.append('user_id', user.firebaseUser.uid);
      formData.append('full_name', user.name || user.email);
      formData.append('email', user.email);
      formData.append('phone', phone);
      formData.append('position', job.title);
      formData.append('cover_letter', coverLetter);
      formData.append('resume_text', resumeText);
      formData.append('job_description', job.description + '\n' + (job.requirements || ''));

      const res = await fetch(`${API_BASE}/applications`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch(e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-container"><div className="loading-spinner" /></div></div>;
  if (!job) return <div className="page-container"><div className="empty-state"><div className="empty-state-title">Job not found</div></div></div>;

  const reqs: string[] = (() => { try { return JSON.parse(job.requirements || '[]'); } catch { return []; } })();

  return (
    <div className="page-container">
      <button onClick={() => navigate('/jobs')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={16} /> Back to Jobs
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', background: `${TYPE_COLORS[job.type] || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={26} color={TYPE_COLORS[job.type] || '#6366f1'} />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>{job.title}</h1>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-muted)' }}><Building2 size={14} />{job.company}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-muted)' }}><MapPin size={14} />{job.location}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${TYPE_COLORS[job.type]}20`, color: TYPE_COLORS[job.type] }}>{job.type}</span>
                  {job.salary_range && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--accent-emerald)' }}><Banknote size={14} />{job.salary_range}</span>}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>About This Role</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.description}</p>
          </div>

          {reqs.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Requirements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reqs.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar apply card */}
        <div className="card" style={{ position: 'sticky', top: 20 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Application Submitted!</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>We'll review your application and get back to you soon.</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/my-applications')}>View My Applications</button>
            </div>
          ) : !showApply ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Apply for This Role</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Department</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{job.department || 'General'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Type</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{job.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Applicants</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{job.applicant_count || 0}</span>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowApply(true)}>
                Apply Now
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Your Application</h3>
                <button onClick={() => setShowApply(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applying As</label>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name || user?.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resume (PDF) *</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '2px dashed var(--border-primary)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
                    <Upload size={16} />
                    {resumeFile ? resumeFile.name : 'Upload your resume'}
                    <input type="file" accept=".pdf" hidden onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Letter (optional)</label>
                  <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4} placeholder="Tell us why you're a great fit…"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  disabled={!resumeFile || submitting} onClick={handleApply}>
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
