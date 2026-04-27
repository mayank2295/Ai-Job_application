import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CirclePlus, ChevronLeft, ChevronRight, SquareCheck, Square } from 'lucide-react';
import { api } from '../api/client';
import type { Application } from '../types';

const statusFilters = ['all', 'pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
const BULK_STATUSES = ['reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
const PAGE_SIZE = 20;

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSelected = applications.length > 0 && applications.every(a => selected.has(a.id));

  useEffect(() => { setPage(1); setSelected(new Set()); }, [statusFilter, search]);

  useEffect(() => { loadApplications(); }, [statusFilter, search, page]);

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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(applications.map(a => a.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all([...selected].map(id => api.updateStatus(id, bulkStatus)));
      setSelected(new Set());
      setBulkStatus('');
      await loadApplications();
    } catch (err) {
      console.error('Bulk update failed:', err);
    } finally {
      setBulkUpdating(false);
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
          <CirclePlus size={16} /> New Application
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
            <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8, marginBottom: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{ height: 34, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}
          >
            <option value="">Move to status...</option>
            {BULK_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            disabled={!bulkStatus || bulkUpdating}
            onClick={handleBulkUpdate}
          >
            {bulkUpdating ? 'Updating...' : 'Apply'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

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
                <th style={{ width: 40 }}>
                  <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {allSelected ? <SquareCheck size={16} color="var(--accent-primary)" /> : <Square size={16} />}
                  </button>
                </th>
                <th>Applicant</th>
                <th>Position</th>
                <th>Experience</th>
                <th>Status</th>
                <th>AI Score</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ background: selected.has(app.id) ? 'rgba(99,102,241,0.06)' : undefined }}>
                  <td onClick={(e) => { e.stopPropagation(); toggleSelect(app.id); }} style={{ cursor: 'pointer' }}>
                    {selected.has(app.id)
                      ? <SquareCheck size={16} color="var(--accent-primary)" />
                      : <Square size={16} color="var(--text-muted)" />}
                  </td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{app.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</div>
                  </td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)} style={{ fontWeight: 500 }}>{app.position}</td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)}>{app.experience_years} yrs</td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)}>
                    <span className={`badge badge-${app.status}`}>
                      <span className="badge-dot" />{app.status}
                    </span>
                  </td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)}>
                    {app.ai_score ? (
                      <span style={{ fontWeight: 700, color: app.ai_score >= 80 ? 'var(--accent-emerald)' : app.ai_score >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                        {app.ai_score}%
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>}
                  </td>
                  <td onClick={() => navigate(`/admin/applications/${app.id}`)} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-primary)',
                  background: p === page ? '#7C3AED' : 'var(--bg-card)',
                  color: p === page ? 'white' : 'var(--text-secondary)',
                  fontWeight: p === page ? 700 : 400, fontSize: 13, cursor: 'pointer',
                }}>{p}</button>
              );
            })}
            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
