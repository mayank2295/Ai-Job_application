import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Search, Filter, ChevronRight, Banknote, Building2, Bookmark, BookmarkCheck } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const JOB_TYPES = ['all', 'Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'];

const TYPE_COLORS: Record<string, string> = {
  'Full-Time': '#6366f1',
  'Part-Time': '#f59e0b',
  'Remote': '#10b981',
  'Internship': '#06b6d4',
  'Contract': '#f43f5e',
};

const SAVED_KEY = 'jobflow_saved_jobs';

function getSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}
function toggleSaved(id: string): string[] {
  const saved = getSaved();
  const next = saved.includes(id) ? saved.filter(s => s !== id) : [...saved, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

export default function JobBoardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [saved, setSaved] = useState<string[]>(getSaved);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

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

  const handleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSaved(toggleSaved(id));
  };

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department?.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchSaved = !showSavedOnly || saved.includes(j.id);
    return matchSearch && matchSaved;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Job Board</h1>
          <p>{jobs.length} open position{jobs.length !== 1 ? 's' : ''} available</p>
        </div>
        <button
          className={`btn ${showSavedOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowSavedOnly(v => !v)}
        >
          <BookmarkCheck size={15} />
          {showSavedOnly ? 'All Jobs' : `Saved (${saved.length})`}
        </button>
      </div>

      {/* Search + Filter */}
      <div className="job-board-toolbar">
        <div className="job-board-search-wrap">
          <Search size={16} className="job-board-search-icon" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location, or department…"
            className="job-board-search"
          />
        </div>
        <div className="job-board-filter-wrap">
          {JOB_TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`job-board-filter-btn ${activeType === t ? 'active' : ''}`}>
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
          <div className="empty-state-title">{showSavedOnly ? 'No saved jobs' : 'No jobs found'}</div>
          <div className="empty-state-desc">{showSavedOnly ? 'Bookmark jobs to save them here' : 'Try adjusting your search or filters'}</div>
        </div>
      ) : (
        <div className="job-board-grid">
          {filtered.map(job => {
            const isSaved = saved.includes(job.id);
            const desc = job.description ? job.description.replace(/\n/g, ' ').slice(0, 120) + (job.description.length > 120 ? '…' : '') : '';
            return (
              <div key={job.id} className="card job-board-card"
                onClick={() => navigate(`/jobs/${job.id}`)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div className="job-board-card-icon" style={{ background: `${TYPE_COLORS[job.type] || '#6366f1'}20`, flexShrink: 0 }}>
                      <Building2 size={20} color={TYPE_COLORS[job.type] || '#6366f1'} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{job.company}</div>
                      <h3 className="job-board-card-title" style={{ margin: 0 }}>{job.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleSave(e, job.id)}
                    title={isSaved ? 'Remove bookmark' : 'Save job'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
                      color: isSaved ? '#7C3AED' : 'var(--text-muted)', transition: 'color 0.15s',
                    }}
                  >
                    {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>

                {/* Description preview */}
                {desc && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, width: '100%',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {desc}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: '100%', alignItems: 'center' }}>
                  <span className="job-board-meta-item"><MapPin size={13} />{job.location}</span>
                  {job.department && <span className="job-board-meta-item"><Filter size={13} />{job.department}</span>}
                  {job.salary_range && <span className="job-board-meta-item job-board-salary"><Banknote size={13} />{job.salary_range}</span>}
                  <span className="job-board-job-type" style={{ background: `${TYPE_COLORS[job.type] || '#6366f1'}18`, color: TYPE_COLORS[job.type] || '#6366f1', marginLeft: 'auto' }}>
                    {job.type}
                  </span>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 8, borderTop: '1px solid var(--border-primary)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {job.applicant_count || 0} applicants · {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                    Apply Now <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
