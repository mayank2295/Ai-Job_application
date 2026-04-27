import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  pending:     { color: '#f59e0b', label: 'Pending',       icon: '⏳' },
  reviewing:   { color: '#06b6d4', label: 'Under Review',  icon: '👀' },
  shortlisted: { color: '#8b5cf6', label: 'Shortlisted',   icon: '⭐' },
  interviewed: { color: '#6366f1', label: 'Interviewed',   icon: '🎤' },
  accepted:    { color: '#10b981', label: 'Accepted',      icon: '✅' },
  rejected:    { color: '#f43f5e', label: 'Not Selected',  icon: '❌' },
};

// Build a status timeline from the current status
// Since we don't store history, we infer the journey up to current status
const STATUS_ORDER = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted'];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'rejected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600 }}>
          Not selected for this role
        </span>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx === -1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12, overflowX: 'auto' }}>
      {STATUS_ORDER.map((status, i) => {
        const cfg = STATUS_CONFIG[status];
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={status} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: active ? 28 : 22, height: active ? 28 : 22,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? cfg.color : 'var(--bg-tertiary)',
                border: `2px solid ${done ? cfg.color : 'var(--border-primary)'}`,
                fontSize: active ? 13 : 10,
                transition: 'all 0.2s',
                boxShadow: active ? `0 0 0 3px ${cfg.color}30` : 'none',
              }}>
                {done ? <span style={{ fontSize: active ? 12 : 9 }}>{cfg.icon}</span> : null}
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: done ? cfg.color : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {cfg.label}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div style={{
                width: 32, height: 2, margin: '0 2px', marginBottom: 16,
                background: i < currentIdx ? cfg.color : 'var(--border-primary)',
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardView, setBoardView] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const statuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
  const grouped = statuses.reduce((acc: any, s) => ({ ...acc, [s]: apps.filter((a) => a.status === s) }), {});

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/applications?email=${encodeURIComponent(user.email)}&limit=50`)
      .then(r => r.json())
      .then(d => { setApps(d.applications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {statuses.map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div className="card" key={status} style={{ borderTop: `3px solid ${cfg.color}`, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span>{cfg.icon}</span>
                  <h4 style={{ color: cfg.color, margin: 0, fontSize: 12, fontWeight: 700 }}>{cfg.label}</h4>
                  <span style={{ marginLeft: 'auto', fontSize: 11, background: `${cfg.color}20`, color: cfg.color, borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>
                    {(grouped[status] || []).length}
                  </span>
                </div>
                {(grouped[status] || []).map((app: any) => (
                  <div key={app.id} className="card" style={{ marginBottom: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => navigate(`/jobs/${app.job_id}`)}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{app.position}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(app.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {(grouped[status] || []).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>None</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="card" style={{ padding: '18px 22px' }}>
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{app.position}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Applied {new Date(app.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    {app.ai_score && (
                      <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>
                        <TrendingUp size={12} /> AI Match: {Math.round(app.ai_score)}%
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${cfg.color}20`, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <button
                      onClick={() => toggleExpand(app.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
                      title={isExpanded ? 'Hide timeline' : 'Show progress'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expandable status timeline */}
                {isExpanded && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Application Progress</div>
                    <StatusTimeline currentStatus={app.status} />
                    {app.ai_analysis && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>AI Analysis</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{app.ai_analysis}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
