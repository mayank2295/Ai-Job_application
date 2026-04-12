import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, User, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { api } from '../api/client';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

type ChatPayloadMessage = {
  role: 'user' | 'model';
  text: string;
};

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopSpeech = () => {
    if (typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const load = () => {
      try {
        const v = synth.getVoices();
        if (Array.isArray(v) && v.length > 0) setVoices(v);
      } catch {
        // ignore
      }
    };

    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, []);

  const pickVoice = (available: SpeechSynthesisVoice[]) => {
    const list = available ?? [];
    if (list.length === 0) return undefined;

    // Best-effort voice selection.
    // Exact voice names vary by OS/browser; we try to pick a clear English voice.
    const preferredNameHints = [
      'aria',
      'jenny',
      'guy',
      'davis',
      'zira',
      'susan',
      'samantha',
      'victoria',
      'natural',
      'neural',
      'google uk english female',
      'google us english',
      'microsoft',
    ];

    const byLang = list.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
    const pool = byLang.length > 0 ? byLang : list;

    const preferLocal = pool.filter(v => v.localService);
    const pool2 = preferLocal.length > 0 ? preferLocal : pool;

    const defaults = pool2.filter(v => v.default);
    const pool3 = defaults.length > 0 ? defaults : pool2;

    const best = pool3.find(v => {
      const n = (v.name || '').toLowerCase();
      return preferredNameHints.some(h => n.includes(h));
    });

    return best ?? pool3[0];
  };

  const chunkForSpeech = (text: string) => {
    const cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\s([,.;:!?])/g, '$1')
      .trim();

    if (!cleaned) return [] as string[];

    // Split into sentence-like chunks to improve clarity at higher rates.
    const sentences = cleaned.split(/(?<=[.!?])\s+/g);
    const chunks: string[] = [];
    let current = '';
    const maxLen = 220;

    for (const s of sentences) {
      const part = s.trim();
      if (!part) continue;

      const candidate = current ? `${current} ${part}` : part;
      if (candidate.length <= maxLen) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        if (part.length <= maxLen) {
          current = part;
        } else {
          // Hard wrap very long text.
          for (let i = 0; i < part.length; i += maxLen) {
            chunks.push(part.slice(i, i + maxLen));
          }
          current = '';
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  };

  const speak = (rawText: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (!ttsEnabled) return;

    const text = String(rawText)
      .replace(/`+/g, '')
      .replace(/\*\*/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return;

    // Avoid extremely long monologues.
    const clipped = text.length > 700 ? text.slice(0, 700) + '…' : text;

    try {
      synth.cancel();
      const v = pickVoice(voices.length > 0 ? voices : synth.getVoices());
      const chunks = chunkForSpeech(clipped);
      const lang = v?.lang || 'en-US';

      for (const piece of chunks) {
        const utterance = new SpeechSynthesisUtterance(piece);
        // “Fast + accurate” defaults.
        utterance.rate = 1.18;
        utterance.pitch = 0.98;
        utterance.volume = 1;
        utterance.lang = lang;
        if (v) utterance.voice = v;
        synth.speak(utterance);
      }
    } catch {
      // ignore TTS failures
    }
  };

  useEffect(() => {
    // Stop speaking if user disables voice.
    if (!ttsEnabled) stopSpeech();
  }, [ttsEnabled]);

  useEffect(() => {
    // Stop speaking when widget closes.
    if (!open) stopSpeech();
  }, [open]);

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

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
        .map((m) => ({ role: m.role, text: m.text } satisfies ChatPayloadMessage));

      const allMessages: ChatPayloadMessage[] = [
        ...historyToSent,
        { role: 'user', text: userText },
      ];

      const { text: aiText } = await api.chatWithAI(allMessages);

      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        role: 'model',
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Speak the AI response (browser built-in TTS).
      speak(aiText);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const errMsg: Message = {
        id: Date.now().toString() + '-err',
        role: 'model',
        text: `⚠️ Sorry, something went wrong: ${message}. Please try again.`,
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
            background: 'var(--gradient-primary)',
            border: '1px solid var(--border-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-xl)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-lg)';
          }}
          title="AI helper"
          aria-label="Open AI helper"
        >
          <Bot size={26} color="white" />
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
            width: minimized ? 320 : 360,
            height: minimized ? 56 : 520,
            borderRadius: 20,
            background: 'var(--navbar-bg)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'color-mix(in srgb, var(--bg-secondary) 75%, transparent)',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-md)',
            }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>AI Assistant</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ask anything about the app</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setTtsEnabled((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6, borderRadius: 8 }}
                title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
              >
                {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setMinimized((m) => !m)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6, borderRadius: 8 }}
                title={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => { stopSpeech(); setOpen(false); setMinimized(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6, borderRadius: 8 }}
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
                scrollbarColor: 'color-mix(in srgb, var(--accent-primary) 40%, transparent) transparent',
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                      animation: 'ai-msg-in 0.18s ease-out',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: msg.role === 'model' ? 'var(--gradient-primary)' : 'var(--bg-glass)',
                        border: '1px solid var(--border-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {msg.role === 'model' ? (
                        <Bot size={14} color="white" />
                      ) : (
                        <User size={14} color="var(--text-primary)" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '10px 12px',
                        borderRadius: msg.role === 'user' ? '14px 6px 14px 14px' : '6px 14px 14px 14px',
                        background: msg.role === 'user' ? 'var(--gradient-primary)' : 'var(--bg-glass)',
                        border: '1px solid var(--border-primary)',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {formatMessage(msg.text)}
                      <div
                        style={{
                          fontSize: 10,
                          color: 'color-mix(in srgb, var(--text-secondary) 70%, transparent)',
                          marginTop: 4,
                          textAlign: msg.role === 'user' ? 'right' : 'left',
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        border: '1px solid var(--border-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={14} color="white" />
                    </div>
                    <div
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px 14px 14px 14px',
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      Thinking…
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--border-primary)',
                background: 'color-mix(in srgb, var(--bg-secondary) 70%, transparent)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <button
                  onClick={handleReset}
                  title="Start over"
                  style={{
                    background: 'none', border: '1px solid var(--border-primary)',
                    borderRadius: 8, color: '#64748b', cursor: 'pointer',
                    padding: '9px', flexShrink: 0, display: 'flex',
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
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 10,
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--border-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-primary)')}
                />
                <button
                  id="ai-assistant-send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: input.trim() && !loading
                      ? 'var(--gradient-primary)'
                      : 'color-mix(in srgb, var(--accent-primary) 18%, transparent)',
                    border: 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: input.trim() && !loading ? 'var(--shadow-md)' : 'none',
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
        @keyframes ai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
