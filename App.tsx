import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useExchangeRate } from './hooks/useExchangeRate';
import { Header } from './components/Header';
import { RateDisplay } from './components/RateDisplay';
import { LastUpdated } from './components/LastUpdated';
import { Calculator } from './components/Calculator';
import { translations } from './translations';
import { ThemeToggle } from './components/ThemeToggle';
import { RateDisplaySkeleton } from './components/RateDisplaySkeleton';
import { ComparisonRates } from './components/ComparisonRates';
import { ComparisonRatesSkeleton } from './components/ComparisonRatesSkeleton';
import { useLanguage } from './hooks/useLanguage';
import { LanguageSelector } from './components/LanguageSelector';
import { Dialog } from './components/Dialog';
import { Footer } from './components/Footer';
import { StartupLoader } from './components/StartupLoader';
import { ChatDialog } from './components/ChatDialog';
import { GroundingSources } from './components/GroundingSources';
import { RateHistoryChart } from './components/RateHistoryChart';
import { RateHistoryChartSkeleton } from './components/RateHistoryChartSkeleton';
import { CurrencyInfoModal } from './components/CurrencyInfoModal';
import { BuyCurrencyModal } from './components/BuyCurrencyModal';

const CHAT_ENABLED = false;

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const PulseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </svg>
);

const SourcesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const isLargeScreen = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
};

const snapshotToneClasses = {
  amber: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-slate-900 dark:text-amber-100',
  sky: 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-500/20 dark:bg-slate-900 dark:text-sky-100',
};

const SnapshotCard: React.FC<{ title: string; value: string; subtitle: string; tone: keyof typeof snapshotToneClasses }> = ({ title, value, subtitle, tone }) => (
  <div className={`rounded-[1.6rem] border p-5 shadow-sm sm:p-6 ${snapshotToneClasses[tone]}`}>
    <p className="text-[11px] font-black text-slate-500 dark:text-slate-300">{title}</p>
    <p className="mt-2 text-3xl font-black tracking-tight sm:mt-3 sm:text-[2.35rem]" dir="ltr">
      {value}
    </p>
    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{subtitle}</p>
  </div>
);

const SectionCard: React.FC<{ title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isOpen, onToggle, children }) => (
  <section className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-6"
    >
      <div>
        <p className="text-[10px] font-black tracking-[0.12em] text-sky-600/80 dark:text-sky-300/80">DinarLive</p>
        <h2 className="mt-1.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
      </div>
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
        <ChevronIcon className={`h-6 w-6 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </span>
    </button>
    <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isOpen ? 'max-h-[960px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</div>
    </div>
  </section>
);

export default function App(): React.ReactElement {
  const { rate, sources, loading, error, refetch, rateHistory, cooldownSeconds } = useExchangeRate();

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(isLargeScreen());
  const [isChartOpen, setIsChartOpen] = useState(isLargeScreen());
  const [language, setLanguage] = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ currency: string | null; view: 'info' | 'buy' }>({ currency: null, view: 'info' });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const cooldownMessageTimerRef = useRef<number | null>(null);
  const t = translations[language];

  const iqdRateValue = useMemo(() => rate?.iqd ?? 0, [rate]);
  const officialRateValue = useMemo(() => rate?.centralBankRate ?? 1310, [rate]);
  const eurPerUsdValue = useMemo(() => rate?.eurPerUsd ?? 0, [rate]);
  const tryPerUsdValue = useMemo(() => rate?.tryPerUsd ?? 0, [rate]);
  const gbpPerUsdValue = useMemo(() => rate?.gbpPerUsd ?? 0, [rate]);
  const irtPerUsdValue = useMemo(() => rate?.irtPerUsd ?? 0, [rate]);
  const rateForDisplay = iqdRateValue * 100;
  const centralBankRateForDisplay = officialRateValue * 100;

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 360;
      setShowScrollTop((prev) => (prev === shouldShow ? prev : shouldShow));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(
    () => () => {
      if (cooldownMessageTimerRef.current) {
        clearTimeout(cooldownMessageTimerRef.current);
      }
    },
    [],
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validSources = useMemo(
    () => sources.filter((source) => source.web?.uri && source.web?.title),
    [sources],
  );

  const marketTrend = useMemo(() => {
    if (!rateHistory || rateHistory.length < 2) return undefined;

    const sortedHistory = [...rateHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestHistory = sortedHistory[sortedHistory.length - 1];
    const prevHistory = sortedHistory[sortedHistory.length - 2];
    let comparisonRate = latestHistory.rate;

    if (Math.abs(comparisonRate - rateForDisplay) < 1 && sortedHistory.length > 1) {
      comparisonRate = prevHistory.rate;
    }

    const diff = rateForDisplay - comparisonRate;
    const percentage = ((diff / comparisonRate) * 100).toFixed(2);

    return {
      direction: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
      percentage: Math.abs(parseFloat(percentage)).toString(),
    };
  }, [rateHistory, rateForDisplay]);

  const marketHighLow = useMemo(() => {
    if (!rateHistory || rateHistory.length === 0) return undefined;
    const rates = rateHistory.map((entry) => entry.rate);
    if (rateForDisplay > 0) rates.push(rateForDisplay);
    return { high: Math.max(...rates), low: Math.min(...rates) };
  }, [rateHistory, rateForDisplay]);

  const allRates = useMemo(
    () => ({
      IQD: iqdRateValue,
      USD: 1,
      EUR: eurPerUsdValue,
      TRY: tryPerUsdValue,
      GBP: gbpPerUsdValue,
      IRT: irtPerUsdValue,
    }),
    [iqdRateValue, eurPerUsdValue, tryPerUsdValue, gbpPerUsdValue, irtPerUsdValue],
  );

  const isCompletelyEmpty = loading && !rate && rateHistory.length === 0 && !error;
  const showFullScreenLoader = isCompletelyEmpty;
  const hasUsableData = Boolean(rate);

  const handleManualRefresh = async () => {
    if (loading) return;

    if (cooldownSeconds > 0) {
      setCooldownMessage(t.refreshCooldown(`${cooldownSeconds}s`));
      if (cooldownMessageTimerRef.current) {
        clearTimeout(cooldownMessageTimerRef.current);
      }
      cooldownMessageTimerRef.current = window.setTimeout(() => {
        setCooldownMessage(null);
        cooldownMessageTimerRef.current = null;
      }, 2500);
      return;
    }

    await refetch();
  };

  const handleShare = async () => {
    if (!rate) return;

    const shareText = t.shareMessage(Math.floor(rateForDisplay).toLocaleString(), centralBankRateForDisplay.toLocaleString());
    const shareData: ShareData = { title: t.headerTitle, text: shareText };
    const isShareableUrl = window.location.protocol.startsWith('http');

    if (isShareableUrl) shareData.url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      try {
        const clipboardText = isShareableUrl ? `${shareText}\n\n${window.location.href}` : shareText;
        await navigator.clipboard.writeText(clipboardText);
        setShareFeedback(t.copiedToClipboard);
        setTimeout(() => setShareFeedback(''), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  const handleCurrencySelect = (currencyCode: string) => {
    setModalState({ currency: currencyCode, view: 'info' });
  };

  const handleBuyClick = () => setModalState((prev) => ({ ...prev, view: 'buy' }));
  const handleCloseModals = () => setModalState({ currency: null, view: 'info' });

  const cityLabels = useMemo(
    () => ({
      suly: t.sulyName,
      erbil: t.erbilName,
      duhok: t.duhokName,
      regional: t.regionalRatesTitle,
    }),
    [t],
  );

  return (
    <>
      {showFullScreenLoader && <StartupLoader t={t} />}

      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[50] flex items-center justify-center">
        <nav className="pointer-events-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-2.5 shadow-lg transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 sm:p-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/25">
                <img
                  src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='48' fill='%23FBBF24' stroke='%23B45309' stroke-width='4'/%3e%3ctext x='50' y='60' font-family='Noto Kufi Arabic, sans-serif' font-size='40' font-weight='bold' fill='%23B45309' text-anchor='middle'%3eد.ع%3c/text%3e%3c/svg%3e"
                  alt="DinarLive Logo"
                  className="h-8 w-8"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">{t.appName}</p>
                <p className="truncate text-[10px] font-bold tracking-[0.08em] text-sky-700/80 dark:text-sky-300/80">{t.liveRate}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <LanguageSelector currentLang={language} onChangeLang={setLanguage} />
              <div className="mx-0.5 h-7 w-px bg-slate-200 dark:bg-slate-700 sm:mx-1" />
              <div className="relative">
                <button
                  onClick={handleManualRefresh}
                  className={`flex items-center justify-center rounded-2xl p-2.5 transition-all duration-300 shadow-sm ${
                    loading
                      ? 'bg-sky-50 text-sky-500 dark:bg-sky-900/40'
                      : cooldownSeconds > 0
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        : 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700 active:scale-95'
                  }`}
                  aria-label="Refresh rates"
                >
                  <RefreshIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {cooldownMessage && (
                  <div className="absolute right-0 top-full z-50 mt-3 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-2 text-[10px] font-bold text-white shadow-2xl dark:border-slate-700 dark:bg-white dark:text-slate-900 sm:text-xs">
                    {cooldownMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className={`min-h-screen w-full pt-24 transition-filter duration-500 ${showFullScreenLoader ? 'blur-sm' : ''}`}>
        <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 xl:grid-cols-12 xl:items-center">
              <div className="xl:col-span-7">
                <div className="mb-6 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase text-sky-700 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
                    <PulseIcon className="h-4 w-4" />
                    {t.liveRate}
                  </span>
                  {loading && !isCompletelyEmpty && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                      </span>
                      {t.updatingRates}
                    </span>
                  )}
                </div>
                <Header t={t} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:col-span-5">
                <SnapshotCard
                  title={t.marketRateLabel}
                  value={rate ? Math.floor(rateForDisplay).toLocaleString() : '--'}
                  subtitle={t.marketRateDescription}
                  tone="amber"
                />
                <SnapshotCard
                  title={t.centralBankRateLabel}
                  value={rate ? Math.floor(centralBankRateForDisplay).toLocaleString() : '--'}
                  subtitle={t.centralBankRateDescription}
                  tone="sky"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[1.8rem] border border-red-200 bg-red-50/90 p-6 text-center shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-lg font-black text-red-700 dark:text-red-200">{t.errorAfterRetriesTitle}</p>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-red-600 dark:text-red-100/80">{t.errorAfterRetriesMessage}</p>
              <button
                onClick={() => refetch()}
                className="mt-6 rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
              >
                {t.retryButton}
              </button>
            </div>
          )}

          {(hasUsableData || !error) && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
              <aside className="order-1 space-y-6 xl:col-span-5 xl:sticky xl:top-28">
                {(loading && !rate) ? (
                  <div className="space-y-4">
                    <RateDisplaySkeleton />
                    <RateDisplaySkeleton />
                  </div>
                ) : rate ? (
                  <div className="space-y-5 animate-fade-in">
                    <RateDisplay
                      value={rateForDisplay}
                      loading={loading}
                      label={t.marketRateLabel}
                      description={t.marketRateDescription}
                      currency={t.iqdCurrency}
                      cities={rate.cities}
                      cityLabels={cityLabels}
                      trend={marketTrend}
                      highLow={marketHighLow}
                      isHero={true}
                    />
                    <RateDisplay
                      value={centralBankRateForDisplay}
                      loading={loading}
                      label={t.centralBankRateLabel}
                      description={t.centralBankRateDescription}
                      currency={t.iqdCurrency}
                    />
                  </div>
                ) : null}

                {(loading && !rate) ? (
                  <ComparisonRatesSkeleton />
                ) : rate ? (
                  <ComparisonRates
                    iqdRate={iqdRateValue}
                    eurRate={eurPerUsdValue}
                    tryRate={tryPerUsdValue}
                    gbpRate={gbpPerUsdValue}
                    irtRate={irtPerUsdValue}
                    t={t}
                    onCurrencySelect={handleCurrencySelect}
                  />
                ) : null}

                {rate && (
                  <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <LastUpdated date={rate.updated} loading={loading} t={t} onRefresh={handleManualRefresh} cooldownSeconds={cooldownSeconds} />
                    </div>

                    <Footer
                      onAboutClick={() => setIsAboutOpen(true)}
                      onSourcesClick={validSources.length > 0 ? () => setIsSourcesOpen(true) : undefined}
                      onShareClick={handleShare}
                      shareFeedback={shareFeedback}
                      t={t}
                    />
                  </div>
                )}
              </aside>

              <div className="order-2 space-y-6 xl:col-span-7">
                <SectionCard title={t.rateHistoryTitle} isOpen={isChartOpen} onToggle={() => setIsChartOpen((prev) => !prev)}>
                  {(loading && rateHistory.length === 0) ? <RateHistoryChartSkeleton /> : <RateHistoryChart history={rateHistory} t={t} />}
                </SectionCard>

                {rate && (
                  <SectionCard title={t.calculatorTitle} isOpen={isCalculatorOpen} onToggle={() => setIsCalculatorOpen((prev) => !prev)}>
                    <Calculator rates={allRates} t={t} onCurrencySelect={handleCurrencySelect} />
                  </SectionCard>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <div
        className="fixed bottom-6 z-40 flex flex-col items-center gap-4 transition-all duration-500"
        style={{ right: language === 'en' ? '1.5rem' : 'auto', left: language !== 'en' ? '1.5rem' : 'auto' }}
      >
        <button
          onClick={scrollToTop}
          className={`rounded-full border border-slate-200 bg-white p-4 text-slate-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 ${
            showScrollTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>

        {CHAT_ENABLED && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`rounded-full bg-sky-600 p-4 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-sky-700 ${
              isCompletelyEmpty ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
            }`}
            aria-label="Open chat assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>

      <Dialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title={t.aboutDialogTitle} t={t} size="md">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t.aboutDialogContent}</p>
      </Dialog>

      <Dialog isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} title={t.sourcesTitle} t={t} size="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300">
              <SourcesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{t.sourcesButton}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-black text-slate-900 dark:text-white" dir="ltr">{validSources.length}</span>
                <span>{t.sourcesTitle}</span>
              </div>
            </div>
          </div>
          <GroundingSources sources={validSources} t={t} />
        </div>
      </Dialog>

      {modalState.currency && (
        <>
          <CurrencyInfoModal isOpen={modalState.view === 'info'} onClose={handleCloseModals} onBuy={handleBuyClick} currencyCode={modalState.currency} t={t} />
          <BuyCurrencyModal isOpen={modalState.view === 'buy'} onClose={handleCloseModals} currencyCode={modalState.currency} rates={allRates} t={t} />
        </>
      )}

      {CHAT_ENABLED && !isCompletelyEmpty && (
        <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} rate={rate} t={t} />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}
