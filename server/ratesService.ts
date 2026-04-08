import type { ExchangeRateData, GroundingChunk, RateHistoryEntry, RatesApiResponse } from '../types';

const SERVER_CACHE_TTL_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const MARKET_RATE_MIN = 120000;
const MARKET_RATE_MAX = 170000;

const DEFAULT_TELEGRAM_SOURCES = [
  { title: 'Telegram - Iraq Market Rates', url: 'https://t.me/s/iraqm' },
  { title: 'Telegram - IQ Borsa', url: 'https://t.me/s/iqborsa' },
  { title: 'Telegram - Iraq Borsa', url: 'https://t.me/s/iraqborsa' },
];

const DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

const CITY_ALIASES = {
  sulaymaniyah: ['سليمانية', 'السليمانية', 'سلێمانی', 'سلیمانیە', 'sulaymaniyah'],
  erbil: ['اربيل', 'أربيل', 'هەولێر', 'اربیل', 'erbil', 'hawler'],
  duhok: ['دهوك', 'دهۆک', 'duhok', 'dohuk'],
  north: ['شمال', 'northern'],
};

type TelegramPost = {
  source: { title: string; url: string };
  text: string;
  date: string;
};

let cachedRates: RatesApiResponse | null = null;
let cachedAt = 0;
let inflightRatesRequest: Promise<RatesApiResponse> | null = null;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, (char) => DIGIT_MAP[char] ?? char);

const decodeHtml = (value: string) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const htmlToText = (value: string) => normalizeDigits(
  decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/[،]/g, ',')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\s+\n/g, '\n')
    .trim(),
);

const toMarketRate = (rawValue: string | null): number | null => {
  if (!rawValue) return null;
  const digitsOnly = normalizeDigits(rawValue).replace(/[^\d]/g, '');
  if (!digitsOnly) return null;

  const parsedValue = Number(digitsOnly);
  if (!Number.isFinite(parsedValue) || parsedValue < MARKET_RATE_MIN || parsedValue > MARKET_RATE_MAX) {
    return null;
  }

  return parsedValue;
};

const toDecimalRate = (rawValue: string | null): number | null => {
  if (!rawValue) return null;
  const parsedValue = Number(normalizeDigits(rawValue).replace(/,/g, ''));
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const withTimeout = async (url: string, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': 'DinarLive/1.0 (+https://dinarlive.local)',
        accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchText = async (url: string) => {
  const response = await withTimeout(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status})`);
  }
  return response.text();
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await withTimeout(url, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status})`);
  }

  return response.json() as Promise<T>;
};

const getTelegramSources = () => {
  const configuredSources = process.env.TELEGRAM_MARKET_SOURCES;
  if (!configuredSources) {
    return DEFAULT_TELEGRAM_SOURCES;
  }

  return configuredSources
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((url) => ({
      url,
      title: `Telegram - ${url.replace(/^https?:\/\/t\.me\/s\//, '').replace(/[/?#].*$/, '')}`,
    }));
};

const extractTelegramPosts = (html: string, source: { title: string; url: string }): TelegramPost[] => {
  const blocks = html.split('tgme_widget_message_wrap').slice(1);

  return blocks
    .map((block) => {
      const datetime = block.match(/datetime="([^"]+)"/)?.[1];
      const textHtml = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>\s*<div class="tgme_widget_message_footer"/i)?.[1]
        ?? block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i)?.[1];

      if (!datetime || !textHtml) {
        return null;
      }

      const text = htmlToText(textHtml);
      if (!text) {
        return null;
      }

      return { source, text, date: datetime };
    })
    .filter((post): post is TelegramPost => Boolean(post));
};

const extractRateNearAliases = (text: string, aliases: string[]) => {
  const normalizedText = normalizeDigits(text);

  for (const alias of aliases) {
    const escapedAlias = escapeRegExp(alias);
    const patterns = [
      new RegExp(`${escapedAlias}[\\s\\S]{0,28}?([0-9][0-9,\\.]{4,10})`, 'i'),
      new RegExp(`([0-9][0-9,\\.]{4,10})[\\s\\S]{0,28}?${escapedAlias}`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      const rate = toMarketRate(match?.[1] ?? null);
      if (rate) {
        return rate;
      }
    }
  }

  return null;
};

const buildRateHistory = (posts: TelegramPost[]) => {
  const historyByDate = new Map<string, RateHistoryEntry>();

  for (const post of posts) {
    const historyRate = extractRateNearAliases(post.text, [...CITY_ALIASES.sulaymaniyah, ...CITY_ALIASES.north]);
    if (!historyRate) {
      continue;
    }

    const dateKey = post.date.slice(0, 10);
    if (!historyByDate.has(dateKey)) {
      historyByDate.set(dateKey, {
        date: dateKey,
        rate: historyRate,
      });
    }

    if (historyByDate.size >= 7) {
      break;
    }
  }

  return Array.from(historyByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const extractMarketSnapshot = (posts: TelegramPost[]) => {
  let sulaymaniyah = null as number | null;
  let erbil = null as number | null;
  let duhok = null as number | null;
  let regionalNorth = null as number | null;

  for (const post of posts) {
    sulaymaniyah ??= extractRateNearAliases(post.text, CITY_ALIASES.sulaymaniyah);
    erbil ??= extractRateNearAliases(post.text, CITY_ALIASES.erbil);
    duhok ??= extractRateNearAliases(post.text, CITY_ALIASES.duhok);
    regionalNorth ??= extractRateNearAliases(post.text, CITY_ALIASES.north);

    if (sulaymaniyah && erbil && duhok) {
      break;
    }
  }

  const baseRate = sulaymaniyah ?? regionalNorth ?? erbil ?? duhok;
  if (!baseRate) {
    throw new Error('Unable to extract market rates from Telegram sources');
  }

  return {
    cities: {
      sulaymaniyah: sulaymaniyah ?? baseRate,
      erbil: erbil ?? sulaymaniyah ?? baseRate,
      duhok: duhok ?? sulaymaniyah ?? erbil ?? baseRate,
    },
    history: buildRateHistory(posts),
  };
};

const fetchTelegramMarketData = async () => {
  const sources = getTelegramSources();
  const settledResponses = await Promise.allSettled(
    sources.map(async (source) => ({
      source,
      posts: extractTelegramPosts(await fetchText(source.url), source),
    })),
  );

  const successfulResponses = settledResponses
    .filter((result): result is PromiseFulfilledResult<{ source: { title: string; url: string }; posts: TelegramPost[] }> => result.status === 'fulfilled')
    .filter((result) => result.value.posts.length > 0);

  if (successfulResponses.length === 0) {
    throw new Error('Unable to load any Telegram market sources');
  }

  const posts = successfulResponses
    .flatMap((result) => result.value.posts)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const snapshot = extractMarketSnapshot(posts);
  const usedSources: GroundingChunk[] = successfulResponses.map((result) => ({
    web: {
      uri: result.value.source.url,
      title: result.value.source.title,
    },
  }));

  return {
    ...snapshot,
    sources: usedSources,
  };
};

const fetchCbiOfficialRate = async () => {
  const cbiHtml = await fetchText('https://cbi.iq/');
  const cbiText = htmlToText(cbiHtml);
  const officialRate = toDecimalRate(cbiText.match(/U\.S\. dollar\s+USD\s+([0-9.,]+)/i)?.[1] ?? null);

  if (!officialRate) {
    throw new Error('Unable to parse official CBI USD rate');
  }

  return officialRate;
};

const fetchGlobalRates = async () => {
  const payload = await fetchJson<{
    result?: string;
    rates?: Record<string, number>;
  }>('https://open.er-api.com/v6/latest/USD');

  if (payload.result !== 'success' || !payload.rates) {
    throw new Error('Unexpected response from open exchange API');
  }

  return {
    eurPerUsd: payload.rates.EUR ?? 0,
    tryPerUsd: payload.rates.TRY ?? 0,
    gbpPerUsd: payload.rates.GBP ?? 0,
    irtPerUsd: payload.rates.IRR ? payload.rates.IRR / 10 : 0,
  };
};

const composeRatesResponse = async (): Promise<RatesApiResponse> => {
  const [marketData, centralBankRate, globalRates] = await Promise.all([
    fetchTelegramMarketData(),
    fetchCbiOfficialRate(),
    fetchGlobalRates(),
  ]);

  const fetchedAt = new Date().toISOString();
  const rate: ExchangeRateData = {
    iqd: marketData.cities.sulaymaniyah / 100,
    centralBankRate,
    cities: marketData.cities,
    eurPerUsd: globalRates.eurPerUsd,
    tryPerUsd: globalRates.tryPerUsd,
    gbpPerUsd: globalRates.gbpPerUsd,
    irtPerUsd: globalRates.irtPerUsd,
    updated: fetchedAt,
  };

  const latestHistory = [...marketData.history];
  if (!latestHistory.some((entry) => entry.date === fetchedAt.slice(0, 10))) {
    latestHistory.push({
      date: fetchedAt.slice(0, 10),
      rate: marketData.cities.sulaymaniyah,
    });
  }

  latestHistory.sort((a, b) => a.date.localeCompare(b.date));

  return {
    rate,
    rateHistory: latestHistory.slice(-7),
    sources: [
      ...marketData.sources,
      {
        web: {
          uri: 'https://cbi.iq/',
          title: 'Central Bank of Iraq',
        },
      },
      {
        web: {
          uri: 'https://www.exchangerate-api.com/docs/free',
          title: 'ExchangeRate-API (Open Access)',
        },
      },
    ],
    fetchedAt,
  };
};

export const createRatesResponse = async (): Promise<RatesApiResponse> => {
  const now = Date.now();
  if (cachedRates && now - cachedAt < SERVER_CACHE_TTL_MS) {
    return cachedRates;
  }

  if (!inflightRatesRequest) {
    inflightRatesRequest = composeRatesResponse()
      .then((response) => {
        cachedRates = response;
        cachedAt = Date.now();
        return response;
      })
      .catch((error) => {
        if (cachedRates) {
          return cachedRates;
        }

        throw error;
      })
      .finally(() => {
        inflightRatesRequest = null;
      });
  }

  return inflightRatesRequest;
};
