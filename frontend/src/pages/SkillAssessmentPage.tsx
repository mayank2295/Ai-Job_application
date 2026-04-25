import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

type QuestionResult = { selected: number; correct: number; explanation: string; isCorrect: boolean };

export default function SkillAssessmentPage() {
  const { user } = useAuth();
  const skills = useMemo(
    () => String(user?.skills || '').split(',').map((x) => x.trim()).filter(Boolean),
    [user?.skills]
  );
  const verified = Array.isArray((user as any)?.verified_skills) ? (user as any).verified_skills : [];

  const [quiz, setQuiz] = useState<any>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [pendingResult, setPendingResult] = useState<QuestionResult | null>(null);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [manualSkill, setManualSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalQuestions = quiz?.questions?.length || 10;

  const takeQuiz = async (skill: string) => {
    setError('');
    setLoading(true);
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
    }
  };

  const pick = async (optionIndex: number) => {
    if (pendingResult) return; // waiting for user to click Next
    const q = quiz.questions[idx];
    const isCorrect = optionIndex === q.correctIndex;
    const result: QuestionResult = {
      selected: optionIndex,
      correct: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    };
    setPendingResult(result);
  };

  const next = async () => {
    if (!pendingResult) return;
    const nextAnswers = [...answers, pendingResult.selected];
    const nextResults = [...questionResults, pendingResult];
    setAnswers(nextAnswers);
    setQuestionResults(nextResults);
    setPendingResult(null);

    const isLast = idx === totalQuestions - 1;
    if (isLast) {
      setLoading(true);
      try {
        const data = await api.submitSkillQuiz({
          quizToken: quiz.quizToken,
          candidateId: user?.id || user?.firebaseUser?.uid || '',
          answers: nextAnswers,
        });
        setFinalResult({ ...data, questionResults: nextResults });
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

  // Landing screen
  if (!quiz) {
    return (
      <div className="page-container">
        <h1>Skill Assessment</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          10 hard questions per skill. Get instant feedback after each answer. Pass 7/10 to verify the skill on your profile.
        </p>
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--text-muted)' }}>Generating quiz...</p>}

        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0, fontWeight: 600 }}>Try any skill</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={manualSkill}
              onChange={(e) => setManualSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualSkill.trim() && takeQuiz(manualSkill.trim())}
              placeholder="e.g. React, Python, System Design"
            />
            <button className="btn btn-primary" disabled={loading || !manualSkill.trim()} onClick={() => takeQuiz(manualSkill.trim())}>
              Start Quiz
            </button>
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
            {skills.map((skill) => (
              <div className="card" key={skill}>
                <h4 style={{ marginTop: 0 }}>{skill}</h4>
                {verified.includes(skill) ? (
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>✓ Verified</span>
                ) : (
                  <button className="btn btn-primary" disabled={loading} onClick={() => takeQuiz(skill)}>
                    Take Quiz
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Final result screen
  if (finalResult) {
    const { score, passed, questionResults: qr } = finalResult;
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Quiz Complete — {quiz.questions[0]?.skill || ''}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: 'white',
              background: passed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}>
              {score}/{totalQuestions}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{passed ? '✓ Skill Verified!' : 'Not Verified Yet'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {passed ? 'Added to your verified skills.' : `Need ${Math.ceil(totalQuestions * 0.7)}/${totalQuestions} to pass. Keep practicing!`}
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

  // Active quiz screen
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

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, marginBottom: 20 }}>
          <div style={{ height: '100%', width: `${((idx) / totalQuestions) * 100}%`, background: 'var(--accent-primary)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        <h3 style={{ marginTop: 0, lineHeight: 1.5 }}>{q.question}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {q.options.map((option: string, i: number) => {
            let bg = 'var(--bg-card)';
            let border = 'var(--border-primary)';
            let color = 'var(--text-primary)';
            if (pendingResult) {
              if (i === pendingResult.correct) { bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.5)'; color = '#16a34a'; }
              else if (i === pendingResult.selected && !pendingResult.isCorrect) { bg = 'rgba(244,63,94,0.1)'; border = 'rgba(244,63,94,0.4)'; color = '#ef4444'; }
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={!!pendingResult}
                style={{
                  padding: '12px 16px', borderRadius: 8, border: `1px solid ${border}`,
                  background: bg, color, textAlign: 'left', cursor: pendingResult ? 'default' : 'pointer',
                  fontSize: 14, lineHeight: 1.5, transition: 'all 0.15s',
                }}
              >
                <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + i)}.</strong>{option}
              </button>
            );
          })}
        </div>

        {pendingResult && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, lineHeight: 1.6,
            background: pendingResult.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${pendingResult.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            color: 'var(--text-secondary)',
          }}>
            <strong>{pendingResult.isCorrect ? '✓ Correct!' : '✗ Incorrect.'}</strong> {q.explanation}
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
