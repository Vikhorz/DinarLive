import React, { useEffect, useRef } from 'react';
import type { Translation } from '../types';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  t: Translation;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, t, footer, size = 'sm' }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/92 p-6 shadow-[0_40px_120px_-52px_rgba(15,23,42,0.95)] backdrop-blur-xl animate-scale-in dark:border-white/10 dark:bg-slate-900/92 sm:p-7`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase text-sky-600/80 dark:text-sky-300/80">DinarLive</p>
            <h2 id="dialog-title" className="mt-1 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            aria-label={t.closeButton}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto pr-1">{children}</div>

        {footer === undefined ? (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-black text-white transition-colors hover:bg-sky-700"
            >
              {t.closeButton}
            </button>
          </div>
        ) : (
          footer && <div className="mt-6 text-center">{footer}</div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.96) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }

          .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
          .animate-scale-in { animation: scaleIn 0.25s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};
