
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

const isLargeScreen = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
};

export default function App(): React.ReactElement {
  const { rate, sources, loading, error, refetch, rateHistory, cooldownSeconds } = useExchangeRate();
  
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(isLargeScreen());
  const [isChartOpen, setIsChartOpen] = useState(isLargeScreen());
  const [language, setLanguage] = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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

  // Scroll visibility handler
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 400;
      setShowScrollTop(prev => (prev === shouldShow ? prev : shouldShow));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => () => {
    if (cooldownMessageTimerRef.current) {
      clearTimeout(cooldownMessageTimerRef.current);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'neutral' as const,
        percentage: Math.abs(parseFloat(percentage)).toString()
    };
  }, [rateHistory, rateForDisplay]);

  const marketHighLow = useMemo(() => {
      if (!rateHistory || rateHistory.length === 0) return undefined;
      const rates = rateHistory.map(r => r.rate);
      if (rateForDisplay > 0) rates.push(rateForDisplay);
      return { high: Math.max(...rates), low: Math.min(...rates) };
  }, [rateHistory, rateForDisplay]);

  // Fix: Corrected typo '1rtPerUsdValue' to 'irtPerUsdValue'
  const allRates = useMemo(() => ({
    IQD: iqdRateValue,
    USD: 1,
    EUR: eurPerUsdValue,
    TRY: tryPerUsdValue,
    GBP: gbpPerUsdValue,
    IRT: irtPerUsdValue,
  }), [iqdRateValue, eurPerUsdValue, tryPerUsdValue, gbpPerUsdValue, irtPerUsdValue]);

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
      try { await navigator.share(shareData); } catch (err) { if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err); }
    } else {
      try {
        const clipboardText = isShareableUrl ? `${shareText}\n\n${window.location.href}` : shareText;
        await navigator.clipboard.writeText(clipboardText);
        setShareFeedback(t.copiedToClipboard);
        setTimeout(() => setShareFeedback(''), 2000);
      } catch (err) { console.error('Error copying to clipboard:', err); }
    }
  };
  
  const handleCurrencySelect = (currencyCode: string) => {
    setModalState({ currency: currencyCode, view: 'info' });
  };
  const handleBuyClick = () => setModalState(prev => ({ ...prev, view: 'buy' }));
  const handleCloseModals = () => setModalState({ currency: null, view: 'info' });

  const cityLabels = useMemo(() => ({
    suly: t.sulyName,
    erbil: t.erbilName,
    duhok: t.duhokName,
    regional: t.regionalRatesTitle
  }), [t]);

  return (
    <>
      {showFullScreenLoader && <StartupLoader t={t} />}

      {/* Sticky Top Navbar with Glass Effect */}
      <div className="fixed top-0 left-0 right-0 z-[50] flex items-center justify-center pointer-events-none">
        <nav className="w-full max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 pointer-events-auto">
          <div className="flex justify-between items-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 p-2.5 sm:p-3 rounded-2xl shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='48' fill='%23FBBF24' stroke='%23B45309' stroke-width='4'/%3e%3ctext x='50' y='60' font-family='Noto Kufi Arabic, sans-serif' font-size='40' font-weight='bold' fill='%23B45309' text-anchor='middle'%3eد.ع%3c/text%3e%3c/svg%3e" alt="DinarLive Logo" className="h-7 w-7 sm:h-10 sm:w-10" />
                <span className="text-base sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.appName}</span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <LanguageSelector currentLang={language} onChangeLang={setLanguage} />
              <div className="w-[1px] h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1"></div>
              <div className="relative">
                  <button 
                    onClick={handleManualRefresh} 
                    className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center ${loading ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-500' : cooldownSeconds > 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95 shadow-md'}`}
                    aria-label="Refresh rates"
                  >
                  <RefreshIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  {cooldownMessage && (
                      <div className="absolute top-full right-0 mt-3 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-[10px] sm:text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap animate-fade-in z-50 border border-gray-700 dark:border-gray-300">
                          {cooldownMessage}
                      </div>
                  )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className={`min-h-screen w-full transition-filter duration-500 pt-20 ${showFullScreenLoader ? 'blur-sm' : ''}`}>
        <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          
          <header className="mb-10 flex flex-col gap-6">
            <div className="flex items-center justify-center">
                 {loading && !isCompletelyEmpty && (
                     <div className="flex items-center gap-2.5 px-6 py-2 bg-white/80 dark:bg-sky-900/20 rounded-full border border-sky-100 dark:border-sky-800 shadow-lg animate-pulse backdrop-blur-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-[0.2em]">{t.updatingRates}</span>
                     </div>
                 )}
            </div>
          </header>

          {error && (
            <div className="my-6 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-6 rounded-2xl animate-fade-in max-w-2xl mx-auto shadow-lg">
                <p className="text-lg font-semibold">{t.errorAfterRetriesTitle}</p>
                <p className="mt-2">{t.errorAfterRetriesMessage}</p>
                <button onClick={() => refetch()} className="mt-6 px-6 py-2.5 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors">
                    {t.retryButton}
                </button>
            </div>
          )}

          {(hasUsableData || !error) && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-8">
                    <Header t={t} />
                    {(loading && !rate) ? (
                        <div className="space-y-4">
                            <RateDisplaySkeleton />
                            <RateDisplaySkeleton />
                        </div>
                    ) : rate && (
                        <div className="space-y-8 animate-fade-in">
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
                    )}
                </div>
                
                <div>
                    {(loading && !rate) ? (
                        <ComparisonRatesSkeleton />
                    ) : rate && (
                        <ComparisonRates 
                            iqdRate={iqdRateValue}
                            eurRate={eurPerUsdValue}
                            tryRate={tryPerUsdValue}
                            gbpRate={gbpPerUsdValue}
                            irtRate={irtPerUsdValue}
                            t={t}
                            onCurrencySelect={handleCurrencySelect}
                        />
                    )}
                </div>

                {rate && (
                    <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 animate-fade-in border border-gray-100 dark:border-gray-700/50">
                        <LastUpdated date={rate.updated} loading={loading} t={t} onRefresh={handleManualRefresh} cooldownSeconds={cooldownSeconds} />
                        {sources.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            <p className="mb-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                              {t.sourcesTitle}
                            </p>
                            <GroundingSources sources={sources} t={t} />
                          </div>
                        )}
                        <Footer onAboutClick={() => setIsAboutOpen(true)} onShareClick={handleShare} shareFeedback={shareFeedback} t={t} />
                    </div>
                )}
              </div>

              <div className="lg:col-span-3 space-y-10">
                <div className="space-y-4">
                    <button 
                        onClick={() => setIsChartOpen(prev => !prev)} 
                        className="w-full flex items-center justify-between p-5 px-6 rounded-2xl bg-gray-200/50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-300/30 dark:border-gray-700 shadow-sm"
                    >
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.rateHistoryTitle}</h2>
                        <ChevronIcon className={`w-6 h-6 text-sky-500 transition-transform duration-500 ${isChartOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isChartOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {(loading && rateHistory.length === 0) ? <RateHistoryChartSkeleton /> : <RateHistoryChart history={rateHistory} t={t} />}
                    </div>
                </div>

                {rate && (
                    <div className="space-y-4 animate-fade-in">
                        <button 
                            onClick={() => setIsCalculatorOpen(prev => !prev)} 
                            className="w-full flex items-center justify-between p-5 px-6 rounded-2xl bg-gray-200/50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-300/30 dark:border-gray-700 shadow-sm"
                        >
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.calculatorTitle}</h2>
                            <ChevronIcon className={`w-6 h-6 text-sky-500 transition-transform duration-500 ${isCalculatorOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isCalculatorOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <Calculator rates={allRates} t={t} onCurrencySelect={handleCurrencySelect} />
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Buttons: Scroll Top & Chat */}
      <div className="fixed bottom-6 flex flex-col items-center gap-4 z-40 transition-all duration-500" style={{ right: language === 'en' ? '1.5rem' : 'auto', left: language !== 'en' ? '1.5rem' : 'auto' }}>
        <button
          onClick={scrollToTop}
          className={`p-4 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-white shadow-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all duration-300 border border-gray-200 dark:border-gray-700 ${showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
        
        <button
          onClick={() => setIsChatOpen(true)}
          className={`p-4 rounded-full bg-sky-600 text-white shadow-xl hover:bg-sky-700 active:bg-sky-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${isCompletelyEmpty ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
          aria-label="Open chat assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      <Dialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title={t.aboutDialogTitle} t={t}>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line text-center leading-relaxed">{t.aboutDialogContent}</p>
      </Dialog>
      
      {modalState.currency && (
        <>
          <CurrencyInfoModal isOpen={modalState.view === 'info'} onClose={handleCloseModals} onBuy={handleBuyClick} currencyCode={modalState.currency} t={t} />
          <BuyCurrencyModal isOpen={modalState.view === 'buy'} onClose={handleCloseModals} currencyCode={modalState.currency} rates={allRates} t={t} />
        </>
      )}
      {!isCompletelyEmpty && (
        <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} rate={rate} t={t} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </>
  );
}
