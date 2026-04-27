import { User, Sparkles, Copy, Check } from 'lucide-react';
import { useState, memo } from 'react';
import type { Message } from './types';

interface ChatMessageProps {
  message: Message;
}

export default memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown rendering
  const formatContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre
            key={index}
            style={{
              background: 'rgba(0,0,0,0.4)', color: '#e2e8f0',
              padding: '12px 14px', borderRadius: 8, overflowX: 'auto',
              margin: '8px 0', fontSize: 13, lineHeight: 1.6,
            }}
          >
            <code>{code}</code>
          </pre>
        );
      }
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part.split('\n').map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #f59e0b, #f97316)'
            : 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isUser ? <User size={16} style={{ color: 'white' }} /> : <Sparkles size={16} style={{ color: 'white' }} />}
      </div>

      {/* Bubble */}
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
          {isUser ? 'You' : 'AI Career Coach'}
        </span>

        <div style={{ position: 'relative' }} className="chat-bubble-group">
          <div
            style={{
              padding: '10px 14px', borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
              background: isUser
                ? 'var(--gradient-primary)'
                : 'var(--bg-card)',
              border: isUser ? 'none' : '1px solid var(--border-primary)',
              color: isUser ? 'white' : 'var(--text-primary)',
              fontSize: 14, lineHeight: 1.6,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {formatContent(message.content)}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="Copy message"
            style={{
              position: 'absolute', top: 6, right: isUser ? 'auto' : 6, left: isUser ? 6 : 'auto',
              background: isUser ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
              border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4,
              color: isUser ? 'white' : 'var(--text-muted)',
              opacity: 0, transition: 'opacity 0.15s',
            }}
            className="copy-btn"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>

      <style>{`
        .chat-bubble-group:hover .copy-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
});
