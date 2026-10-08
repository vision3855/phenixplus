import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle2 size={18} color="var(--success)" />,
  error: <XCircle size={18} color="var(--danger)" />,
  warning: <AlertTriangle size={18} color="var(--warning)" />,
  info: <CheckCircle2 size={18} color="var(--info)" />,
};

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      const timer = timers.current.get(id);
      if (timer) { clearTimeout(timer); timers.current.delete(id); }
    }, 180);
  }, []);

  const push = useCallback((type, message, ttl = 4200) => {
    const id = ++idSeq;
    setToasts((ts) => [...ts, { id, type, message }]);
    timers.current.set(id, setTimeout(() => dismiss(id), ttl));
  }, [dismiss]);

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    warning: (m) => push('warning', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? 'leaving' : ''}`}>
            {ICONS[t.type] || ICONS.info}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button className="btn-ghost btn btn-sm" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
