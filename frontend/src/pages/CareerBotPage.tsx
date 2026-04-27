import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatInterface from '../components/chat/ChatInterface';
import type { Message, Conversation } from '../components/chat/types';
import { api } from '../api/client';
import { useToast } from '../components/ui/Toast';

const SYSTEM_PROMPT = `You are a highly intelligent AI assistant and expert career coach with deep expertise in software engineering, AI/ML, data science, product management, design, and career guidance.

Response strategy:
1. Understand user intent deeply
2. Give practical, real-world solutions - not theory
3. Provide step-by-step guidance with examples
4. Format responses with markdown: bold key points, use bullet lists, use code blocks for code
5. Be clear, confident, and practical`;

export default function CareerBotPage() {
  const { user } = useAuth();
  const userId = user?.id || user?.firebaseUser?.uid || 'anonymous';

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    try {
      setPageLoading(true);
      const data = await api.getConversations(userId, 'careerbot');

      const formatted: Conversation[] = data.map((s: any) => ({
        id: s.id,
        title: s.title || 'New Chat',
        messages: (s.messages || []).map((m: any, idx: number) => ({
          id: m.id || `${s.id}-${m.role}-${idx}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp || Date.now()),
        })),
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }));

      setConversations(formatted);

      if (formatted.length > 0) {
        setCurrentConversationId(formatted[0].id);
        setMessages(formatted[0].messages);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Could not load conversations.', 'Load Error');
    } finally {
      setPageLoading(false);
    }
  };

  const handleNewChat = async () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await api.createConversation({
        id: newConv.id,
        user_id: userId,
        bot_type: 'careerbot',
        title: newConv.title,
        messages: [],
      });
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Could not delete conversation.', 'Delete Error');
      throw err;
    }

    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);

    if (currentConversationId === id) {
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        setCurrentConversationId(null);
        setMessages([]);
        handleNewChat();
      }
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    // Ensure we have a conversation
    let convId = currentConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        await api.createConversation({ id: newConv.id, user_id: userId, bot_type: 'careerbot', title: newConv.title, messages: [] });
      } catch { /* ignore */ }
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      convId = newConv.id;
    }

    // Add user message immediately
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setChatLoading(true);

    try {
      // Build history for the API — use /careerbot/chat (OpenRouter/Groq)
      const history = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...withUser.map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await api.chatWithCareerBot(history);

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      const finalMessages = [...withUser, assistantMsg];
      setMessages(finalMessages);

      // Auto-title from first message
      const currentConv = conversations.find(c => c.id === convId) || { title: 'New Chat' };
      let title = currentConv.title;
      if (title === 'New Chat' && finalMessages.length === 2) {
        title = messageContent.trim().slice(0, 50) + (messageContent.length > 50 ? '...' : '');
      }

      // Persist to backend
      await api.updateConversation({
        id: convId,
        user_id: userId,
        bot_type: 'careerbot',
        title,
        messages: finalMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
      });

      // Update local conversations list
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, title, messages: finalMessages, updatedAt: new Date() }
            : c
        )
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error(err?.message || 'Failed to send message. Please try again.', 'Error');
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 'var(--navbar-height)', left: 'var(--sidebar-width)', right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '4px solid var(--accent-primary)', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      messages={messages}
      isLoading={chatLoading}
      onSendMessage={handleSendMessage}
      conversations={conversations}
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onDeleteConversation={handleDeleteConversation}
    />
  );
}
