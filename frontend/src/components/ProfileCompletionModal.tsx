import { useState } from 'react';
import { User, Phone, Briefcase, X, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'SQL', 'AWS', 'Docker', 'Git', 'REST APIs', 'MongoDB',
  'CSS', 'HTML', 'Vue.js', 'Angular', 'GraphQL', 'Kubernetes',
];

interface Props {
  onClose: () => void;
}

export default function ProfileCompletionModal({ onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1); // 1=name/phone, 2=headline/skills
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [skills, setSkills] = useState<string[]>(
    user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) { setSkillInput(''); return; }
    setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  };

  const handleNext = () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setError('');
    setStep(2);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.firebaseUser.uid,
          name: name.trim(),
          phone: phone.trim(),
          headline: headline.trim(),
          skills: skills.join(', '),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      await refreshUser();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-card)',
        borderRadius: 20, border: '1px solid var(--border-primary)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Complete Your Profile
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              {step === 1
                ? 'Tell us a bit about yourself to get started'
                : 'Add your skills so we can match you with the right jobs'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '14px 28px 0', display: 'flex', gap: 6 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: s <= step ? 'var(--accent-primary)' : 'var(--border-primary)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, letterSpacing: '0.01em' }}>
                  <User size={13} color="var(--accent-primary)" /> Full Name <span style={{ color: 'var(--accent-rose)', marginLeft: 2 }}>*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sachin Rao"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '1.5px solid var(--border-primary)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>
                  <Phone size={13} color="var(--accent-primary)" /> Phone Number
                  <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '1.5px solid var(--border-primary)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Headline */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>
                  <Briefcase size={13} color="var(--accent-primary)" /> Professional Headline
                  <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. Full Stack Developer with 3 years experience"
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '1.5px solid var(--border-primary)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Select your key skills — or type your own below:
              </p>

              {/* Suggested skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                {SUGGESTED_SKILLS.map(skill => {
                  const selected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: selected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: selected ? 'white' : 'var(--text-secondary)',
                        border: selected ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-primary)',
                        boxShadow: selected ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                        transform: selected ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      {selected ? '✓ ' : ''}{skill}
                    </button>
                  );
                })}
              </div>

              {/* Custom skill input */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  placeholder="Add a custom skill (e.g. Figma, Rust...)"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid var(--border-primary)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-primary)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  onClick={addCustomSkill}
                  disabled={!skillInput.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: 10, border: '1.5px solid var(--accent-primary)',
                    background: skillInput.trim() ? 'var(--accent-primary)' : 'transparent',
                    color: skillInput.trim() ? 'white' : 'var(--accent-primary)',
                    fontSize: 13, fontWeight: 600, cursor: skillInput.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  Add
                </button>
              </div>

              {/* Selected custom skills */}
              {skills.filter(s => !SUGGESTED_SKILLS.includes(s)).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {skills.filter(s => !SUGGESTED_SKILLS.includes(s)).map(skill => (
                    <span key={skill} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: 'var(--accent-primary)', color: 'white',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                    }}>
                      {skill}
                      <button onClick={() => toggleSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 0, display: 'flex', lineHeight: 1 }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Count */}
              {skills.length > 0 ? (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', fontSize: 10, fontWeight: 800 }}>{skills.length}</span>
                  skill{skills.length !== 1 ? 's' : ''} selected
                </p>
              ) : (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Select at least one skill to improve job matching
                </p>
              )}
            </div>
          )}

          {error && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--accent-rose)' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 28px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit', padding: '8px 4px' }}
          >
            Skip for now
          </button>
          {step === 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 24px', fontSize: 14, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ padding: '11px 20px' }}>Back</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '11px 24px', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
