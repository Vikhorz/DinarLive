import React from 'react';
import type { Translation } from '../types';

interface FooterProps {
  onAboutClick: () => void;
  onShareClick: () => void;
  onSourcesClick?: () => void;
  shareFeedback: string;
  t: Translation;
}

const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const SourcesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const FooterButton: React.FC<{ onClick: () => void; children: React.ReactNode; ariaLabel: string }> = ({ onClick, children, ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className="theme-surface-muted theme-border theme-text-primary flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition-all duration-200 hover:-translate-y-0.5"
  >
    {children}
  </button>
);

export const Footer: React.FC<FooterProps> = ({ onAboutClick, onShareClick, onSourcesClick, shareFeedback, t }) => {
  const columnsClass = onSourcesClick ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <div className="theme-border mt-6 border-t pt-4 transition-colors duration-300">
      <div className={`grid grid-cols-1 gap-3 ${columnsClass}`}>
        <FooterButton onClick={onAboutClick} ariaLabel={t.aboutButton}>
          <InfoIcon />
          {t.aboutButton}
        </FooterButton>

        {onSourcesClick && (
          <FooterButton onClick={onSourcesClick} ariaLabel={t.sourcesButton}>
            <SourcesIcon />
            {t.sourcesButton}
          </FooterButton>
        )}

        <div className="relative">
          <FooterButton onClick={onShareClick} ariaLabel={t.shareButton}>
            <ShareIcon />
            {t.shareButton}
          </FooterButton>
          {shareFeedback && (
            <div className="theme-tooltip absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border px-3 py-1 text-xs font-bold shadow-lg animate-fade-in-out">
              {shareFeedback}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};
