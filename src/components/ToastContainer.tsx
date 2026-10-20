import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../core/blocopy-controller.js';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCopied = toast.type === 'copied';
        const isWarn = toast.type === 'warn';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 ${
              isCopied
                ? 'bg-slate-900/95 text-white border-slate-800'
                : isWarn
                ? 'bg-amber-900/95 text-white border-amber-800'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-800'
                : 'bg-slate-800/95 text-white border-slate-700'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isCopied && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isWarn && <AlertCircle className="w-4 h-4 text-amber-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isCopied && !isWarn && !isError && <Info className="w-4 h-4 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight">{toast.message}</p>
              {toast.subtext && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.subtext}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
