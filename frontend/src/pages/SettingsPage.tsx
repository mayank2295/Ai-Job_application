import { useEffect, useState } from 'react';
import {
  Save,
  Zap,
  Mail,
  Globe,
  Key,
  Copy,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import type { Settings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notification_email: '',
    teams_webhook_url: '',
    pa_new_application_url: '',
    pa_resume_analysis_url: '',
    pa_scheduled_flow_enabled: 'false',
    auto_trigger_workflows: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'error' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      showToast('success', 'Settings saved successfully!');
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const webhookUrls = [
    { label: 'Resume Analyzed Callback', url: 'http://localhost:3001/api/webhooks/resume-analyzed' },
    { label: 'Status Update Callback', url: 'http://localhost:3001/api/webhooks/status-update' },
    { label: 'Pending Follow-ups', url: 'http://localhost:3001/api/webhooks/pending-followups' },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading settings...</span>
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
          <h1>Settings</h1>
          <p>Configure Power Automate integration and system preferences</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : (
            <Save size={16} />
          )}
          Save Settings
        </button>
      </div>

      <div className="settings-grid">
        {/* System Health */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: health?.status === 'healthy' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }} />
            <h3 className="settings-section-title" style={{ margin: 0 }}>System Status</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>API</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: health?.status === 'healthy' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {health?.status === 'healthy' ? '● Online' : '● Offline'}
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Version</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {health?.version || '—'}
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Auto Trigger</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: settings.auto_trigger_workflows === 'true' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {settings.auto_trigger_workflows === 'true' ? '● Active' : '● Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Power Automate URLs */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Zap size={18} color="var(--accent-primary-light)" style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
            Power Automate Flow URLs
          </h3>
          <p className="settings-section-desc">
            Paste the HTTP trigger URLs from your Power Automate flows here.
            You can find these in <a href="https://make.powerautomate.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-primary-light)' }}>make.powerautomate.com</a> after saving your flows.
          </p>

          <div className="settings-field">
            <label className="form-label">New Application Flow URL (Instant/HTTP Trigger)</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://prod-xx.westus.logic.azure.com:443/workflows/..."
              value={settings.pa_new_application_url}
              onChange={(e) => updateSetting('pa_new_application_url', e.target.value)}
            />
            <div className="form-hint">This flow triggers when a new application is submitted</div>
          </div>

          <div className="settings-field">
            <label className="form-label">Resume Analysis Flow URL (Automated Trigger)</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://prod-xx.westus.logic.azure.com:443/workflows/..."
              value={settings.pa_resume_analysis_url}
              onChange={(e) => updateSetting('pa_resume_analysis_url', e.target.value)}
            />
            <div className="form-hint">This flow triggers when a resume is uploaded for AI analysis</div>
          </div>

          <div className="settings-field">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Auto-trigger Workflows
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.auto_trigger_workflows === 'true'}
                  onChange={(e) => updateSetting('auto_trigger_workflows', e.target.checked ? 'true' : 'false')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 24,
                  background: settings.auto_trigger_workflows === 'true' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)', transition: 'var(--transition-base)',
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: settings.auto_trigger_workflows === 'true' ? 22 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'white',
                    transition: 'var(--transition-base)',
                  }} />
                </span>
              </label>
            </label>
            <div className="form-hint">When enabled, workflows trigger automatically on events</div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Mail size={18} color="var(--accent-cyan)" style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
            Notification Settings
          </h3>
          <p className="settings-section-desc">
            Configure where notifications are sent when workflows execute.
          </p>

          <div className="settings-field">
            <label className="form-label">Notification Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="hr@company.com"
              value={settings.notification_email}
              onChange={(e) => updateSetting('notification_email', e.target.value)}
            />
          </div>

          <div className="settings-field">
            <label className="form-label">Microsoft Teams Webhook URL</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://outlook.office.com/webhook/..."
              value={settings.teams_webhook_url}
              onChange={(e) => updateSetting('teams_webhook_url', e.target.value)}
            />
            <div className="form-hint">Use the Workflows app in Teams to get a webhook URL</div>
          </div>
        </div>

        {/* Webhook URLs */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Globe size={18} color="var(--accent-emerald)" style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
            Webhook Callback URLs
          </h3>
          <p className="settings-section-desc">
            Use these URLs in your Power Automate flows to send data back to this application.
            Add the API key in the <code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>x-api-key</code> header.
          </p>

          {webhookUrls.map((wh) => (
            <div key={wh.label} className="settings-field">
              <label className="form-label">{wh.label}</label>
              <div className="webhook-url-display">
                <span style={{ flex: 1 }}>{wh.url}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => copyToClipboard(wh.url, wh.label)}
                  style={{ color: copied === wh.label ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                >
                  {copied === wh.label ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}

          <div className="settings-field" style={{ marginTop: 8 }}>
            <label className="form-label"><Key size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />API Key</label>
            <div className="webhook-url-display">
              <span style={{ flex: 1 }}>dev-secret-key-123</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => copyToClipboard('dev-secret-key-123', 'api-key')}
                style={{ color: copied === 'api-key' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
              >
                {copied === 'api-key' ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div className="form-hint">Use this key in the x-api-key header when calling webhook endpoints</div>
          </div>
        </div>

        {/* Guide Link */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} color="var(--accent-primary-light)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Need help setting up Power Automate?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Visit make.powerautomate.com to create your flows and paste the trigger URLs above.
              </div>
            </div>
            <a
              href="https://make.powerautomate.com"
              target="_blank"
              rel="noopener"
              className="btn btn-primary btn-sm"
            >
              <ExternalLink size={14} /> Open Power Automate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
