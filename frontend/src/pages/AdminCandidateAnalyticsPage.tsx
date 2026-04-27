import { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Mic, Search, ChevronUp, ChevronDown } from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Candidate = {
  id: string;
  name: string;
  email: string;
  photo_url: string;
  skills: string;
  headline: string;
  verified_skills: string[];
  reputation_score: number | null;
  created_at: string;
  application_count: number;
  avg_ai_score: number | null;
  best_ai_score: number | null;
  interview_total: number;
  interview_avg_score: number | null;
  interview_best_score: number | null;
  quiz_total_attempts: number;
  quiz_avg_pct: number | null;
  quiz_passed_count: number;
  quiz_attempts: Array<{ skill: string; score: number; total: number; passed: boolean; created_at: string }>;
};

type SortKey = 'name' | 'avg_ai_score' | 'interview_avg_score' | 'verified_skills' | 'application_count' | 'reputation_score' | 'quiz_avg_pct';

function ScorePill({ score, max = 100 }: { score: number | null; max?: number }) {
  if (score === null || score === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>;
  const pct = (score / max) * 100;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: `${color}15`, color,
      border: `1px solid ${color}30`,
    }}>
      {score}
    </span>
  );
}

export default function AdminCandidateAnalyticsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('avg_ai_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch(`${API_BASE}/admin/candidate-analytics`)
      .then(r => r.json())
      .then(d => setCandidates(d.candidates || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = candidates
    .filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'verified_skills') {
        av = a.verified_skills?.length ?? 0;
        bv = b.verified_skills?.length ?? 0;
      } else {
        av = a[sortKey] ?? -1;
        bv = b[sortKey] ?? -1;
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // Summary stats
  const totalCandidates = candidates.length;
  const withInterviews = candidates.filter(c => c.interview_total > 0).length;
  const withQuizzes = candidates.filter(c => c.quiz_total_attempts > 0).length;
  const atsScorers = candidates.filter(c => c.avg_ai_score !== null && !isNaN(c.avg_ai_score));
  const avgAts = atsScorers.length > 0
    ? Math.round(atsScorers.reduce((s, c) => s + c.avg_ai_score!, 0) / atsScorers.length)
    : null;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const thStyle = (k: SortKey): React.CSSProperties => ({
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    color: sortKey === k ? 'var(--accent-primary)' : undefined,
  });

  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="loading-spinner" />
        <span className="loading-text">Loading analytics...</span>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Candidate Analytics</h1>
          <p>ATS scores, interview results, and verified skills across all candidates</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Users size={18} />, label: 'Total Candidates', value: totalCandidates, color: '#6366f1' },
          { icon: <TrendingUp size={18} />, label: 'Avg ATS Score', value: avgAts !== null ? `${avgAts}/100` : '-', color: '#10b981' },
          { icon: <Mic size={18} />, label: 'Took Interviews', value: withInterviews, color: '#f59e0b' },
          { icon: <Award size={18} />, label: 'Took Skill Quiz', value: withQuizzes, color: '#8b5cf6' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or skill..."
          style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users /></div>
            <div className="empty-state-title">No candidates found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={thStyle('name')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Candidate <SortIcon k="name" /></span>
                </th>
                <th onClick={() => handleSort('avg_ai_score')} style={thStyle('avg_ai_score')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>ATS Score <SortIcon k="avg_ai_score" /></span>
                </th>
                <th onClick={() => handleSort('interview_avg_score')} style={thStyle('interview_avg_score')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Interview Score <SortIcon k="interview_avg_score" /></span>
                </th>
                <th onClick={() => handleSort('quiz_avg_pct')} style={thStyle('quiz_avg_pct')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Quiz Score <SortIcon k="quiz_avg_pct" /></span>
                </th>
                <th onClick={() => handleSort('verified_skills')} style={thStyle('verified_skills')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Verified Skills <SortIcon k="verified_skills" /></span>
                </th>
                <th onClick={() => handleSort('application_count')} style={thStyle('application_count')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Applications <SortIcon k="application_count" /></span>
                </th>
                <th onClick={() => handleSort('reputation_score')} style={thStyle('reputation_score')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Reputation <SortIcon k="reputation_score" /></span>
                </th>
                <th>Skills</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  {/* Candidate */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {c.photo_url ? (
                        <img src={c.photo_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
                          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13,
                        }}>
                          {(c.name || c.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                          {c.name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                          {c.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ATS Score */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ScorePill score={c.avg_ai_score} />
                      {c.best_ai_score !== null && c.best_ai_score !== c.avg_ai_score && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best: {c.best_ai_score}</span>
                      )}
                    </div>
                  </td>

                  {/* Interview Score */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ScorePill score={c.interview_avg_score} />
                      {c.interview_total > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.interview_total} session{c.interview_total !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </td>

                  {/* Quiz Score */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ScorePill score={c.quiz_avg_pct} />
                      {c.quiz_total_attempts > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {c.quiz_passed_count}/{c.quiz_total_attempts} passed
                        </span>
                      )}
                      {c.quiz_attempts?.slice(0, 2).map((a, i) => (
                        <span key={i} style={{
                          fontSize: 10, color: a.passed ? '#10b981' : '#ef4444',
                          whiteSpace: 'nowrap',
                        }}>
                          {a.passed ? '✓' : '✗'} {a.skill}: {a.score}/{a.total}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Verified Skills */}
                  <td>
                    {c.verified_skills?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 200 }}>
                        {c.verified_skills.slice(0, 3).map(s => (
                          <span key={s} style={{
                            padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.25)',
                          }}>
                            {s}
                          </span>
                        ))}
                        {c.verified_skills.length > 3 && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>
                            +{c.verified_skills.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</span>
                    )}
                  </td>

                  {/* Applications */}
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.application_count || 0}
                    </span>
                  </td>

                  {/* Reputation */}
                  <td>
                    <ScorePill score={c.reputation_score} />
                  </td>

                  {/* Skills */}
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                      {String(c.skills || '').split(',').filter(Boolean).slice(0, 4).map(s => (
                        <span key={s.trim()} style={{
                          padding: '2px 8px', borderRadius: 999, fontSize: 11,
                          background: 'rgba(99,102,241,0.08)', color: 'var(--accent-primary)',
                          border: '1px solid rgba(99,102,241,0.2)',
                        }}>
                          {s.trim()}
                        </span>
                      ))}
                      {String(c.skills || '').split(',').filter(Boolean).length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>
                          +{String(c.skills || '').split(',').filter(Boolean).length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
        {filtered.length} of {totalCandidates} candidates - Click column headers to sort
      </p>
    </div>
  );
}
