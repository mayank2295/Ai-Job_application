import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { X, CircleCheck, CircleAlert, TriangleAlert, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; type: ToastType; title?: string; message: string; duration?: number; }

interface ToastContextValue {
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(p => [...p, { ...toast, id }]);
    const dur = toast.duration !== undefined ? toast.duration : (toast.type === 'error' ? 0 : 3000);
    if (dur > 0) setTimeout(() => removeToast(id), dur);
  }, [removeToast]);

  const success = useCallback((m: string, t?: string) => addToast({ type: 'success', message: m, title: t }), [addToast]);
  const error   = useCallback((m: string, t?: string) => addToast({ type: 'error',   message: m, title: t }), [addToast]);
  const warning = useCallback((m: string, t?: string) => addToast({ type: 'warning', message: m, title: t }), [addToast]);
  const info    = useCallback((m: string, t?: string) => addToast({ type: 'info',    message: m, title: t }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const TOAST_CONFIG = {
  success: { Icon: CircleCheck, accent: '#10b981', titleColor: '#065f46' },
  error:   { Icon: CircleAlert,  accent: '#ef4444', titleColor: '#7f1d1d' },
  warning: { Icon: TriangleAlert,accent: '#f59e0b', titleColor: '#78350f' },
  info:    { Icon: Info,         accent: '#6366f1', titleColor: '#312e81' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);

  const dismiss = () => { setVisible(false); setTimeout(() => onRemove(toast.id), 200); };
  const { Icon, accent, titleColor } = TOAST_CONFIG[toast.type];

  return (
    <div
      role="alert"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        maxWidth: 360, padding: '14px 16px', borderRadius: 12,
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
      }}
    >
      <Icon size={18} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && <p style={{ fontSize: 13, fontWeight: 700, color: titleColor, marginBottom: 2 }}>{toast.title}</p>}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{toast.message}</p>
      </div>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', flexShrink: 0, display: 'flex', borderRadius: 4 }} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
