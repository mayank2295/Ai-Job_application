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
          <p>{jobs.length} open position{jobs.length !== 1 ? 's' : ''} available for you</p>
        </div>
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
            aria-label="Search jobs"
          />
        </div>

        <div className="job-board-filter-wrap">
          {JOB_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`job-board-filter-btn ${activeType === t ? 'active' : ''}`}
            >
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
        <div className="job-board-grid">
          {filtered.map(job => (
            <div key={job.id} className="card job-board-card"
              onClick={() => navigate(`/jobs/${job.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}>

              {/* Company logo placeholder */}
              <div className="job-board-card-icon" style={{ background: `${TYPE_COLORS[job.type] || '#6366f1'}20` }}>
                <Building2 size={22} color={TYPE_COLORS[job.type] || '#6366f1'} />
              </div>

              <div className="job-board-card-main">
                <div className="job-board-card-top">
                  <h3 className="job-board-card-title">{job.title}</h3>
                  <span className="job-board-job-type" style={{ background: `${TYPE_COLORS[job.type]}20`, color: TYPE_COLORS[job.type] || '#6366f1' }}>
                    {job.type}
                  </span>
                </div>

                <div className="job-board-meta-list">
                  <span className="job-board-meta-item"><Building2 size={13} />{job.company}</span>
                  <span className="job-board-meta-item"><MapPin size={13} />{job.location}</span>
                  {job.department && <span className="job-board-meta-item"><Filter size={13} />{job.department}</span>}
                  {job.salary_range && <span className="job-board-meta-item job-board-salary"><Banknote size={13} />{job.salary_range}</span>}
                </div>
              </div>

              <div className="job-board-card-side">
                <div className="job-board-card-side-meta">
                  <div>{job.applicant_count || 0} applicants</div>
                  <div>{new Date(job.created_at).toLocaleDateString()}</div>
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
