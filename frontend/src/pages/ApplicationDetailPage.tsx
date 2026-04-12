import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Clock,
  FileText,
  Download,
  Sparkles,
  Zap,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import type { Application, WorkflowLog } from '../types';

const statusOptions = ['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (id) loadApplication(id);
  }, [id]);

  const loadApplication = async (appId: string) => {
    try {
      const data = await api.getApplication(appId);
      setApplication(data.application);
      setWorkflowLogs(data.workflowLogs || []);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !application) return;
    setUpdating(true);
    try {
      await api.updateStatus(id, newStatus);
      setApplication({ ...application, status: newStatus as Application['status'] });
      showToast('success', `Status updated to ${newStatus}`);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.deleteApplication(id);
      navigate('/applications');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading application...</span>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-title">Application not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/applications')}>
            <ArrowLeft size={16} /> Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const skills = application.ai_skills ? JSON.parse(application.ai_skills) : [];

  return (
    <div className="page-container">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/applications')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{application.full_name}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Applied for {application.position} · {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="form-select"
            value={application.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            style={{ width: 'auto', padding: '8px 36px 8px 14px', fontSize: 13 }}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button className="btn btn-danger btn-icon" onClick={handleDelete} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Personal Info */}
          <div className="detail-section">
            <div className="detail-section-title"><User size={16} /> Personal Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="detail-field">
                <div className="detail-field-label">Full Name</div>
                <div className="detail-field-value">{application.full_name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Email</div>
                <div className="detail-field-value">
                  <a href={`mailto:${application.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} /> {application.email}
                  </a>
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Phone</div>
                <div className="detail-field-value">
                  {application.phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} /> {application.phone}
                    </span>
                  ) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Position Details */}
          <div className="detail-section">
            <div className="detail-section-title"><Briefcase size={16} /> Position Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="detail-field">
                <div className="detail-field-label">Position</div>
                <div className="detail-field-value">{application.position}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Experience</div>
                <div className="detail-field-value">{application.experience_years} years</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">Status</div>
                <span className={`badge badge-${application.status}`}>
                  <span className="badge-dot" />
                  {application.status}
                </span>
              </div>
            </div>
            {application.cover_letter && (
              <div className="detail-field" style={{ marginTop: 16 }}>
                <div className="detail-field-label">Cover Letter</div>
                <div className="detail-field-value" style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                  padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)', marginTop: 8
                }}>
                  {application.cover_letter}
                </div>
              </div>
            )}
          </div>

          {/* Resume */}
          {application.resume_filename && (
            <div className="detail-section">
              <div className="detail-section-title"><FileText size={16} /> Resume</div>
              <div className="file-upload-selected">
                <FileText size={18} />
                <span className="file-name">{application.resume_filename}</span>
                <button className="btn btn-ghost btn-sm">
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="detail-section">
              <div className="detail-section-title">📝 Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {application.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Analysis */}
          <div className="ai-analysis-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles size={18} color="var(--accent-secondary)" />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>AI Analysis</span>
            </div>

            {application.ai_score ? (
              <>
                <div className="ai-score-circle">{Math.round(application.ai_score)}</div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Match Score
                </div>
                {application.ai_analysis && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                    {application.ai_analysis}
                  </p>
                )}
                {skills.length > 0 && (
                  <div className="ai-skills-list">
                    {skills.map((skill: string) => (
                      <span key={skill} className="ai-skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  No AI analysis available yet
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Configure Power Automate with AI Builder to enable resume analysis
                </div>
              </div>
            )}
          </div>

          {/* Workflow Activity */}
          <div className="detail-section">
            <div className="detail-section-title"><Zap size={16} /> Workflow Activity</div>
            {workflowLogs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No workflow activity recorded
              </div>
            ) : (
              <div className="timeline">
                {workflowLogs.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${log.status === 'completed' ? 'completed' : log.status === 'failed' ? 'failed' : ''}`} />
                    <div className="timeline-content">
                      <div className="timeline-title">{log.flow_name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        <span className={`badge badge-${log.flow_type}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {log.flow_type}
                        </span>
                        <span className={`badge badge-${log.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {log.status}
                        </span>
                      </div>
                      {log.error_message && (
                        <div style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4 }}>
                          {log.error_message}
                        </div>
                      )}
                      <div className="timeline-time">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="detail-section">
            <div className="detail-section-title"><Clock size={16} /> Timeline</div>
            <div className="detail-field">
              <div className="detail-field-label">Applied</div>
              <div className="detail-field-value" style={{ fontSize: 13 }}>
                {new Date(application.created_at).toLocaleString()}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Last Updated</div>
              <div className="detail-field-value" style={{ fontSize: 13 }}>
                {new Date(application.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
