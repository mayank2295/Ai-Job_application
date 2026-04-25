import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending:     { color: '#f59e0b', label: 'Pending' },
  reviewing:   { color: '#06b6d4', label: 'Under Review' },
  shortlisted: { color: '#8b5cf6', label: 'Shortlisted' },
  interviewed: { color: '#6366f1', label: 'Interviewed' },
  accepted:    { color: '#10b981', label: 'Accepted ✓' },
  rejected:    { color: '#f43f5e', label: 'Not Selected' },
};

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardView, setBoardView] = useState(false);
  const statuses = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];
  const grouped = statuses.reduce((acc: any, s) => ({ ...acc, [s]: apps.filter((a) => a.status === s) }), {});

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/applications?email=${encodeURIComponent(user.email)}&limit=50`)
      .then(r => r.json())
      .then(d => { setApps(d.applications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Applications</h1>
          <p>{apps.length} application{apps.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
        <button className="btn btn-secondary" onClick={() => setBoardView((v) => !v)}>{boardView ? 'List View' : 'Board View'}</button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : apps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText /></div>
          <div className="empty-state-title">No applications yet</div>
          <div className="empty-state-desc">Browse open positions and apply to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}>View Jobs</button>
        </div>
      ) : boardView ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {statuses.map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div className="card" key={status} style={{ borderColor: cfg.color }}>
                <h4 style={{ color: cfg.color }}>{cfg.label}</h4>
                {(grouped[status] || []).map((app: any) => (
                  <div key={app.id} className="card" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{app.position}</div>
                    <div style={{ fontSize: 12 }}>{new Date(app.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            return (
              <div key={app.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{app.position}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Applied {new Date(app.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  {app.ai_score && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      AI Match Score: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{Math.round(app.ai_score)}%</span>
                    </div>
                  )}
                </div>
                <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${cfg.color}20`, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
