import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Search, Filter, ChevronRight, Banknote, Building2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const JOB_TYPES = ['all', 'Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'];

const TYPE_COLORS: Record<string, string> = {
  'Full-Time': '#6366f1',
  'Part-Time': '#f59e0b',
  'Remote': '#10b981',
  'Internship': '#06b6d4',
  'Contract': '#f43f5e',
};

export default function JobBoardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => { loadJobs(); }, [activeType]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('type', activeType);
      const res = await fetch(`${API_BASE}/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Job Board</h1>
          <p>{jobs.length} open position{jobs.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location, or department…"
            style={{ width: '100%', paddingLeft: 38, paddingRight: 16, height: 42, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {JOB_TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                background: activeType === t ? 'var(--accent-primary)' : 'var(--bg-card)',
                borderColor: activeType === t ? 'var(--accent-primary)' : 'var(--border-primary)',
                color: activeType === t ? 'white' : 'var(--text-secondary)',
              }}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /><span className="loading-text">Loading jobs…</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase /></div>
          <div className="empty-state-title">No jobs found</div>
          <div className="empty-state-desc">Try adjusting your search or filters</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(job => (
            <div key={job.id} className="card"
              onClick={() => navigate(`/jobs/${job.id}`)}
              style={{ cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')}>

              {/* Company logo placeholder */}
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${TYPE_COLORS[job.type] || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={22} color={TYPE_COLORS[job.type] || '#6366f1'} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{job.title}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${TYPE_COLORS[job.type]}20`, color: TYPE_COLORS[job.type] || '#6366f1' }}>{job.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}><Building2 size={13} />{job.company}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}><MapPin size={13} />{job.location}</span>
                  {job.department && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}><Filter size={13} />{job.department}</span>}
                  {job.salary_range && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent-emerald)' }}><Banknote size={13} />{job.salary_range}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{job.applicant_count || 0} applicants</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(job.created_at).toLocaleDateString()}</div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
