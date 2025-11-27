
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRateData, GroundingChunk, ExchangeRateErrorType, RateHistoryEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

const FETCH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

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

export const useExchangeRate = () => {
  const [rate, setRate] = useState<ExchangeRateData | null>(() => getInitialState<ExchangeRateData>(CACHED_RATE_KEY));
  const [sources, setSources] = useState<GroundingChunk[]>(() => getInitialState<GroundingChunk[]>(CACHED_SOURCES_KEY) || []);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(() => getInitialState<RateHistoryEntry[]>(CACHED_HISTORY_KEY) || []);
  const [isLoading, setIsLoading] = useState<boolean>(!rate);
  const [error, setError] = useState<ExchangeRateErrorType>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  const retryCount = useRef(0);
  const hasInitialData = useRef(!!rate);
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

      // Strict extraction prompt based on user requirements
      const prompt = `
        **TASK:** Fetch and extract currency data strictly.

        **PART 1: CURRENT USD-IQD RATE (Mandatory Accuracy)**
        - **Source URL:** https://alanchand.com/en/exchange-rates/usd-iqd
        - **Strict Extraction Rule:**
          1. Locate the HTML element with ID "#destinationAmount" (or similar output field for the converted amount).
          2. Locate the base currency text "span.currOrigin" (Should be "1 USD").
          3. Extract the numeric text from "#destinationAmount". 
        - **Logic:** This number represents the value of **1 USD**. 
        - **Validation:** 
           - The number should contain only digits and dots.
           - If the value is ~1400-1600, it is the price for 1 USD.
           - **Output:** Convert this to the price for **100 USD** for the JSON output.

        **PART 2: HISTORY (7 Days)**
        - **Source URL:** https://alanchand.com/en/exchange-rates/iqd-usd
        - **Action:** Extract the 7-day history table from this page. 
        - **Note:** This is a different URL from Part 1. Use this URL specifically for the table.

        **PART 3: OTHER CURRENCIES**
        - Look for EUR, TRY, GBP, and Toman (IRT) rates against USD.

        **OUTPUT JSON FORMAT:**
        Return ONLY valid JSON. No markdown.
        {
          "current": {
            "iqdPer100Usd": number, // The extracted "#destinationAmount" * 100
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
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error(`Could not find a valid JSON object in the API response.`);
      }
      
      const jsonStr = jsonMatch[0];
      const parsedData = JSON.parse(jsonStr);
      
      let iqdRateFromApi = parsedData.current?.iqdPer100Usd;

      // Logic: Ensure we have a valid number.
      if (typeof iqdRateFromApi === 'number') {
         // If the model returned the 1 USD rate (e.g. 1500) instead of 100 USD rate, fix it.
         if (iqdRateFromApi > 0 && iqdRateFromApi < 5000) {
             iqdRateFromApi = iqdRateFromApi * 100;
         }
      }
      
      // Safety Check: Rate for 100 USD should be roughly between 100,000 and 200,000.
      if (!iqdRateFromApi || typeof iqdRateFromApi !== 'number' || iqdRateFromApi < 50000) {
        console.error("Invalid API Response (IQD Rate invalid):", parsedData);
        throw new Error(`Invalid or out-of-range IQD rate received from API: ${iqdRateFromApi}`);
      }
      
      // The app uses "Rate per 1 USD" internally for calculations, but displays per 100 USD.
      const iqdPerUsd = iqdRateFromApi / 100;
      
      const eurPerUsd = (typeof parsedData.current.eurPerUsd === 'number' && parsedData.current.eurPerUsd > 0) ? parsedData.current.eurPerUsd : 0;
      const tryPerUsd = (typeof parsedData.current.tryPerUsd === 'number' && parsedData.current.tryPerUsd > 0) ? parsedData.current.tryPerUsd : 0;
      const gbpPerUsd = (typeof parsedData.current.gbpPerUsd === 'number' && parsedData.current.gbpPerUsd > 0) ? parsedData.current.gbpPerUsd : 0;
      const irtPerUsd = (typeof parsedData.current.irtPerUsd === 'number' && parsedData.current.irtPerUsd > 0) ? parsedData.current.irtPerUsd : 0;

      const newRate: ExchangeRateData = {
        iqd: iqdPerUsd,
        eurPerUsd: eurPerUsd,
        tryPerUsd: tryPerUsd,
        gbpPerUsd: gbpPerUsd,
        irtPerUsd: irtPerUsd,
        updated: new Date().toISOString(),
      };
      
      // Process History
      let newHistory: RateHistoryEntry[] = [];
      if (Array.isArray(parsedData.history)) {
          newHistory = parsedData.history
            .filter((item: any) => {
                if (!item.date || typeof item.rate !== 'number') return false;
                
                // Fix history scaling if needed
                if (item.rate < 5000) item.rate = item.rate * 100;
                
                // Ensure reasonable range (e.g. > 100,000)
                return item.rate > 50000;
            })
            // Sort by date ascending for the chart
            .sort((a: RateHistoryEntry, b: RateHistoryEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
          // Take last 7 days
          if (newHistory.length > 7) {
            newHistory = newHistory.slice(newHistory.length - 7);
          }
      }

      const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] ?? [];
      const uniqueChunks = Array.from(new Map(groundingChunks.filter(item => item.web?.uri).map(item => [item.web!.uri, item])).values());

      setRate(newRate);
      setSources(uniqueChunks);
      
      if (newHistory.length > 0) {
          setRateHistory(newHistory);
          localStorage.setItem(CACHED_HISTORY_KEY, JSON.stringify(newHistory));
      }
      
      hasInitialData.current = true;
      localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(newRate));
      localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(uniqueChunks));

      retryCount.current = 0;
      setError(null);
      setIsLoading(false);

    } catch (e: unknown) {
      console.error(`Error fetching exchange rate (Attempt ${retryCount.current + 1}):`, (e as Error).message);
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
      localStorage.setItem(LAST_REFRESH_KEY, JSON.stringify(Date.now()));
      updateCooldown();
    }
    
    retryCount.current = 0;
    setIsLoading(true);
    setError(null);
    await fetchExchangeRate();
  }, [fetchExchangeRate, updateCooldown]);

  useEffect(() => {
    if (!rate) {
      startFetchCycle(false);
    }
    const intervalId = setInterval(() => startFetchCycle(false), FETCH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [startFetchCycle, rate]);

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
