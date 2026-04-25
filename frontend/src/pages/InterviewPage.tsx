import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractPdfText } from '../lib/careerbot-api';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Msg = { role: 'assistant' | 'user'; content: string };
type QFeedback = { questionNumber: number; feedback: string };

async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export default function InterviewPage() {
  const { jobId = '' } = useParams();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [feedbacks, setFeedbacks] = useState<QFeedback[]>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState('');

  const questionCount = messages.filter((m) => m.role === 'assistant').length;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    try {
      const text = file.type === 'application/pdf'
        ? await extractPdfText(file)
        : await file.text();
      setResumeText(text);
      setResumeFileName(file.name);
    } catch (e: any) {
      setError('Could not read file: ' + e.message);
    }
  };

  const startInterview = async () => {
    setError('');
    if (!resumeText.trim()) { setError('Please upload or paste your resume first.'); return; }
    setLoading(true);
    try {
      const data = await postJSON('/ai/interview/start', {
        jobId: jobId || undefined,
        resumeText,
        candidateId: user?.id || user?.firebaseUser?.uid,
      });
      setSessionId(data.sessionId);
      setMessages([{ role: 'assistant', content: data.question }]);
    } catch (e: any) {
      setError(e?.message || 'Could not start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !sessionId || loading) return;
    const userMsg: Msg = { role: 'user', content: answer.trim() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setAnswer('');
    setCurrentFeedback('');
    setLoading(true);
    setError('');
    try {
      const data = await postJSON('/ai/interview/answer', {
        sessionId,
        answer: userMsg.content,
        conversationHistory: nextHistory,
      });
      if (data.complete) {
        setResult(data);
      } else {
        if (data.questionFeedback) {
          setFeedbacks((prev) => [...prev, { questionNumber: data.questionNumber, feedback: data.questionFeedback }]);
          setCurrentFeedback(data.questionFeedback);
        }
        if (data.nextQuestion) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.nextQuestion }]);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Could not submit answer');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSessionId(''); setMessages([]); setFeedbacks([]); setResult(null);
    setResumeText(''); setResumeFileName(''); setCurrentFeedback(''); setError('');
  };

  // ── Setup screen ──────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>AI Mock Interview</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Upload your CV or paste your resume text to begin a tailored <strong>10-question</strong> technical interview.
            You'll get instant feedback after each answer, a final score, and CV enhancement tips.
          </p>

          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: '2px dashed var(--border-primary)', borderRadius: 10, padding: '20px 16px',
              textAlign: 'center', cursor: 'pointer', marginBottom: 12, transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
          >
            {resumeFileName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent-primary)' }}>
                <FileText size={18} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{resumeFileName}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setResumeFileName(''); setResumeText(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 13 }}
                >✕</button>
              </div>
            ) : (
              <>
                <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Upload CV / Resume</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, TXT, DOC — or paste below</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0] || null)} />

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Or paste resume text:</div>
          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume text here..."
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, resize: 'vertical' }}
          />

          <button className="btn btn-primary" onClick={startInterview} disabled={loading || !resumeText.trim()} style={{ width: '100%' }}>
            {loading ? 'Starting Interview...' : 'Start Interview'}
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────
  if (result) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0 }}>Interview Complete</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: 'white',
              background: result.score >= 70 ? 'var(--accent-emerald)' : result.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)',
            }}>
              {result.score}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Score: {result.score}/100</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{result.feedback}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h4 style={{ color: 'var(--accent-emerald)', marginTop: 0 }}>Strengths</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {(result.strengths || []).map((x: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{x}</li>)}
              </ul>
            </div>
            <div className="card" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <h4 style={{ color: 'var(--accent-rose)', marginTop: 0 }}>Areas to Improve</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {(result.improvements || []).map((x: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 13 }}>{x}</li>)}
              </ul>
            </div>
          </div>

          {result.cvEnhancements?.length > 0 && (
            <div className="card" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--accent-primary)', marginTop: 0 }}>CV Enhancement Suggestions</h4>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {result.cvEnhancements.map((tip: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.6 }}>{tip}</li>
                ))}
              </ol>
            </div>
          )}

          {feedbacks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Per-Question Feedback</h4>
              {feedbacks.map((fb) => (
                <div key={fb.questionNumber} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6, fontSize: 12.5, lineHeight: 1.6,
                  background: fb.feedback.startsWith('✓') ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                  border: `1px solid ${fb.feedback.startsWith('✓') ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                  color: 'var(--text-secondary)',
                }}>
                  <strong>Q{fb.questionNumber}:</strong> {fb.feedback}
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-secondary" onClick={reset}>Start New Interview</button>
        </div>
      </div>
    );
  }

  // ── Active interview screen ───────────────────────────────────
  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Mock Interview</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            Q {Math.min(questionCount, 10)} / 10
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${(questionCount / 10) * 100}%`, background: 'var(--accent-primary)', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 400, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 14, lineHeight: 1.7, maxWidth: '90%',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-tertiary)',
              color: m.role === 'user' ? 'white' : 'var(--text-primary)',
              border: m.role === 'assistant' ? '1px solid var(--border-primary)' : 'none',
            }}>
              {m.content}
            </div>
          ))}

          {currentFeedback && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, alignSelf: 'flex-start',
              background: currentFeedback.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${currentFeedback.startsWith('✓') ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
              color: 'var(--text-secondary)',
            }}>
              {currentFeedback}
            </div>
          )}

          {loading && (
            <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
              Thinking...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
            placeholder="Type your answer... (Enter to send)"
            disabled={loading}
            style={{ flex: 1, resize: 'none', boxSizing: 'border-box' }}
          />
          <button className="btn btn-primary" onClick={submitAnswer} disabled={loading || !answer.trim()}
            style={{ alignSelf: 'flex-end', padding: '10px 20px' }}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
