import { Plus, MessageSquare, Trash2, X, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from './types';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClose: () => void;
}

export default function ChatSidebar({ conversations, currentConversationId, onSelectConversation, onNewChat, onDeleteConversation, onClose }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) { onDeleteConversation(id); setDeleteConfirmId(null); }
    else { setDeleteConfirmId(id); setTimeout(() => setDeleteConfirmId(null), 3000); }
  };

  const formatDate = (d: Date) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border-primary)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Chats</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--text-muted)', display: 'flex' }} title="Close">
            <X size={16} />
          </button>
        </div>
        <button onClick={onNewChat} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '9px 14px', gap: 6 }}>
          <Plus size={15} /> New Conversation
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
                borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <MessageSquare size={28} color="var(--accent-primary)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {searchQuery ? 'No matches' : 'No conversations yet'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {searchQuery ? 'Try a different search' : 'Start a new chat above'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(conv => {
              const isActive = currentConversationId === conv.id;
              const isDeleting = deleteConfirmId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-glass-hover)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                      {conv.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageSquare size={10} /> {conv.messages.length}</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {formatDate(conv.updatedAt)}</span>
                    </div>
                    {conv.messages.length > 0 && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {conversations.length > 0 && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-glass)', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
