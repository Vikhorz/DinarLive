
import React from 'react';
import type { Translation } from '../types';

interface FooterProps {
  onAboutClick: () => void;
  onShareClick: () => void;
  shareFeedback: string;
  t: Translation;
}

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

const FooterButton: React.FC<{onClick: () => void; children: React.ReactNode; 'aria-label': string}> = ({ onClick, children, 'aria-label': ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex-1 flex items-center justify-center px-2 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
        {children}
    </button>
);


export const Footer: React.FC<FooterProps> = ({ onAboutClick, onShareClick, shareFeedback, t }) => {
  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-around gap-2">
        <FooterButton onClick={onAboutClick} aria-label={t.aboutButton}>
            <InfoIcon />
            {t.aboutButton}
        </FooterButton>

        <div className="flex-1 relative">
            <FooterButton onClick={onShareClick} aria-label={t.shareButton}>
                <ShareIcon />
                {t.shareButton}
            </FooterButton>
            {shareFeedback && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-black text-xs font-semibold rounded-md shadow-lg animate-fade-in-out">
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
