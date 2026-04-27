import { useState, useRef, useEffect, memo } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Mic, MicOff, CircleStop, User, Bot } from 'lucide-react';
import type { InterviewSessionProps } from './types';

export default memo(function InterviewSession({
  session,
  onAnswer,
  onEndInterview,
  isGenerating = false,
  currentQuestion,
}: InterviewSessionProps) {
  const [answerText, setAnswerText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e: any) => {
        const t = Array.from(e.results).map((x: any) => x[0].transcript).join('');
        setAnswerText(t);
      };
      r.onerror = () => setIsListening(false);
      r.onend = () => setIsListening(false);
      setRecognition(r);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.questions, session.answers, currentQuestion, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [answerText]);

  const toggleVoice = () => {
    if (!recognition) return;
    if (isListening) { recognition.stop(); setIsListening(false); }
    else { recognition.start(); setIsListening(true); }
  };

  const handleSend = () => {
    if (!answerText.trim() || isGenerating) return;
    onAnswer(answerText.trim());
    setAnswerText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEnd = () => {
    if (window.confirm('End the interview? Your progress will be saved.')) onEndInterview();
  };

  const answersGiven = session.answers.length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - var(--navbar-height) - 48px)',
      maxWidth: 800, margin: '0 auto', width: '100%',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 16px', flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Mock Interview
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {answersGiven} answer{answersGiven !== 1 ? 's' : ''} given
          </div>
        </div>
        <button
          onClick={handleEnd}
          className="btn btn-danger"
          style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CircleStop size={14} /> End Interview
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 16, paddingRight: 4, marginBottom: 16,
      }}>
        {session.questions.map((question) => {
          const answer = session.answers.find(a => a.questionId === question.id);
          return (
            <div key={question.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Interviewer bubble */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Interviewer
                  </div>
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                    borderRadius: '0 12px 12px 12px', padding: '14px 16px',
                    fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65,
                  }}>
                    {question.text}
                  </div>
                </div>
              </div>

              {/* Candidate answer bubble */}
              {answer && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                      You
                    </div>
                    <div style={{
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '12px 0 12px 12px', padding: '14px 16px',
                      fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65,
                    }}>
                      {answer.text}
                    </div>
                    {answer.feedback && (
                      <div style={{
                        marginTop: 8, padding: '10px 14px',
                        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
                        borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Feedback: </span>
                        {answer.feedback}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isGenerating && !currentQuestion && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="#fff" />
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: '0 12px 12px 12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {[0, 150, 300].map(delay => (
                <div key={delay} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)',
                  animation: 'bounce 1s infinite', animationDelay: `${delay}ms`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        background: 'var(--bg-card)', border: '1.5px solid var(--border-primary)',
        borderRadius: 14, padding: '12px 14px', flexShrink: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <textarea
          ref={textareaRef}
          value={answerText}
          onChange={e => setAnswerText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
          disabled={isGenerating}
          rows={1}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none',
            background: 'transparent', fontSize: 14, color: 'var(--text-primary)',
            fontFamily: 'inherit', lineHeight: 1.6, minHeight: 40, maxHeight: 160,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontSize: 10, border: '1px solid var(--border-primary)' }}>Enter</kbd> to send
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {recognition && (
              <button
                onClick={toggleVoice}
                disabled={isGenerating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  borderRadius: 8, border: `1px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'var(--border-primary)'}`,
                  background: isListening ? 'rgba(239,68,68,0.08)' : 'var(--bg-glass)',
                  color: isListening ? '#ef4444' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                {isListening ? 'Stop' : 'Voice'}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!answerText.trim() || isGenerating}
              className="btn btn-primary"
              style={{ padding: '7px 16px', fontSize: 13, gap: 6 }}
            >
              <Send size={13} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
