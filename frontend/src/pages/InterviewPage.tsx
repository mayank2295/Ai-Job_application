import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, Send, Mic, MicOff, RotateCcw, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractPdfText } from '../lib/careerbot-api';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Msg = { role: 'assistant' | 'user'; content: string; feedback?: string };

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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [answer]);

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
    setLoading(true);
    setError('');
    try {
      const data = await postJSON('/ai/interview/answer', {
        sessionId,
        answer: userMsg.content,
        conversationHistory: nextHistory.map(m => ({ role: m.role, content: m.content })),
      });
      if (data.complete) {
        setResult(data);
      } else {
        // Add interviewer's next question, optionally with inline feedback
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.nextQuestion,
            feedback: data.questionFeedback || undefined,
          },
        ]);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not submit answer');
      // Remove the user message if it failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Voice input not supported in this browser.'); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAnswer(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const reset = () => {
    setSessionId(''); setMessages([]); setResult(null);
    setResumeText(''); setResumeFileName(''); setError(''); setAnswer('');
  };

  const questionCount = messages.filter(m => m.role === 'user').length;

  // ── Setup screen ──────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>AI Mock Interview</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Conversational interview - ask questions, listen, judge and score
              </p>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-primary)', margin: '16px 0' }} />

          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7, fontSize: 14 }}>
            Upload your resume and the AI interviewer will conduct a <strong>natural conversation</strong> - asking tailored questions based on your background, listening to your answers, and providing a final score with detailed feedback.
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--accent-rose)' }}>
              {error}
            </div>
          )}

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: `2px dashed ${resumeFileName ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              borderRadius: 12, padding: '24px 16px',
              textAlign: 'center', cursor: 'pointer', marginBottom: 12,
              background: resumeFileName ? 'rgba(99,102,241,0.04)' : 'transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = resumeFileName ? 'var(--accent-primary)' : 'var(--border-primary)')}
          >
            {resumeFileName ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent-primary)' }}>
                <FileText size={20} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{resumeFileName}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setResumeFileName(''); setResumeText(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                >x</button>
              </div>
            ) : (
              <>
                <Upload size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Drop your CV / Resume here</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, TXT, DOC supported - or paste below</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0] || null)} />

          {!resumeFileName && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Or paste resume text:</div>
              <textarea
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, resize: 'vertical', fontSize: 13 }}
              />
            </>
          )}

          <button
            className="btn btn-primary"
            onClick={startInterview}
            disabled={loading || !resumeText.trim()}
            style={{ width: '100%', padding: '12px', fontSize: 15, marginTop: resumeFileName ? 16 : 0 }}
          >
            {loading ? 'Starting Interview...' : 'Start Interview'}
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────
  if (result) {
    const scoreColor = result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div className="page-container">
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Score card */}
          <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 24px' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: 'white',
              background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}cc)`,
              boxShadow: `0 8px 32px ${scoreColor}40`,
            }}>
              {result.score}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Interview Complete</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              {result.feedback}
            </p>
          </div>

          {/* Strengths + Improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h4 style={{ color: '#10b981', marginTop: 0, marginBottom: 12, fontSize: 14 }}>Strengths</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {(result.strengths || []).map((x: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <h4 style={{ color: '#f43f5e', marginTop: 0, marginBottom: 12, fontSize: 14 }}>Areas to Improve</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {(result.improvements || []).map((x: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* CV Enhancements */}
          {result.cvEnhancements?.length > 0 && (
            <div className="card" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--accent-primary)', marginTop: 0, marginBottom: 12, fontSize: 14 }}>CV Enhancement Suggestions</h4>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {result.cvEnhancements.map((tip: string, i: number) => (
                  <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{tip}</li>
                ))}
              </ol>
            </div>
          )}

          <button className="btn btn-secondary" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={15} /> Start New Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Active interview chat ─────────────────────────────────────
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: 0 }}>
      {/* Chat header */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Interviewer</div>
            <div style={{ fontSize: 11, color: loading ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {loading ? 'Thinking...' : `${questionCount} answer${questionCount !== 1 ? 's' : ''} given`}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={reset} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw size={13} /> End Interview
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: m.role === 'assistant'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            }}>
              {m.role === 'assistant' ? <Bot size={16} color="white" /> : <User size={16} color="white" />}
            </div>

            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Message bubble */}
              <div style={{
                padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: 14, lineHeight: 1.7,
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary, #8b5cf6))'
                  : 'var(--bg-tertiary)',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                border: m.role === 'assistant' ? '1px solid var(--border-primary)' : 'none',
              }}>
                {m.content}
              </div>

              {/* Inline feedback after assistant's follow-up question */}
              {m.role === 'assistant' && m.feedback && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6,
                  background: m.feedback.startsWith('✓') ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                  border: `1px solid ${m.feedback.startsWith('✓') ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                  color: m.feedback.startsWith('✓') ? '#10b981' : '#f43f5e',
                }}>
                  {m.feedback}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              padding: '14px 18px', borderRadius: '18px 18px 18px 4px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--text-muted)',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--accent-rose)' }}>
            {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border-primary)',
        background: 'var(--bg-card)', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'var(--bg-tertiary)', borderRadius: 16,
          border: '1.5px solid var(--border-primary)', padding: '8px 12px',
          transition: 'border-color 0.15s',
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
            }}
            placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
            disabled={loading}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: 14, resize: 'none',
              lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {/* Voice input button */}
            <button
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isListening ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: isListening ? '#ef4444' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Send button */}
            <button
              onClick={submitAnswer}
              disabled={loading || !answer.trim()}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: answer.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: answer.trim() && !loading ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Enter to send - Shift+Enter for new line - Mic for voice input
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
