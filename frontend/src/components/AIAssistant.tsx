import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, User, ChevronDown } from 'lucide-react';
import { api } from '../api/client';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "👋 Hi! I'm your simple AI Chatbot. How can I assist you today?",
  timestamp: new Date(),
};

function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < part.split('\n').length - 1 && <br />}
      </span>
    ));
  });
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPulse(false);
    }
  }, [open, minimized]);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 10000);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyToSent = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const allMessages = [
        ...historyToSent,
        { role: 'user', text: userText },
      ];

      const { text: aiText } = await api.chatWithAI(allMessages as any);

      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        role: 'model',
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now().toString() + '-err',
        role: 'model',
        text: `⚠️ Sorry, something went wrong: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          id="ai-assistant-btn"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.5)',
            zIndex: 9999,
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: pulse ? 'ai-pulse 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.7)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.5)';
          }}
          title="Open AI Chatbot"
        >
          <Sparkles size={26} color="white" />
          {pulse && (
            <span style={{
              position: 'absolute',
              top: -3, right: -3,
              width: 16, height: 16,
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #0f172a',
              animation: 'ai-dot-pulse 1.5s ease-in-out infinite',
            }} />
          )}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          id="ai-assistant-panel"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: minimized ? 320 : 400,
            height: minimized ? 60 : 600,
            borderRadius: 20,
            background: 'linear-gradient(180deg, #0f1629 0%, #0d1117 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
            borderBottom: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>AI Chatbot</div>
              <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Online
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setMinimized((m) => !m)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6 }}
                title={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => { setOpen(false); setMinimized(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6 }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.3) transparent',
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                      animation: 'ai-msg-in 0.3s ease-out',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: msg.role === 'model'
                        ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                        : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: msg.role === 'model'
                        ? '0 2px 8px rgba(99,102,241,0.4)'
                        : '0 2px 8px rgba(14,165,233,0.4)',
                    }}>
                      {msg.role === 'model'
                        ? <Bot size={14} color="white" />
                        : <User size={14} color="white" />}
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'model' ? '1px solid rgba(99,102,241,0.15)' : 'none',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      boxShadow: msg.role === 'user'
                        ? '0 4px 12px rgba(99,102,241,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      {formatMessage(msg.text)}
                      <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={14} color="white" />
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: '4px 16px 16px 16px',
                      display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#6366f1',
                          animation: `ai-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          display: 'inline-block',
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid rgba(99,102,241,0.15)',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <button
                  onClick={handleReset}
                  title="Start over"
                  style={{
                    background: 'none', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8, color: '#64748b', cursor: 'pointer',
                    padding: '8px', flexShrink: 0, display: 'flex',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  <ChevronDown size={14} />
                </button>
                <input
                  ref={inputRef}
                  id="ai-assistant-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 10,
                    padding: '9px 12px',
                    color: '#e2e8f0',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.2)')}
                />
                <button
                  id="ai-assistant-send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: input.trim() && !loading
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(99,102,241,0.15)',
                    border: 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: input.trim() && !loading ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={16} color={input.trim() && !loading ? 'white' : '#4a5568'} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Global animations */}
      <style>{`
        @keyframes ai-pulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.5); }
          50% { box-shadow: 0 8px 48px rgba(99,102,241,0.8), 0 0 0 8px rgba(99,102,241,0.1); }
        }
        @keyframes ai-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes ai-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes ai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
