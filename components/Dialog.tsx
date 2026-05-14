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
      className="theme-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className={`theme-surface-card theme-border relative w-full ${sizeClasses[size]} overflow-hidden rounded-lg border p-6 shadow-2xl animate-scale-in sm:p-7`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="theme-text-secondary font-data text-[11px] font-black uppercase">DinarLive</p>
            <h2 id="dialog-title" className="theme-text-primary mt-1 text-xl font-black sm:text-2xl">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="theme-text-secondary theme-hover-soft rounded-lg p-2 transition-colors"
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
              className="theme-surface-inverted theme-border-strong w-full rounded-lg border px-4 py-3 font-black transition-colors"
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
