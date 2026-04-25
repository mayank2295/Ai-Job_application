import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Briefcase, Save, X, Plus } from 'lucide-react';
import { api } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [skillTags, setSkillTags] = useState<string[]>(
    user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const skillInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    api.getInterviewHistory(user.id).then((d) => setHistory(d.sessions || [])).catch(() => {});
  }, [user?.id]);

  const addSkill = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || skillTags.includes(trimmed)) { setSkillInput(''); return; }
    setSkillTags(prev => [...prev, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkillTags(prev => prev.filter(s => s !== skill));

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
    if (e.key === 'Backspace' && !skillInput && skillTags.length > 0) {
      setSkillTags(prev => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.firebaseUser.uid,
          name, phone, headline,
          skills: skillTags.join(', '),
        }),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {} finally { setSaving(false); }
  };

  const verifiedSkills: string[] = Array.isArray((user as any)?.verified_skills) ? (user as any).verified_skills : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your profile and preferences</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Avatar Card */}
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>{(user?.name || user?.email || '?')[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{name || 'Your Name'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.email}</div>
          {headline && <div style={{ fontSize: 13, color: 'var(--accent-primary)', fontWeight: 500, marginBottom: 12 }}>{headline}</div>}
          <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>Candidate</span>

          {/* Verified skills */}
          {verifiedSkills.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Verified Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {verifiedSkills.map(s => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#16a34a', border: '1px solid rgba(16,185,129,0.3)' }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, marginTop: 0 }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Full Name */}
            <div>
              <label style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', gap: 6 }}>
                <User size={13} />Full Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', gap: 6 }}>
                <Phone size={13} />Phone
              </label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>

            {/* Headline */}
            <div>
              <label style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', gap: 6 }}>
                <Briefcase size={13} />Headline
              </label>
              <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Frontend Developer with 3 years experience" />
            </div>

            {/* Skills — tag chips */}
            <div>
              <label style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', alignItems: 'center', gap: 6 }}>
                Skills
              </label>
              <div
                onClick={() => skillInputRef.current?.focus()}
                style={{
                  minHeight: 44, padding: '6px 10px', borderRadius: 8,
                  border: '1.5px solid var(--border-primary)', background: 'var(--bg-tertiary)',
                  display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text',
                  transition: 'border-color 0.15s',
                }}
                onFocus={() => {}}
              >
                {skillTags.map(skill => (
                  <span key={skill} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary-light)',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}>
                    {skill}
                    <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit', opacity: 0.7 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  ref={skillInputRef}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => skillInput.trim() && addSkill(skillInput)}
                  placeholder={skillTags.length === 0 ? 'Type a skill and press Enter…' : ''}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    color: 'var(--text-primary)', fontSize: 13, minWidth: 120, flex: 1,
                    height: 28,
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Press Enter or comma to add · Backspace to remove last
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={15} />{saving ? 'Saving…' : 'Save Profile'}
            </button>
            {saved && <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Saved!</span>}
          </div>
        </div>

        {/* Interview History */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Interview History</h3>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No interview sessions yet. Try the Mock Interview tool.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((row) => (
                <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.job_title || 'General Interview'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(row.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: 'white',
                    background: row.score >= 70 ? 'var(--accent-emerald)' : row.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                  }}>
                    {row.score ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
