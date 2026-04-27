import { useEffect, useState } from 'react';
import {
  Zap,
  CircleCheck,
  CircleX,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { api } from '../api/client';
import type { WorkflowLog } from '../types';

export default function ActivityPage() {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getWorkflowLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.flow_type === filter);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Activity Log</h1>
          <p>Complete history of all automation workflows</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLogs}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {['all', 'instant', 'automated', 'scheduled'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Zap /></div>
            <div className="empty-state-title">No activity yet</div>
            <div className="empty-state-desc">
              Workflow executions will appear here once you start using the system
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="timeline" style={{ padding: '24px 24px 24px 48px' }}>
            {filteredLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className={`timeline-dot ${log.status === 'completed' ? 'completed' : log.status === 'failed' ? 'failed' : ''}`} />
                <div className="timeline-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="timeline-title">{log.flow_name}</span>
                    <span className={`badge badge-${log.flow_type}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {log.flow_type}
                    </span>
                    <span className={`badge badge-${log.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {log.status === 'completed' && <CircleCheck size={10} />}
                      {log.status === 'failed' && <CircleX size={10} />}
                      {log.status === 'running' && <RefreshCw size={10} />}
                      {log.status}
                    </span>
                  </div>
                  {log.applicant_name && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Applicant: {log.applicant_name} · {log.position}
                    </div>
                  )}
                  {log.error_message && (
                    <div style={{
                      fontSize: 12, color: 'var(--accent-rose)',
                      padding: '6px 10px', background: 'rgba(244,63,94,0.05)',
                      borderRadius: 'var(--radius-sm)', marginTop: 6, border: '1px solid rgba(244,63,94,0.1)'
                    }}>
                      ⚠ {log.error_message}
                    </div>
                  )}
                  <div className="timeline-time">
                    <Clock size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                    {new Date(log.created_at).toLocaleString()}
                    {log.completed_at && ` → ${new Date(log.completed_at).toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
