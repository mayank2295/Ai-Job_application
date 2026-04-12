import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, PlusCircle } from 'lucide-react';
import { api } from '../api/client';
import type { Application } from '../types';

const statusFilters = ['all', 'pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [statusFilter, search]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const data = await api.getApplications(params);
      setApplications(data.applications);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Applications</h1>
          <p>{total} total applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/apply')}>
          <PlusCircle size={16} /> New Application
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {statusFilters.map((s) => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText /></div>
            <div className="empty-state-title">No applications found</div>
            <div className="empty-state-desc">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Submit your first application to get started'}
            </div>
            {!search && statusFilter === 'all' && (
              <button className="btn btn-primary" onClick={() => navigate('/apply')}>
                <PlusCircle size={16} /> Apply Now
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Experience</th>
                <th>Status</th>
                <th>AI Score</th>
                <th>Workflow</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>
                      {app.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{app.position}</td>
                  <td>{app.experience_years} yrs</td>
                  <td>
                    <span className={`badge badge-${app.status}`}>
                      <span className="badge-dot" />
                      {app.status}
                    </span>
                  </td>
                  <td>
                    {app.ai_score ? (
                      <span style={{
                        fontWeight: 700,
                        color: app.ai_score >= 80 ? 'var(--accent-emerald)' :
                          app.ai_score >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                      }}>
                        {app.ai_score}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    {app.workflow_status !== 'none' && (
                      <span className={`badge badge-${app.workflow_status}`}>
                        {app.workflow_status}
                      </span>
                    )}
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
    </div>
  );
}
