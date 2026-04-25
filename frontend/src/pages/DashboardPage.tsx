import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Clock, Eye, UserCheck, UserX, Zap, TrendingUp, ArrowRight, Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import type { Application, DashboardStats, WorkflowStats } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats[]>([]);
  const [topCandidates, setTopCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, topData] = await Promise.all([
        api.getStats(),
        fetch(`${API_BASE}/admin/top-candidates`).then(r => r.json()).catch(() => ({ candidates: [] })),
      ]);
      setStats(statsData.stats);
      setRecentApps(statsData.recentActivity || []);
      setWorkflowStats(statsData.workflowStats || []);
      setTopCandidates(topData.candidates || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats?.total || 0,
      icon: <FileText />,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      accent: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      label: 'Pending Review',
      value: stats?.pending || 0,
      icon: <Clock />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      accent: 'linear-gradient(135deg, #f59e0b, #f97316)',
    },
    {
      label: 'Under Review',
      value: stats?.reviewing || 0,
      icon: <Eye />,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      accent: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    },
    {
      label: 'Accepted',
      value: stats?.accepted || 0,
      icon: <UserCheck />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      accent: 'linear-gradient(135deg, #10b981, #34d399)',
    },
    {
      label: 'Rejected',
      value: stats?.rejected || 0,
      icon: <UserX />,
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.1)',
      accent: 'linear-gradient(135deg, #f43f5e, #fb7185)',
    },
  ];

  const totalWorkflows = workflowStats.reduce((sum, s) => sum + s.total, 0);
  const completedWorkflows = workflowStats.reduce((sum, s) => sum + s.completed, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Overview of your job application automation system</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ '--stat-accent': card.accent, '--stat-bg': card.bg, '--stat-color': card.color } as React.CSSProperties}
          >
            <div className="stat-card-header">
              <div className="stat-card-icon">
                {card.icon}
              </div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent Applications */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Recent Applications</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/applications')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {recentApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText /></div>
              <div className="empty-state-title">No applications yet</div>
              <div className="empty-state-desc">Wait for candidates to submit applications</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => (
                  <tr key={app.id} onClick={() => navigate(`/admin/applications/${app.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</div>
                    </td>
                    <td>{app.position}</td>
                    <td>
                      <span className={`badge badge-${app.status}`}>
                        <span className="badge-dot" />
                        {app.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Automation Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary-light)'
              }}>
                <Zap size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Power Automate</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Workflow Status</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{totalWorkflows}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Runs</div>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-emerald)' }}>{completedWorkflows}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed</div>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/admin/workflows')}>
              <Workflow size={14} /> View Workflows
            </button>
          </div>

          {stats?.avg_ai_score && (
            <div className="ai-analysis-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Sparkles size={18} color="var(--accent-secondary)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Avg AI Score</span>
              </div>
              <div className="ai-score-circle">{Math.round(stats.avg_ai_score)}</div>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Average Match Score</div>
            </div>
          )}

          {/* Top Candidates */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={18} color="#7C3AED" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Top Candidates</span>
            </div>
            {topCandidates.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No AI-scored applications yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCandidates.map((c, i) => (
                  <div key={c.id}
                    onClick={() => navigate(`/admin/applications/${c.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0', borderBottom: i < topCandidates.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white',
                    }}>
                      {c.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.position}</div>
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                      background: c.ai_score >= 80 ? 'var(--accent-emerald)' : c.ai_score >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                    }}>
                      {Math.round(c.ai_score)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



function Workflow({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v3a1 1 0 0 0 1 1h4" />
      <path d="M18 9v3a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}
