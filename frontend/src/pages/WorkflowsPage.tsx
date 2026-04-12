import { useEffect, useState } from 'react';
import {
  Zap,
  Clock,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  MessageSquare,
  Brain,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import type { WorkflowLog, WorkflowStats } from '../types';

export default function WorkflowsPage() {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [stats, setStats] = useState<WorkflowStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await api.getWorkflowLogs();
      setLogs(data.logs || []);
      setStats(data.stats || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = async (flowType: string) => {
    setTesting(flowType);
    try {
      await api.testTrigger(flowType);
      showToast('success', `Test trigger sent for ${flowType} flow`);
      loadWorkflows();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setTesting(null);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatForType = (type: string) => {
    return stats.find((s) => s.flow_type === type) || { total: 0, completed: 0, failed: 0, running: 0 };
  };

  const workflows = [
    {
      type: 'instant',
      title: 'New Application Notification',
      description: 'Triggered when a new application is submitted. Sends confirmation email to applicant and notifies HR team on Microsoft Teams.',
      icon: <Zap size={22} />,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      accent: 'var(--gradient-primary)',
      features: ['Sends confirmation email', 'Teams notification to HR', 'Logs application receipt'],
    },
    {
      type: 'automated',
      title: 'Resume AI Analysis',
      description: 'Automatically triggered when a resume is uploaded. Uses AI Builder to extract skills, experience, and generate a match score.',
      icon: <Brain size={22} />,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      accent: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      features: ['AI-powered resume parsing', 'Skill extraction', 'Match score generation'],
    },
    {
      type: 'scheduled',
      title: 'Daily Follow-up Reminders',
      description: 'Runs every day at 9:00 AM. Checks for applications pending more than 3 days and sends reminder emails to the HR team.',
      icon: <Calendar size={22} />,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      accent: 'linear-gradient(135deg, #f59e0b, #f97316)',
      features: ['Daily check at 9 AM', 'Identifies stale applications', 'Sends reminder emails'],
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading workflows...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Power Automate Workflows</h1>
          <p>Monitor and manage your automation workflows</p>
        </div>
        <button className="btn btn-secondary" onClick={loadWorkflows}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Workflow Cards */}
      <div className="workflow-grid">
        {workflows.map((wf) => {
          const stat = getStatForType(wf.type);
          return (
            <div
              key={wf.type}
              className="workflow-card"
              style={{ '--wf-accent': wf.accent, '--wf-bg': wf.bg, '--wf-color': wf.color } as React.CSSProperties}
            >
              <div className="workflow-card-header">
                <div className="workflow-card-icon">
                  {wf.icon}
                </div>
                <span className={`badge badge-${wf.type}`}>{wf.type}</span>
              </div>

              <h3 className="workflow-card-title">{wf.title}</h3>
              <p className="workflow-card-desc">{wf.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                {wf.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <CheckCircle size={14} color="var(--accent-emerald)" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="workflow-card-meta">
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="workflow-card-stat">
                    <strong>{stat.total}</strong> runs
                  </div>
                  <div className="workflow-card-stat" style={{ color: 'var(--accent-emerald)' }}>
                    <strong>{stat.completed}</strong> ok
                  </div>
                  {stat.failed > 0 && (
                    <div className="workflow-card-stat" style={{ color: 'var(--accent-rose)' }}>
                      <strong>{stat.failed}</strong> failed
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleTestTrigger(wf.type)}
                  disabled={testing === wf.type}
                  style={{ color: wf.color }}
                >
                  {testing === wf.type ? (
                    <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  ) : (
                    <Play size={14} />
                  )}
                  Test
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Log */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Execution History</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {logs.length} total executions
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Zap /></div>
            <div className="empty-state-title">No workflow executions yet</div>
            <div className="empty-state-desc">
              Submit an application to trigger your first workflow
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Flow</th>
                <th>Type</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Error</th>
                <th>Triggered</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.flow_name}
                  </td>
                  <td>
                    <span className={`badge badge-${log.flow_type}`}>{log.flow_type}</span>
                  </td>
                  <td>{log.applicant_name || '—'}</td>
                  <td>
                    <span className={`badge badge-${log.status}`}>
                      {log.status === 'completed' && <CheckCircle size={12} />}
                      {log.status === 'failed' && <XCircle size={12} />}
                      {log.status === 'running' && <RefreshCw size={12} />}
                      {log.status}
                    </span>
                  </td>
                  <td>
                    {log.error_message ? (
                      <span style={{ fontSize: 12, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} />
                        {log.error_message.substring(0, 50)}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* How It Works */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          🔗 How Power Automate Connects
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Mail size={16} color="var(--accent-primary-light)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>HTTP Trigger</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Your backend sends an HTTP POST to Power Automate's URL when a new application is created.
            </p>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MessageSquare size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Webhook Callback</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Power Automate calls back your backend API with results (e.g., AI analysis scores).
            </p>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Clock size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Scheduled Polling</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Power Automate polls your API on a schedule to check for pending applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
