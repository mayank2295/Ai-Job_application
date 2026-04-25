import { useEffect, useState } from 'react';
import { Save, CheckCircle, Copy, Zap, Bell, Database, Bot } from 'lucide-react';
import { api } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    notification_email: '',
    auto_trigger_workflows: 'true',
    pa_new_application_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.getSettings().then(d => setSettings(prev => ({ ...prev, ...d }))).catch(() => {}),
      api.checkHealth().then(d => setHealth(d)).catch(() => setHealth({ status: 'error' })),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      showToast('success', 'Settings saved');
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) return <div className="page-container"><div className="loading-container"><div className="loading-spinner" /></div></div>;

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>System configuration and integrations</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
          Save Settings
        </button>
      </div>

      <div className="settings-grid">

        {/* System Status */}
        <div className="settings-section">
          <h3 className="settings-section-title">System Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'API', value: isHealthy ? 'Online' : 'Offline', color: isHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)' },
              { label: 'Version', value: health?.version || '1.0.0', color: 'var(--text-primary)' },
              { label: 'Auto Trigger', value: settings.auto_trigger_workflows === 'true' ? 'Active' : 'Disabled', color: settings.auto_trigger_workflows === 'true' ? 'var(--accent-emerald)' : 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>● {s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Bot size={16} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            AI Configuration
          </h3>
          <p className="settings-section-desc">AI keys are configured on the backend (Render environment variables). Do not add them here.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'OpenRouter (LLM)', key: 'OPENROUTER_API_KEY', desc: 'Powers AI Chat, ATS analysis, interviews' },
              { label: 'Tavily (Web Search)', key: 'TAVILY_API_KEY', desc: 'Powers web search and course finder' },
              { label: 'Cloudinary (Storage)', key: 'CLOUDINARY_URL', desc: 'Resume file storage' },
              { label: 'Firebase (Auth)', key: 'Firebase Config', desc: 'Google & email login' },
            ].map(item => (
              <div key={item.key} style={{ padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Set in Render env vars</div>
              </div>
            ))}
          </div>
        </div>

        {/* Automation */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Zap size={16} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            Automation (n8n)
          </h3>
          <p className="settings-section-desc">
            Email notifications go through your n8n webhook. Paste the webhook URL below.
          </p>
          <div className="settings-field">
            <label className="form-label">n8n Webhook URL (New Application)</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://yourname.app.n8n.cloud/webhook/..."
              value={settings.pa_new_application_url || ''}
              onChange={(e) => update('pa_new_application_url', e.target.value)}
            />
            <div className="form-hint">Triggered when a new application is submitted</div>
          </div>
          <div className="settings-field">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              Auto-trigger on new applications
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.auto_trigger_workflows === 'true'}
                  onChange={(e) => update('auto_trigger_workflows', e.target.checked ? 'true' : 'false')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 24,
                  background: settings.auto_trigger_workflows === 'true' ? '#7C3AED' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)', transition: '0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 3,
                    left: settings.auto_trigger_workflows === 'true' ? 22 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'white', transition: '0.2s',
                  }} />
                </span>
              </label>
            </label>
            <div className="form-hint">When enabled, n8n webhook fires automatically on each new application</div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Bell size={16} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            Notifications
          </h3>
          <p className="settings-section-desc">Where to send HR alerts when application statuses change.</p>
          <div className="settings-field">
            <label className="form-label">HR Notification Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="hr@yourcompany.com"
              value={settings.notification_email || ''}
              onChange={(e) => update('notification_email', e.target.value)}
            />
            <div className="form-hint">Receives alerts when candidates are shortlisted or accepted</div>
          </div>
        </div>

        {/* Deployment Info */}
        <div className="settings-section">
          <h3 className="settings-section-title">
            <Database size={16} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
            Deployment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Frontend', value: 'https://ai-job-application-eight.vercel.app', key: 'frontend' },
              { label: 'Backend API', value: `${API_BASE}`, key: 'backend' },
              { label: 'Health Check', value: `${API_BASE}/health`, key: 'health' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{item.value}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => copy(item.value, item.key)}
                  style={{ flexShrink: 0 }}
                >
                  {copied === item.key ? <CheckCircle size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
