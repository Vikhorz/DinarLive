import React from 'react';
import type { Translation } from '../types';
import { Spinner } from './Spinner';

interface StartupLoaderProps {
    t: Translation;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ t }) => {
    return (
        <div className="theme-surface-card fixed inset-0 z-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
            <div className="flex flex-col items-center">
                <div className="mb-24 flex items-center gap-3">
                    <div className="theme-surface-inverted theme-border-strong flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-black">د.ع</div>
                    <h1 className="theme-text-primary text-3xl font-bold tracking-tight">{t.appName}</h1>
                </div>

                <div className="flex flex-col items-center">
                    <Spinner />
                    <h2 className="theme-text-primary mt-6 text-2xl font-bold transition-colors duration-300">{t.loadingTitle}</h2>
                    <p className="theme-text-secondary mt-2 text-lg">{t.loadingSubtitle}</p>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};
