import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  const borderStyles = {
    info: 'border-blue-500/30 bg-slate-900/95 text-blue-100',
    success: 'border-emerald-500/30 bg-slate-900/95 text-emerald-100',
    warning: 'border-amber-500/30 bg-slate-900/95 text-amber-100',
    error: 'border-rose-500/30 bg-slate-900/95 text-rose-100',
  };

  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all',
        borderStyles[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex-1 pr-2">
        {title && <h5 className="text-xs font-semibold uppercase tracking-wider mb-0.5">{title}</h5>}
        <p className="text-xs text-slate-300">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss toast"
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
