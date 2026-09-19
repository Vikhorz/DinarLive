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
import { MetalsCard } from './components/MetalsCard';
import { GoldModal } from './components/GoldModal';
import { MarketTicker } from './components/MarketTicker';

const CHAT_ENABLED = false;

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

type AppPage = 'home' | 'calculator' | 'chart';

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
  </svg>
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect width="16" height="19" x="4" y="2.5" rx="2" />
    <path strokeLinecap="round" d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
  </svg>
);

const snapshotToneClasses = {
  amber: 'theme-surface-inverted theme-border-strong',
  sky: 'theme-surface-card theme-border',
};

const snapshotToneTextClasses = {
  amber: '',
  sky: 'theme-text-primary',
};

const SnapshotCard: React.FC<{ title: string; value: string; subtitle: string; tone: keyof typeof snapshotToneClasses }> = ({ title, value, subtitle, tone }) => (
  <div className={`theme-shadow-soft theme-lift rounded-lg border p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-6 ${snapshotToneClasses[tone]}`}>
    <p className={`text-[11px] font-black ${snapshotToneTextClasses[tone]}`}>{title}</p>
    <p className={`font-data mt-2 text-3xl font-black tracking-tight sm:mt-3 sm:text-[2.35rem] ${snapshotToneTextClasses[tone]}`} dir="ltr">
      {value}
    </p>
    <p className={`mt-2 text-sm leading-6 ${tone === 'amber' ? 'opacity-70' : 'theme-text-secondary'}`}>{subtitle}</p>
  </div>
);

export default function App(): React.ReactElement {
  const { rate, sources, loading, error, refetch, rateHistory, cooldownSeconds } = useExchangeRate();

  const [activePage, setActivePage] = useState<AppPage>('home');
  const [language, setLanguage] = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ currency: string | null; view: 'info' | 'buy' }>({ currency: null, view: 'info' });
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
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

  const tickerItems = useMemo(() => {
    if (!rate) return [];
    const items: string[] = [];

    items.push(`${t.marketRateLabel}: ${Math.floor(rateForDisplay).toLocaleString()} ${t.iqdCurrency}`);
    items.push(`${t.centralBankRateLabel}: ${Math.floor(centralBankRateForDisplay).toLocaleString()} ${t.iqdCurrency}`);

    if (eurPerUsdValue > 0) items.push(`${t.eurToIqd}: ${(iqdRateValue / eurPerUsdValue).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${t.iqdCurrency}`);
    if (gbpPerUsdValue > 0) items.push(`${t.gbpToIqd}: ${(iqdRateValue / gbpPerUsdValue).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${t.iqdCurrency}`);
    if (tryPerUsdValue > 0) items.push(`${t.tryToIqd}: ${(iqdRateValue / tryPerUsdValue).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${t.iqdCurrency}`);
    if (irtPerUsdValue > 0) items.push(`${t.irtToIqd}: ${(iqdRateValue / irtPerUsdValue).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${t.iqdCurrency}`);

    if (rate.metals?.dubaiLira) items.push(`${t.dubaiLiraLabel}: $${rate.metals.dubaiLira.toLocaleString('en-US')}`);
    if (rate.metals?.palmSilver) items.push(`${t.palmSilverLabel}: $${rate.metals.palmSilver.toLocaleString('en-US')}`);
    if (rate.metals?.copper9999) items.push(`${t.copper9999Label}: $${rate.metals.copper9999.toLocaleString('en-US')}`);

    if (rate.goldPrices?.karat21) items.push(`${t.goldTitle} ${t.goldKaratWord} 21: ${rate.goldPrices.karat21.toLocaleString()} ${t.iqdCurrency}`);
    if (rate.goldPrices?.karat22) items.push(`${t.goldTitle} ${t.goldKaratWord} 22: ${rate.goldPrices.karat22.toLocaleString()} ${t.iqdCurrency}`);

    return items;
  }, [rate, t, rateForDisplay, centralBankRateForDisplay, iqdRateValue, eurPerUsdValue, gbpPerUsdValue, tryPerUsdValue, irtPerUsdValue]);

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
          <div className="theme-surface-card theme-border theme-shadow-soft flex items-center justify-between gap-3 rounded-lg border p-2.5 transition-all duration-300 sm:p-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="theme-surface-inverted theme-border-strong flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-black">
                د.ع
              </div>
              <div className="min-w-0">
                <p className="theme-text-primary truncate text-lg font-black tracking-tight sm:text-xl">{t.appName}</p>
                <p className="theme-text-secondary truncate text-[10px] font-bold tracking-[0.08em]">{t.liveRate}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <LanguageSelector currentLang={language} onChangeLang={setLanguage} />
              <div className="theme-divider mx-0.5 h-7 w-px sm:mx-1" />
              <div className="relative">
                <button
                  onClick={handleManualRefresh}
                  className={`flex items-center justify-center rounded-2xl p-2.5 transition-all duration-300 shadow-sm ${
                    loading
                      ? 'theme-surface-muted theme-text-primary'
                      : cooldownSeconds > 0
                        ? 'theme-surface-muted theme-text-secondary'
                        : 'theme-surface-inverted theme-border-strong border active:scale-95'
                  }`}
                  aria-label="Refresh rates"
                >
                  <RefreshIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {cooldownMessage && (
                  <div className="theme-tooltip absolute right-0 top-full z-50 mt-3 rounded-2xl border px-4 py-2 text-[10px] font-bold shadow-2xl sm:text-xs">
                    {cooldownMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className={`min-h-screen w-full pt-24 transition-filter duration-500 ${showFullScreenLoader ? 'blur-sm' : ''}`}>
        <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-32 sm:px-6 lg:px-8">
          {activePage === 'home' && (
            <>
          <section className="theme-surface-card theme-border theme-shadow-soft overflow-hidden rounded-lg border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 xl:grid-cols-12 xl:items-center">
              <div className="xl:col-span-7">
                <div className="mb-4 flex flex-wrap items-center justify-center gap-3 sm:mb-6 xl:justify-start">
                  <span className="theme-surface-muted theme-border theme-text-primary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase shadow-sm">
                    <PulseIcon className="h-4 w-4" />
                    <span className="theme-live-dot h-2 w-2 rounded-full" />
                    {t.liveRate}
                  </span>
                  {loading && !isCompletelyEmpty && (
                    <span className="theme-surface-muted theme-border theme-text-primary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold shadow-sm">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="theme-live-dot relative inline-flex h-2.5 w-2.5 rounded-full" />
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

          {tickerItems.length > 0 && <MarketTicker items={tickerItems} />}

          {error && (
            <div className="theme-surface-card theme-border rounded-lg border p-6 text-center shadow-sm">
              <p className="theme-text-primary text-lg font-black">{t.errorAfterRetriesTitle}</p>
              <p className="theme-text-secondary mx-auto mt-2 max-w-2xl text-sm">{t.errorAfterRetriesMessage}</p>
              <button
                onClick={() => refetch()}
                className="theme-surface-inverted theme-border-strong mt-6 rounded-lg border px-6 py-3 font-bold transition-colors"
              >
                {t.retryButton}
              </button>
            </div>
          )}

          {(hasUsableData || !error) && (
            <div className="grid grid-cols-1 gap-6 xl:items-start">
              <aside className="order-1 mx-auto w-full max-w-5xl space-y-6">
                {(loading && !rate) ? (
                  <div className="space-y-4">
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

                {(rate?.metals || rate?.goldPrices) && (
                  <MetalsCard
                    metals={rate.metals ?? { dubaiLira: null, dubaiLiraDate: null, palmSilver: null, palmSilverDate: null, copper9999: null, copper9999Date: null }}
                    iqdPerUsd={iqdRateValue}
                    t={t}
                    gold={rate.goldPrices}
                    onOpenGold={() => setIsGoldModalOpen(true)}
                  />
                )}

                {rate && (
                  <div className="theme-surface-card theme-border theme-shadow-soft rounded-lg border p-5 sm:p-6">
                    <div className="theme-surface-muted theme-border rounded-lg border p-4">
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

            </div>
          )}
            </>
          )}

          {activePage === 'calculator' && (
            <section className="mx-auto w-full max-w-4xl space-y-6">
              <div className="text-center">
                <p className="theme-text-secondary font-data text-[10px] font-black uppercase">DinarLive</p>
                <h1 className="theme-text-primary mt-2 text-2xl font-black sm:text-3xl">{t.calculatorTitle}</h1>
                <p className="theme-text-secondary mt-2 text-sm">{t.calculatorPageDescription}</p>
              </div>
              {rate ? (
                <Calculator rates={allRates} t={t} onCurrencySelect={handleCurrencySelect} />
              ) : (
                <div className="theme-surface-card theme-border rounded-lg border p-8 text-center">
                  <p className="theme-text-secondary text-sm">{loading ? t.fetchingRates : t.errorAfterRetriesMessage}</p>
                </div>
              )}
            </section>
          )}

          {activePage === 'chart' && (
            <section className="mx-auto w-full max-w-5xl space-y-6">
              <div className="text-center">
                <p className="theme-text-secondary font-data text-[10px] font-black uppercase">DinarLive</p>
                <h1 className="theme-text-primary mt-2 text-2xl font-black sm:text-3xl">{t.rateHistoryTitle}</h1>
                <p className="theme-text-secondary mt-2 text-sm">{t.chartPageDescription}</p>
              </div>
              {(loading && rateHistory.length === 0) ? <RateHistoryChartSkeleton /> : <RateHistoryChart history={rateHistory} t={t} />}
            </section>
          )}
        </main>
      </div>

      <nav className="theme-surface-card theme-border theme-shadow-strong fixed bottom-0 left-0 right-0 z-40 border-t px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:rounded-2xl sm:border">
        <div className="mx-auto flex max-w-md items-center justify-around gap-1 sm:gap-2">
          {([
            { id: 'home' as const, label: t.homeNavLabel, Icon: HomeIcon },
            { id: 'calculator' as const, label: t.calculatorNavLabel, Icon: CalculatorIcon },
            { id: 'chart' as const, label: t.chartNavLabel, Icon: PulseIcon },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActivePage(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`theme-focus flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-black transition-all sm:min-w-[7rem] sm:px-5 ${
                activePage === id ? 'theme-surface-inverted' : 'theme-text-secondary theme-hover-soft'
              }`}
              aria-current={activePage === id ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div
        className="fixed bottom-24 z-40 flex flex-col items-center gap-4 transition-all duration-500 sm:bottom-6"
        style={{ right: language === 'en' ? '1.5rem' : 'auto', left: language !== 'en' ? '1.5rem' : 'auto' }}
      >
        <button
          onClick={scrollToTop}
          className={`theme-surface-card theme-border theme-text-primary rounded-lg border p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 ${
            showScrollTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>

        {CHAT_ENABLED && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`theme-surface-inverted rounded-lg p-4 shadow-xl transition-all duration-300 hover:scale-110 ${
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
        <p className="theme-text-primary text-sm leading-7">{t.aboutDialogContent}</p>
      </Dialog>

      <Dialog isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} title={t.sourcesTitle} t={t} size="lg">
        <div className="space-y-4">
          <div className="theme-surface-muted theme-border flex items-center gap-3 rounded-[1.4rem] border p-4">
            <span className="theme-surface-strong theme-text-accent flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl">
              <SourcesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="theme-text-primary text-sm font-black">{t.sourcesButton}</p>
              <div className="theme-text-secondary mt-1 flex items-center gap-2 text-xs">
                <span className="theme-text-primary font-black" dir="ltr">{validSources.length}</span>
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
      {rate?.goldPrices && <GoldModal gold={rate.goldPrices} isOpen={isGoldModalOpen} onClose={() => setIsGoldModalOpen(false)} t={t} />}

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
