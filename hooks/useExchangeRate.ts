
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRateData, GroundingChunk, ExchangeRateErrorType, RateHistoryEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

const FETCH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const VERY_STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 Hours
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const CACHED_RATE_KEY = 'dinarLive_cachedRate';
const CACHED_SOURCES_KEY = 'dinarLive_cachedSources';
const CACHED_HISTORY_KEY = 'dinarLive_cachedHistory';
const LAST_REFRESH_KEY = 'dinarLive_lastRefresh';

const getInitialState = <T,>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return null;
    }
};

const isCacheValid = () => {
    try {
        const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
        if (!lastRefresh) return false;
        const lastRefreshTime = parseInt(lastRefresh, 10);
        return (Date.now() - lastRefreshTime) < VERY_STALE_THRESHOLD_MS;
    } catch { return false; }
};

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
  
  const retryCount = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);

  const updateCooldown = useCallback(() => {
    const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
    if (!lastRefreshTime) {
      setCooldownSeconds(0);
      return;
    }
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const remainingCooldown = REFRESH_COOLDOWN_MS - timeSinceLastRefresh;

    if (remainingCooldown > 0) {
      setCooldownSeconds(Math.ceil(remainingCooldown / 1000));
    } else {
      setCooldownSeconds(0);
    }
  }, []);

  useEffect(() => {
    updateCooldown();
    cooldownTimerRef.current = window.setInterval(updateCooldown, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [updateCooldown]);

  const fetchExchangeRate = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        **URGENT FINANCIAL DATA EXTRACTION**
        I need the most current exchange rates for the Iraqi Dinar (IQD) vs USD. 
        Date/Time: ${new Date().toLocaleString()}

        **SOURCES:**
        1. Telegram t.me/s/iraqborsa - Extract latest prices for Sulaymaniyah (سلێمانی), Erbil (هەولێر), Duhok (دهۆک).
        2. Central Bank of Iraq (CBI) Official Rate.
        3. Global rates: EUR/USD, TRY/USD, GBP/USD, IRT(Toman)/USD.

        **DATA REQUIREMENTS:**
        - Market Rate (100 USD): usually 145,000 - 155,000 IQD.
        - Official Rate: usually 1310 - 1320 IQD per 1 USD.
        - Historical: 7-day Sulaymaniyah history.

        **OUTPUT VALID JSON ONLY:**
        {
          "current": {
            "suly100Usd": number,
            "erbil100Usd": number,
            "duhok100Usd": number,
            "officialRate": number,
            "eurPerUsd": number,
            "tryPerUsd": number,
            "gbpPerUsd": number,
            "irtPerUsd": number
          },
          "history": [
            { "date": "YYYY-MM-DD", "rate": number }
          ]
        }
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("AI failed to return valid JSON");
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      const suly = parsedData.current?.suly100Usd || 0;
      const erbil = parsedData.current?.erbil100Usd || 0;
      const duhok = parsedData.current?.duhok100Usd || 0;
      const official = parsedData.current?.officialRate || 1320;

      if (suly < 100000 || suly === 141300) {
        throw new Error("Extracted rate is either static fallback or invalid");
      }
      
      const normalizedOfficial = official > 10000 ? official / 100 : official;

      const newRate: ExchangeRateData = {
        iqd: suly / 100,
        centralBankRate: normalizedOfficial,
        cities: {
            sulaymaniyah: suly,
            erbil: erbil || suly,
            duhok: duhok || suly,
        },
        eurPerUsd: parsedData.current.eurPerUsd || 0,
        tryPerUsd: parsedData.current.tryPerUsd || 0,
        gbpPerUsd: parsedData.current.gbpPerUsd || 0,
        irtPerUsd: parsedData.current.irtPerUsd || 0,
        updated: new Date().toISOString(),
      };
      
      let newHistory: RateHistoryEntry[] = [];
      if (Array.isArray(parsedData.history)) {
          newHistory = parsedData.history
            .map((item: any) => ({
                date: item.date,
                rate: item.rate < 5000 ? item.rate * 100 : item.rate
            }))
            .filter((item: any) => item.rate > 100000)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7);
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] ?? [];
      const uniqueChunks = Array.from(new Map(groundingChunks.filter(item => item.web?.uri).map(item => [item.web!.uri, item])).values());

      setRate(newRate);
      setSources(uniqueChunks);
      if (newHistory.length > 0) {
          setRateHistory(newHistory);
          localStorage.setItem(CACHED_HISTORY_KEY, JSON.stringify(newHistory));
      }
      
      localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(newRate));
      localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(uniqueChunks));
      localStorage.setItem(LAST_REFRESH_KEY, JSON.stringify(Date.now()));

      retryCount.current = 0;
      setError(null);
      setIsLoading(false);

    } catch (e: unknown) {
      console.error(`Fetch attempt ${retryCount.current + 1} failed:`, (e as Error).message);
      retryCount.current++;
      if (retryCount.current < MAX_RETRIES) {
        setTimeout(fetchExchangeRate, RETRY_DELAY_MS);
      } else {
        setError('FAILED_AFTER_RETRIES');
        setIsLoading(false);
      }
    }
  }, []);

  const startFetchCycle = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
      if (lastRefreshTime && (Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS)) {
        updateCooldown(); 
        return;
      }
      updateCooldown();
    }
    
    retryCount.current = 0;
    setIsLoading(true);
    setError(null);
    await fetchExchangeRate();
  }, [fetchExchangeRate, updateCooldown]);

  useEffect(() => {
    const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
    const now = Date.now();
    
    if (!rate || (lastRefreshTime && now - lastRefreshTime > FETCH_INTERVAL_MS)) {
        startFetchCycle(false);
    }
    
    const intervalId = setInterval(() => {
        const currentLastRefresh = getInitialState<number>(LAST_REFRESH_KEY);
        if (!currentLastRefresh || (Date.now() - currentLastRefresh > FETCH_INTERVAL_MS)) {
             startFetchCycle(false);
        }
    }, FETCH_INTERVAL_MS);
    
    return () => clearInterval(intervalId);
  }, [startFetchCycle, rate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
            const now = Date.now();
            
            if (lastRefreshTime && (now - lastRefreshTime > FETCH_INTERVAL_MS)) {
                if (now - lastRefreshTime > VERY_STALE_THRESHOLD_MS) {
                    setRate(null);
                }
                startFetchCycle(false);
            }
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
