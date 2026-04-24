import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Briefcase, Tag, Save } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.firebaseUser.uid, name, phone, headline, skills }),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) {} finally { setSaving(false); }
  };

  const field = (label: string, icon: any, value: string, setter: (v: string) => void, placeholder: string, multiline = false) => (
    <div>
      <label style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', gap: 6 }}>
        {icon}{label}
      </label>
      {multiline
        ? <textarea value={value} onChange={e => setter(e.target.value)} rows={3} placeholder={placeholder}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        : <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      }
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your profile and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Avatar Card */}
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{(user?.name || user?.email || '?')[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{name || 'Your Name'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.email}</div>
          {headline && <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 500 }}>{headline}</div>}
          <div style={{ marginTop: 16 }}>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>Candidate</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, marginTop: 0 }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {field('Full Name', <User size={13} />, name, setName, 'Your full name')}
            {field('Phone', <Phone size={13} />, phone, setPhone, '+91 XXXXX XXXXX')}
            {field('Headline', <Briefcase size={13} />, headline, setHeadline, 'e.g. Frontend Developer with 3 years experience')}
            {field('Skills', <Tag size={13} />, skills, setSkills, 'e.g. React, Node.js, Python, SQL (comma-separated)', true)}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={15} />{saving ? 'Saving…' : 'Save Profile'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
