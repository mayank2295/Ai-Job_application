import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, Menu, Sparkles, Plus, MessageSquare, Trash2, Search, X, Clock } from 'lucide-react';
import ChatMessage from './ChatMessage';
import type { Message, Conversation } from './types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => Promise<void>;
  conversations?: Conversation[];
  currentConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: (id: string) => void;
}

export default function ChatInterface({
  messages,
  isLoading = false,
  onSendMessage,
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput('');
    try {
      await onSendMessage(content);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e: any) => setInput(prev => prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteConversation?.(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const formatDate = (date: Date) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const prompts = [
    { title: 'Resume Review', desc: 'Get feedback on your resume', msg: 'Can you review my resume and give me feedback?' },
    { title: 'Interview Prep', desc: 'Practice common questions', msg: 'Help me prepare for a software engineering interview.' },
    { title: 'Career Advice', desc: 'Explore career paths', msg: 'What career paths are available for a software developer?' },
    { title: 'Job Search Tips', desc: 'Find opportunities', msg: 'How can I find the best job opportunities in tech?' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--navbar-height)',
        left: 'var(--sidebar-width)',
        right: 0,
        bottom: 0,
        display: 'flex',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Conversations Sidebar ── */}
      {showSidebar && (
        <div
          style={{
            width: 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} style={{ color: 'var(--accent-primary-light)' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Chats</span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', borderRadius: 6 }}
                title="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={() => onNewChat?.()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--gradient-primary)', color: 'white',
                fontWeight: 600, fontSize: 13, width: '100%',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}
            >
              <Plus size={16} />
              New Conversation
            </button>
          </div>

          {/* Search */}
          {conversations.length > 0 && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  style={{
                    width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {searchQuery ? 'No matches' : 'No conversations yet'}
                </p>
                <p style={{ fontSize: 12 }}>{searchQuery ? 'Try a different search' : 'Start a new chat above'}</p>
              </div>
            ) : (
              filtered.map(conv => {
                const isActive = currentConversationId === conv.id;
                const isDeleting = deleteConfirmId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation?.(conv.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                      background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass-hover)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, marginBottom: 3,
                        color: isActive ? 'var(--accent-primary-light)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {conv.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        <span>{formatDate(conv.updatedAt)}</span>
                        <span>·</span>
                        <MessageSquare size={10} />
                        <span>{conv.messages.length}</span>
                      </div>
                      {conv.messages.length > 0 && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.messages[conv.messages.length - 1].content}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(conv.id); }}
                      title={isDeleting ? 'Click again to confirm' : 'Delete'}
                      style={{
                        background: isDeleting ? 'rgba(244,63,94,0.15)' : 'none',
                        border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0,
                        color: isDeleting ? 'var(--accent-rose)' : 'var(--text-muted)',
                        opacity: isDeleting ? 1 : 0.5, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                      onMouseLeave={e => { if (!isDeleting) (e.currentTarget as HTMLElement).style.opacity = '0.5'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {conversations.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-primary)', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Main Chat Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-secondary)', borderRadius: 6 }}
              title="Show sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <div style={{
            width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: 'var(--shadow-glow-sm)',
          }}>
            <Sparkles size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI Career Coach</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Your intelligent career assistant</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
            <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', maxWidth: 560 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', boxShadow: 'var(--shadow-glow)',
                }}>
                  <Sparkles size={36} style={{ color: 'white' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Welcome to AI Career Coach
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
                  I'm here to help with your career journey. Try one of these to get started:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {prompts.map(p => (
                    <button
                      key={p.title}
                      onClick={() => { setInput(p.msg); textareaRef.current?.focus(); }}
                      style={{
                        padding: '14px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        background: 'var(--bg-card)', border: '1px solid var(--border-primary)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Sparkles size={16} style={{ color: 'white' }} />
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)',
                        animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 24px 16px', borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)', flexShrink: 0,
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 12, padding: '8px 12px', boxShadow: 'var(--shadow-sm)',
            }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach file"
                style={{ background: 'none', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', padding: 6, color: 'var(--text-muted)', borderRadius: 6, flexShrink: 0, opacity: isLoading ? 0.5 : 1 }}
              >
                <Paperclip size={18} />
              </button>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple accept=".pdf,.doc,.docx,.txt" />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask me anything about your career... (Shift+Enter for new line)"
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 14, color: 'var(--text-primary)',
                  minHeight: 40, maxHeight: 150, padding: '8px 4px',
                  fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />

              <button
                onClick={toggleVoice}
                disabled={isLoading}
                title={isListening ? 'Stop listening' : 'Voice input'}
                style={{
                  background: isListening ? 'rgba(244,63,94,0.15)' : 'none',
                  border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  padding: 6, borderRadius: 6, flexShrink: 0,
                  color: isListening ? 'var(--accent-rose)' : 'var(--text-muted)',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  background: input.trim() && !isLoading ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                  border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  padding: '8px 16px', borderRadius: 8, flexShrink: 0,
                  color: input.trim() && !isLoading ? 'white' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: input.trim() && !isLoading ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <Send size={15} />
                Send
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Press{' '}
              <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontSize: 10, border: '1px solid var(--border-primary)' }}>Enter</kbd>
              {' '}to send,{' '}
              <kbd style={{ background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, fontSize: 10, border: '1px solid var(--border-primary)' }}>Shift+Enter</kbd>
              {' '}for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
