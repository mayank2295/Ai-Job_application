import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import type { Application } from '../types';

const statusFilters = ['all', 'pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  useEffect(() => {
    loadApplications();
  }, [statusFilter, search, page]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      };
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
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No applications yet'}
            </div>
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
                <tr key={app.id} onClick={() => navigate(`/admin/applications/${app.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{app.full_name}</div>
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
                      <span style={{ fontWeight: 700, color: app.ai_score >= 80 ? 'var(--accent-emerald)' : app.ai_score >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                        {app.ai_score}%
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td>
                    {app.workflow_status !== 'none' && (
                      <span className={`badge badge-${app.workflow_status}`}>{app.workflow_status}</span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '0 4px' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-primary)',
                    background: p === page ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: p === page ? 'white' : 'var(--text-secondary)',
                    fontWeight: p === page ? 700 : 400, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
