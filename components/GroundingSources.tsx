import React from 'react';
import type { GroundingChunk, Translation } from '../types';

interface GroundingSourcesProps {
  sources: GroundingChunk[];
  t: Translation;
}

const LinkIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources, t }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const validSources = sources.filter((source) => source.web?.uri && source.web?.title);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {validSources.map((source, index) => {
        let host = source.web!.uri;

        try {
          host = new URL(source.web!.uri).hostname.replace(/^www\./, '');
        } catch {
          host = source.web!.uri;
        }

        return (
          <a
            key={`${source.web!.uri}-${index}`}
            href={source.web!.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col justify-between rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-sky-400/30 dark:hover:bg-slate-900"
            aria-label={`${t.sourcesTitle}: ${source.web!.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{source.web!.title}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400" dir="ltr">
                  {host}
                </p>
              </div>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
                <LinkIcon />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
              <span>{t.sourcesButton}</span>
              <span dir="ltr">#{index + 1}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
};
