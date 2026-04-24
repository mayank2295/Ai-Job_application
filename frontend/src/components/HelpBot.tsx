import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
// @ts-ignore
import { callLLM, renderMarkdown, loadSessions, saveSession, createSession } from '../lib/careerbot-api';
import { useAuth } from '../context/AuthContext';

const SYSTEM_PROMPT = `You are a friendly help assistant for the JobFlow AI platform. You help users navigate the app, explain features, and answer questions about:
- Career Bot: AI chat, ATS resume analysis, course finder
- Job Applications: submitting, tracking status
- Workflows: Power Automate integrations
- Settings: configuration options
Be very concise (2-3 sentences max). Use markdown formatting.`;

const QUICK_CHIPS = [
  "What can CareerBot do?",
  "How to analyze my resume?",
  "How to find courses?",
  "How do workflows work?",
  "How to submit an application?",
];

export default function HelpBot() {
  const { user } = useAuth();
  const userId = user?.id || user?.firebaseUser?.uid || 'anonymous';

  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const s = await loadSessions(userId, 'helpbot');
      if (s.length > 0) {
        setSession(s[0]);
        setMessages(s[0].messages);
        if (s[0].messages.length > 1) setShowChips(false);
      } else {
        const newSess = createSession('Help Assistant Chat');
        const initialMsg = { role: 'assistant', content: '👋 Hi! I\'m your help assistant. Ask me anything about the platform!', ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        newSess.messages = [initialMsg];
        setSession(newSess);
        setMessages([initialMsg]);
        await saveSession(userId, newSess, 'helpbot');
      }
    }
    init();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const updateSessionMessages = async (newMsgs: any[]) => {
    setMessages(newMsgs);
    if (session) {
      const updated = { ...session, messages: newMsgs, updatedAt: new Date().toISOString() };
      setSession(updated);
      await saveSession(userId, updated, 'helpbot');
    }
  };

  const sendMessage = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: userText, ts };
    const next = [...messages, userMsg];
    await updateSessionMessages(next);
    setInput('');
    setLoading(true);
    setShowChips(false);

    try {
      const history = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...next.map(({ role, content }) => ({ role, content })),
      ];
      const data = await callLLM(history);
      const reply = data.choices[0].message.content || '';
      await updateSessionMessages([...next, { role: 'assistant', content: reply, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e: any) {
      await updateSessionMessages([...next, { role: 'assistant', content: `⚠️ Error: ${e.message}`, ts }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className="help-bot-btn" onClick={() => setOpen(true)} title="Help">
        <HelpCircle size={24} color="white" />
      </button>
    );
  }

  return (
    <div className="help-bot-panel">
      {/* Header */}
      <div className="help-bot-header">
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HelpCircle size={16} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Help Assistant</div>
          <div style={{ fontSize: 11, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} />AI Powered
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="help-bot-messages">
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 8, animation: 'cb-fadeUp 0.2s ease' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
              background: m.role === 'assistant' ? 'var(--gradient-accent)' : 'var(--bg-tertiary)',
              color: m.role === 'assistant' ? 'white' : 'var(--text-secondary)',
              border: m.role === 'user' ? '1px solid var(--border-primary)' : 'none',
            }}>
              {m.role === 'assistant' ? '?' : '👤'}
            </div>
            <div style={{
              maxWidth: '80%', padding: '9px 13px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-primary)',
              background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-card)',
              border: m.role === 'assistant' ? '1px solid var(--border-primary)' : 'none',
              ...(m.role === 'user' ? { color: 'white' } : {}),
            }} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11 }}>?</div>
            <div className="cb-typing-dots" style={{ padding: '10px 14px' }}><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      {showChips && (
        <div className="help-bot-chips">
          {QUICK_CHIPS.map(c => (
            <button key={c} className="help-bot-chip" onClick={() => sendMessage(c)}>{c}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="help-bot-input-area">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about the platform…" disabled={loading} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
          width: 34, height: 34, borderRadius: 8, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
          background: input.trim() && !loading ? 'var(--gradient-accent)' : 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          opacity: input.trim() && !loading ? 1 : 0.4,
        }}>
          <Send size={14} color={input.trim() && !loading ? 'white' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  );
}
