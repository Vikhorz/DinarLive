
import React, { useState, useRef, useEffect } from 'react';
import type { Language } from '../hooks/useLanguage';

interface LanguageSelectorProps {
  currentLang: Language;
  onChangeLang: (lang: Language) => void;
}

const languages: { code: Language; name: string; isRtl?: boolean }[] = [
  { code: 'ku', name: 'کوردی', isRtl: true },
  { code: 'ar', name: 'العربية', isRtl: true },
  { code: 'en', name: 'English' },
];

const EarthIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a13 13 0 000 18M12 3a13 13 0 010 18" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onChangeLang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const currentLanguageDetails = languages.find(l => l.code === currentLang);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageSelect = (langCode: Language) => {
        onChangeLang(langCode);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative z-20">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Select language"
            >
                <EarthIcon />
                <span className={`text-sm font-semibold ${currentLanguageDetails?.isRtl ? 'font-noto-kufi-arabic' : ''}`}>
                    {currentLanguageDetails?.name}
                </span>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-40 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-150 ease-out animate-scale-in"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {languages.map(({ code, name, isRtl }) => (
                            <button
                                key={code}
                                onClick={() => handleLanguageSelect(code)}
                                className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm ${
                                    currentLang === code
                                        ? 'font-bold text-sky-600 dark:text-sky-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${isRtl ? 'font-noto-kufi-arabic' : ''}`}
                                role="menuitem"
                            >
                                <span>{name}</span>
                                {currentLang === code && <CheckIcon />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
              @keyframes scaleIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-scale-in { animation: scaleIn 0.1s ease-out forwards; }
            `}</style>
        </div>
    );
};
