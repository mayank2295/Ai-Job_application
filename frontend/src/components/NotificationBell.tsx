import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRealTimeNotifications, useReputationUpdates } from '../hooks/useSocket';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
};

const TYPE_COLOR: Record<string, string> = {
  success: 'var(--accent-emerald)',
  error: 'var(--accent-rose)',
  info: 'var(--accent-primary)',
};

// Extract application ID from notification message if present
function getAppLink(message: string, isAdmin: boolean): string | null {
  // Notifications about applications — link to my-applications for candidates
  if (message.toLowerCase().includes('application')) {
    return isAdmin ? '/admin/applications' : '/my-applications';
  }
  return null;
}

export default function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || user?.firebaseUser?.uid;
  const unread = notifications.filter((n) => !n.is_read).length;

  const load = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/notifications?user_id=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

  // Real-time: instantly add notification when socket fires
  const handleRealTime = useCallback((data: any) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Application Update',
      message: data.message || `Your application for ${data.position} has been updated to: ${data.newStatus}`,
      type: data.newStatus === 'accepted' ? 'success' : data.newStatus === 'rejected' ? 'error' : 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  useRealTimeNotifications(handleRealTime);

  // Real-time: reputation score updated after quiz/interview
  const handleReputationUpdate = useCallback((data: any) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Reputation Updated',
      message: `Your reputation score has been updated to ${data.score ?? ''}`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  useReputationUpdates(handleReputationUpdate);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/admin/notifications/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unread > 0) markAllRead();
  };

  const handleNotificationClick = (n: Notification) => {
    const link = getAppLink(n.message, isAdmin);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button className="navbar-icon-btn" title="Notifications" onClick={handleOpen} style={{ position: 'relative' }}>
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-rose)',
            border: '1.5px solid var(--bg-primary)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320, maxHeight: 420, overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 1000,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Notifications {unread > 0 && <span style={{ fontSize: 11, background: 'var(--accent-rose)', color: 'white', borderRadius: 10, padding: '1px 6px', marginLeft: 4 }}>{unread}</span>}
            </span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => {
              const link = getAppLink(n.message, isAdmin);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-primary)',
                    background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.04)',
                    cursor: link ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (link) e.currentTarget.style.background = 'var(--bg-glass-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(99,102,241,0.04)'; }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: n.is_read ? 'var(--border-primary)' : TYPE_COLOR[n.type] || TYPE_COLOR.info,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {link && <span style={{ fontSize: 11, color: 'var(--accent-primary)' }}>View -&gt;</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
