import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

type QuestionResult = { selected: number; correct: number; explanation: string; isCorrect: boolean };

const POPULAR_SKILLS = [
  { name: 'React', icon: '⚛️' },
  { name: 'Python', icon: '🐍' },
  { name: 'SQL', icon: '🗄️' },
  { name: 'TypeScript', icon: '📘' },
  { name: 'Node.js', icon: '🟢' },
  { name: 'System Design', icon: '🏗️' },
  { name: 'AWS', icon: '☁️' },
  { name: 'Docker', icon: '🐳' },
  { name: 'Java', icon: '☕' },
  { name: 'Machine Learning', icon: '🤖' },
];

const STATS = [
  { icon: '📊', label: '10 Questions', sub: 'per quiz' },
  { icon: '✅', label: 'Pass: 7/10', sub: 'to get verified' },
  { icon: '🏅', label: 'Earn Badge', sub: 'on your profile' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '🎯', title: 'Pick a skill', desc: 'Choose from popular skills or type your own' },
  { step: '2', icon: '🧠', title: 'Answer 10 questions', desc: 'Hard, real-world questions with instant feedback' },
  { step: '3', icon: '🏅', title: 'Earn your badge', desc: 'Pass 7/10 to get a verified skill badge on your profile' },
];

export default function SkillAssessmentPage() {
  const { user } = useAuth();
  const skills = useMemo(
    () => String(user?.skills || '').split(',').map((x) => x.trim()).filter(Boolean),
    [user?.skills]
  );
  const verified: string[] = Array.isArray((user as any)?.verified_skills) ? (user as any).verified_skills : [];

  const [quiz, setQuiz] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [pendingResult, setPendingResult] = useState<QuestionResult | null>(null);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [manualSkill, setManualSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSkill, setLoadingSkill] = useState('');
  const [error, setError] = useState('');

  const totalQuestions = quiz?.questions?.length || 10;

  const takeQuiz = async (skill: string) => {
    setError('');
    setLoading(true);
    setLoadingSkill(skill);
    try {
      const data = await api.generateSkillQuiz(skill);
      setQuiz(data);
      setIdx(0);
      setAnswers([]);
      setQuestionResults([]);
      setPendingResult(null);
      setFinalResult(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
      setLoadingSkill('');
    }
  };

  const pick = (optionIndex: number) => {
    if (pendingResult) return;
    const q = quiz.questions[idx];
    // correctIndex is not available client-side (stripped for security)
    // We record the selection and show feedback after submit
    setPendingResult({
      selected: optionIndex,
      correct: -1, // unknown until submit response
      isCorrect: false, // unknown until submit response
      explanation: q.explanation,
    });
  };

  const next = async () => {
    if (!pendingResult) return;
    const nextAnswers = [...answers, pendingResult.selected];
    const nextResults = [...questionResults, pendingResult];
    setAnswers(nextAnswers);
    setQuestionResults(nextResults);
    setPendingResult(null);

    if (idx === totalQuestions - 1) {
      setLoading(true);
      try {
        const data = await api.submitSkillQuiz({
          quizToken: quiz.quizToken,
          candidateId: user?.id || user?.firebaseUser?.uid || '',
          answers: nextAnswers,
        });
        // Enrich question results with correct answers from server
        const enriched = nextResults.map((r, i) => ({
          ...r,
          correct: data.correctAnswers[i] ?? r.correct,
          isCorrect: nextAnswers[i] === data.correctAnswers[i],
        }));
        setFinalResult({ ...data, questionResults: enriched });
      } catch (e: any) {
        setError(e?.message || 'Failed to submit quiz');
      } finally {
        setLoading(false);
      }
    } else {
      setIdx((v) => v + 1);
    }
  };

  const reset = () => {
    setQuiz(null); setIdx(0); setAnswers([]); setQuestionResults([]);
    setPendingResult(null); setFinalResult(null); setError('');
  };

  // ── Landing screen ────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="page-container">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 4 }}>Skill Assessment</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Prove your skills with AI-generated quizzes and earn verified badges on your profile.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          {STATS.map((s) => (
            <div key={s.label} className="card" style={{
              textAlign: 'center', padding: '16px 12px',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Search any skill to start a quiz
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: 10, fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={manualSkill}
              onChange={(e) => setManualSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualSkill.trim() && takeQuiz(manualSkill.trim())}
              placeholder="e.g. React, Python, System Design, Kubernetes..."
              style={{ flex: 1, fontSize: 15, padding: '12px 16px' }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              disabled={loading || !manualSkill.trim()}
              onClick={() => takeQuiz(manualSkill.trim())}
              style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600 }}
            >
              {loading && loadingSkill === manualSkill.trim() ? 'Generating...' : 'Start Quiz →'}
            </button>
          </div>
        </div>

        {/* Popular skills grid */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Popular Skills
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {POPULAR_SKILLS.map((s) => {
              const isVerified = verified.includes(s.name);
              const isLoading = loading && loadingSkill === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => !isVerified && takeQuiz(s.name)}
                  disabled={loading}
                  style={{
                    padding: '14px 12px', borderRadius: 10, border: `1px solid ${isVerified ? 'rgba(16,185,129,0.4)' : 'var(--border-primary)'}`,
                    background: isVerified ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
                    cursor: isVerified ? 'default' : loading ? 'not-allowed' : 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                    opacity: loading && !isLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isVerified && !loading) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { if (!isVerified) e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isVerified ? '#16a34a' : 'var(--text-primary)' }}>
                    {isLoading ? '...' : s.name}
                  </div>
                  {isVerified && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>✓ Verified</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Your Profile Skills
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.map((skill) => {
                const isVerified = verified.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => !isVerified && takeQuiz(skill)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: `1px solid ${isVerified ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`,
                      background: isVerified ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.06)',
                      color: isVerified ? '#16a34a' : 'var(--accent-primary)',
                      fontSize: 13, fontWeight: 600, cursor: isVerified ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isVerified ? `✓ ${skill}` : skill}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="card" style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 20, right: -8, fontSize: 18, color: 'var(--text-muted)',
                  }}>→</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 10 }}>{step.icon}</div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-primary)',
                  color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 8px',
                }}>
                  {step.step}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Final result screen ───────────────────────────────────────
  if (finalResult) {
    const { score, passed, questionResults: qr } = finalResult;
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Quiz Complete</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: 'white',
              background: passed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}>
              {score}/{totalQuestions}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{passed ? '🏅 Skill Verified!' : 'Not Verified Yet'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {passed ? 'Badge added to your profile.' : `Need ${Math.ceil(totalQuestions * 0.7)}/${totalQuestions} to pass. Keep practicing!`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(qr || []).map((r: QuestionResult, i: number) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
                background: r.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${r.isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  {r.isCorrect ? '✓' : '✗'} Q{i + 1}: {quiz.questions[i]?.question}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Your answer: <strong>{quiz.questions[i]?.options[r.selected]}</strong>
                  {!r.isCorrect && <> · Correct: <strong>{quiz.questions[i]?.options[r.correct]}</strong></>}
                </div>
                <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{r.explanation}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => takeQuiz(quiz.skill || manualSkill)}>Retry Quiz</button>
            <button className="btn btn-secondary" onClick={reset}>Back to Skills</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active quiz screen ────────────────────────────────────────
  const q = quiz.questions[idx];
  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Skill Assessment</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            {idx + 1} / {totalQuestions}
          </span>
        </div>

        <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${(idx / totalQuestions) * 100}%`, background: 'var(--accent-primary)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        <h3 style={{ marginTop: 0, lineHeight: 1.5 }}>{q.question}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {q.options.map((option: string, i: number) => {
            let bg = 'var(--bg-card)', border = 'var(--border-primary)', color = 'var(--text-primary)';
            if (pendingResult && i === pendingResult.selected) {
              bg = 'rgba(99,102,241,0.12)'; border = 'rgba(99,102,241,0.5)'; color = 'var(--accent-primary-light)';
            }
            return (
              <button key={i} onClick={() => pick(i)} disabled={!!pendingResult} style={{
                padding: '12px 16px', borderRadius: 8, border: `1px solid ${border}`,
                background: bg, color, textAlign: 'left', cursor: pendingResult ? 'default' : 'pointer',
                fontSize: 14, lineHeight: 1.5, transition: 'all 0.15s',
              }}>
                <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + i)}.</strong>{option}
              </button>
            );
          })}
        </div>

        {pendingResult && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, lineHeight: 1.6,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: 'var(--text-secondary)',
          }}>
            ✓ Answer recorded. Click Next to continue.
          </div>
        )}

        {pendingResult && (
          <button className="btn btn-primary" onClick={next} disabled={loading}>
            {loading ? 'Submitting...' : idx === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
