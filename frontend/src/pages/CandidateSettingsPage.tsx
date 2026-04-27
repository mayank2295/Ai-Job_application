import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Shield, Trash2, LogOut, Globe, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CandidateSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [appNotifs, setAppNotifs] = useState(true);
  const [saved, setSaved] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const showSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your account preferences</p>
      </div>

      {/* Account info */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Account
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || 'Your Name'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/profile')}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Edit Profile <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Bell size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Notifications</h3>
        </div>

        <ToggleRow
          label="Email notifications"
          desc="Receive emails when your application status changes"
          checked={emailNotifs}
          onChange={v => { setEmailNotifs(v); showSaved('email'); }}
          saved={saved === 'email'}
        />
        <div style={{ height: 1, background: 'var(--border-primary)', margin: '12px 0' }} />
        <ToggleRow
          label="In-app notifications"
          desc="Show notification bell alerts inside the app"
          checked={appNotifs}
          onChange={v => { setAppNotifs(v); showSaved('app'); }}
          saved={saved === 'app'}
        />
      </div>

      {/* Privacy */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Privacy & Security</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <SettingsRow
            label="Change Password"
            desc="Update your account password"
            action="Manage via Google"
            onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
          />
          <div style={{ height: 1, background: 'var(--border-primary)', margin: '4px 0' }} />
          <SettingsRow
            label="Connected Account"
            desc={`Signed in with ${user?.email?.includes('gmail') ? 'Google' : 'Email'}`}
            action={user?.email?.includes('gmail') ? 'Google Account' : 'Email'}
            onClick={() => {}}
            noArrow
          />
        </div>
      </div>

      {/* Subscription */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Globe size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Subscription</h3>
        </div>
        <SettingsRow
          label="Billing & Plans"
          desc="Manage your subscription and payment methods"
          action="View Plans"
          onClick={() => navigate('/billing')}
        />
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: 24, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Trash2 size={16} style={{ color: 'var(--accent-rose)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-rose)', margin: 0 }}>Account Actions</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
          >
            <LogOut size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-rose)' }}>Sign Out</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign out of your account on this device</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange, saved }: {
  label: string; desc: string; checked: boolean;
  onChange: (v: boolean) => void; saved: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {saved && <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>Saved</span>}
        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: checked ? '#6366f1' : 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)', transition: '0.2s',
          }}>
            <span style={{
              position: 'absolute', top: 3,
              left: checked ? 22 : 3,
              width: 16, height: 16, borderRadius: '50%', background: 'white', transition: '0.2s',
            }} />
          </span>
        </label>
      </div>
    </div>
  );
}

function SettingsRow({ label, desc, action, onClick, noArrow }: {
  label: string; desc: string; action: string;
  onClick: () => void; noArrow?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', cursor: noArrow ? 'default' : 'pointer',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
        {action}
        {!noArrow && <ChevronRight size={14} />}
      </div>
    </div>
  );
}
