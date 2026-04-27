import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Save, X, CircleCheck, Clock, Award, TrendingUp } from 'lucide-react';
import { api } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_BASE_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')).replace(/\/$/, '');

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.5px solid #e2e8f0',
  background: '#fff',
  fontSize: 14,
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
};

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
  const [saveError, setSaveError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [focused, setFocused] = useState('');
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
    setSaveError('');
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.firebaseUser.uid,
          name, phone, headline,
          skills: skillTags.join(', '),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const verifiedSkills: string[] = Array.isArray((user as any)?.verified_skills) ? (user as any).verified_skills : [];
  const completedFields = [!!name, !!phone, !!headline, skillTags.length > 0].filter(Boolean).length;
  const completeness = Math.round((completedFields / 4) * 100);

  const avatarLetter = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Profile</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Keep your profile updated to get better job matches</p>
      </div>

      {/* Top banner card — avatar + name + completeness */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>{avatarLetter}</span>
          }
        </div>

        {/* Name + email + headline */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            {name || 'Your Name'}
          </div>
          {headline && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>{headline}</div>}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{user?.email}</div>
        </div>

        {/* Profile strength */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 20px',
          minWidth: 180, backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Profile Strength</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{completeness}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
            <div style={{
              height: '100%', borderRadius: 999, background: '#fff',
              width: `${completeness}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
            {completedFields}/4 fields completed
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left — Edit form */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="#6366f1" /> Personal Information
          </h3>

          {/* Name + Phone row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sachin Rao Mandhiya"
                style={{ ...inputStyle, borderColor: focused === 'name' ? '#6366f1' : '#e2e8f0' }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused('')}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ ...inputStyle, borderColor: focused === 'phone' ? '#6366f1' : '#e2e8f0' }}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused('')}
              />
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={11} /> Professional Headline
              </span>
            </label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Full Stack Developer with 3 years experience"
              style={{ ...inputStyle, borderColor: focused === 'headline' ? '#6366f1' : '#e2e8f0' }}
              onFocus={() => setFocused('headline')}
              onBlur={() => setFocused('')}
            />
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Skills</label>
            <div
              onClick={() => skillInputRef.current?.focus()}
              style={{
                minHeight: 52, padding: '8px 12px', borderRadius: 8,
                border: `1.5px solid ${focused === 'skills' ? '#6366f1' : '#e2e8f0'}`,
                background: '#fff', display: 'flex', flexWrap: 'wrap',
                gap: 6, alignItems: 'center', cursor: 'text',
                transition: 'border-color 0.15s',
              }}
            >
              {skillTags.map(skill => (
                <span key={skill} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: '#ede9fe', color: '#6366f1',
                  border: '1px solid #c4b5fd',
                }}>
                  {skill}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#6366f1', opacity: 0.6, lineHeight: 1 }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                ref={skillInputRef}
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => { skillInput.trim() && addSkill(skillInput); setFocused(''); }}
                onFocus={() => setFocused('skills')}
                placeholder={skillTags.length === 0 ? 'Type a skill and press Enter...' : 'Add more...'}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  color: '#0f172a', fontSize: 13, minWidth: 140, flex: 1, height: 30,
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
              Press Enter or comma to add - Backspace to remove last
            </p>
          </div>

          {/* Error */}
          {saveError && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: 13, color: '#dc2626',
            }}>
              {saveError}
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? '#a5b4fc' : '#6366f1', color: '#fff',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                <CircleCheck size={15} /> Saved!
              </span>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Checklist card */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="#6366f1" /> Complete Your Profile
            </h4>
            {[
              { label: 'Add your full name', done: !!name },
              { label: 'Add phone number', done: !!phone },
              { label: 'Write a headline', done: !!headline },
              { label: 'Add your skills', done: skillTags.length > 0 },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.done ? '#dcfce7' : '#f1f5f9',
                  border: `1.5px solid ${item.done ? '#86efac' : '#e2e8f0'}`,
                }}>
                  {item.done && <CircleCheck size={12} color="#16a34a" />}
                </div>
                <span style={{ fontSize: 13, color: item.done ? '#374151' : '#94a3b8', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Verified skills */}
          {verifiedSkills.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
              padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} color="#f59e0b" /> Verified Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {verifiedSkills.map(s => (
                  <span key={s} style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                  }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview history */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#6366f1" /> Interview History
            </h4>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No interviews yet</p>
                <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 0' }}>Try Mock Interview to practice</p>
              </div>
            ) : (
              history.slice(0, 5).map((row, i) => (
                <div key={row.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < Math.min(history.length, 5) - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {row.job_title || 'General Interview'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff',
                    background: row.score >= 70 ? '#10b981' : row.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {row.score ?? '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
