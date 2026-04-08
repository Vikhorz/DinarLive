import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ExchangeRateData,
  GroundingChunk,
  ExchangeRateErrorType,
  RateHistoryEntry,
  RatesApiResponse,
} from '../types';

const FETCH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const VERY_STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const CACHED_RATE_KEY = 'dinarLive_cachedRate';
const CACHED_SOURCES_KEY = 'dinarLive_cachedSources';
const CACHED_HISTORY_KEY = 'dinarLive_cachedHistory';
const LAST_REFRESH_KEY = 'dinarLive_lastRefresh';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const RATES_API_ENDPOINT = `${API_BASE_URL}/api/rates`;

const getInitialState = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return null;
  }
};

const getStoredTimestamp = (key: string): number | null => {
  if (typeof window === 'undefined') return null;
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue);
    return typeof parsedValue === 'number' && Number.isFinite(parsedValue) ? parsedValue : null;
  } catch {
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
};

const isCacheValid = () => {
  const lastRefreshTime = getStoredTimestamp(LAST_REFRESH_KEY);
  return lastRefreshTime ? (Date.now() - lastRefreshTime) < VERY_STALE_THRESHOLD_MS : false;
};

const normalizeHistory = (history: unknown, currentRate: ExchangeRateData | null): RateHistoryEntry[] => {
  const parsedHistory = Array.isArray(history)
    ? history
        .map((item: any) => ({
          date: typeof item?.date === 'string' ? item.date : '',
          rate: typeof item?.rate === 'number' ? item.rate : Number(item?.rate),
        }))
        .filter((entry: RateHistoryEntry) => entry.date && Number.isFinite(entry.rate) && entry.rate > 100000)
    : [];

  if (currentRate) {
    parsedHistory.push({
      date: currentRate.updated.slice(0, 10),
      rate: Math.round(currentRate.iqd * 100),
    });
  }

  const dedupedHistory = new Map<string, RateHistoryEntry>();
  parsedHistory.forEach((entry) => {
    dedupedHistory.set(entry.date, entry);
  });

  return Array.from(dedupedHistory.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);
};

const isValidRate = (rate: any): rate is ExchangeRateData => (
  rate
  && typeof rate.iqd === 'number'
  && typeof rate.centralBankRate === 'number'
  && typeof rate.updated === 'string'
);

export const useExchangeRate = () => {
  const [rate, setRate] = useState<ExchangeRateData | null>(() => {
    if (!isCacheValid()) return null;
    return getInitialState<ExchangeRateData>(CACHED_RATE_KEY);
  });

  const [sources, setSources] = useState<GroundingChunk[]>(() => {
    if (!isCacheValid()) return [];
    return getInitialState<GroundingChunk[]>(CACHED_SOURCES_KEY) || [];
  });

  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(() => getInitialState<RateHistoryEntry[]>(CACHED_HISTORY_KEY) || []);
  const [isLoading, setIsLoading] = useState<boolean>(!rate);
  const [error, setError] = useState<ExchangeRateErrorType>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const cooldownTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const activeFetchRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);

  const updateCooldown = useCallback(() => {
    const lastRefreshTime = getStoredTimestamp(LAST_REFRESH_KEY);
    if (!lastRefreshTime) {
      setCooldownSeconds(0);
      return;
    }

    const remainingCooldown = REFRESH_COOLDOWN_MS - (Date.now() - lastRefreshTime);
    setCooldownSeconds(remainingCooldown > 0 ? Math.ceil(remainingCooldown / 1000) : 0);
  }, []);

  useEffect(() => {
    updateCooldown();
    cooldownTimerRef.current = window.setInterval(updateCooldown, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [updateCooldown]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const fetchExchangeRate = useCallback(async () => {
    const response = await fetch(RATES_API_ENDPOINT, {
      headers: {
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Rates API returned ${response.status}`);
    }

    const payload = await response.json() as RatesApiResponse;
    if (!isValidRate(payload?.rate)) {
      throw new Error('Rates API returned an invalid payload');
    }

    const nextRate = payload.rate;
    const nextSources = Array.isArray(payload.sources) ? payload.sources : [];
    const nextHistory = normalizeHistory(payload.rateHistory, nextRate);

    return {
      nextRate,
      nextSources,
      nextHistory,
    };
  }, []);

  const waitBeforeRetry = useCallback(() => new Promise<void>((resolve) => {
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      resolve();
    }, RETRY_DELAY_MS);
  }), []);

  const runFetchWithRetries = useCallback(async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { nextRate, nextSources, nextHistory } = await fetchExchangeRate();

        if (!isMountedRef.current) return;

        setRate(nextRate);
        setSources(nextSources);
        setRateHistory(nextHistory);
        localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(nextRate));
        localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(nextSources));
        localStorage.setItem(CACHED_HISTORY_KEY, JSON.stringify(nextHistory));
        localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));

        setError(null);
        setIsLoading(false);
        updateCooldown();
        return;
      } catch (fetchError: unknown) {
        console.error(`Fetch attempt ${attempt} failed:`, (fetchError as Error).message);

        if (attempt < MAX_RETRIES) {
          await waitBeforeRetry();
          if (!isMountedRef.current) return;
          continue;
        }

        if (!isMountedRef.current) return;
        setError('FAILED_AFTER_RETRIES');
        setIsLoading(false);
      }
    }
  }, [fetchExchangeRate, updateCooldown, waitBeforeRetry]);

  const startFetchCycle = useCallback(async (isManualRefresh = false) => {
    if (activeFetchRef.current) {
      return activeFetchRef.current;
    }

    if (isManualRefresh) {
      const lastRefreshTime = getStoredTimestamp(LAST_REFRESH_KEY);
      if (lastRefreshTime && (Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS)) {
        updateCooldown();
        return;
      }
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    const fetchPromise = runFetchWithRetries().finally(() => {
      activeFetchRef.current = null;
    });

    activeFetchRef.current = fetchPromise;
    await fetchPromise;
  }, [runFetchWithRetries, updateCooldown]);

  useEffect(() => {
    const lastRefreshTime = getStoredTimestamp(LAST_REFRESH_KEY);
    const now = Date.now();

    if (!rate || (lastRefreshTime && now - lastRefreshTime > FETCH_INTERVAL_MS)) {
      startFetchCycle(false);
    }

    const intervalId = setInterval(() => {
      const currentLastRefresh = getStoredTimestamp(LAST_REFRESH_KEY);
      if (!currentLastRefresh || (Date.now() - currentLastRefresh > FETCH_INTERVAL_MS)) {
        startFetchCycle(false);
      }
    }, FETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [startFetchCycle, rate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const lastRefreshTime = getStoredTimestamp(LAST_REFRESH_KEY);
      const now = Date.now();

      if (lastRefreshTime && (now - lastRefreshTime > FETCH_INTERVAL_MS)) {
        if (now - lastRefreshTime > VERY_STALE_THRESHOLD_MS) {
          setRate(null);
        }
        startFetchCycle(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startFetchCycle]);

  return {
    rate,
    sources,
    loading: isLoading,
    error,
    refetch: () => startFetchCycle(true),
    rateHistory,
    cooldownSeconds,
  };
};
