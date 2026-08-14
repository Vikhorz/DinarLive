import type { ExchangeRateData, GroundingChunk, MetalsData, RateHistoryEntry, RatesApiResponse } from '../types';

const SERVER_CACHE_TTL_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const MARKET_RATE_MIN = 120000;
const MARKET_RATE_MAX = 170000;
const FALLBACK_MARKET_RATE = 153250;
const FALLBACK_CBI_SELL_RATE = 1320;
const METAL_PRICE_MIN = 0.01;
const METAL_PRICE_MAX = 20000;

const DEFAULT_TELEGRAM_SOURCES = [
  { title: 'Telegram - Iraq Borsa', url: 'https://t.me/s/iraqborsa' },
  { title: 'Telegram - Bazari Dolaraka', url: 'https://t.me/s/bazari_dolaraka' },
];

export const DEFAULT_METALS_SOURCE = { title: 'Telegram - Yar Gold', url: 'https://t.me/s/YarGold_Co' };

export const METAL_ALIASES = {
  dubaiLira: ['لیرە دوبەی', 'لیرەی دوبەی', 'ليرة دبي', 'dubai lira'],
  palmSilver: ['زیوی پاڵم', 'فضة النخلة', 'palm silver'],
  copper9999: ['مس 9999', 'مسی 9999', 'نحاس 9999', 'copper 9999'],
};

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

type MarketSnapshot = {
  cities: {
    sulaymaniyah: number;
    erbil: number;
    duhok: number;
  };
  history: RateHistoryEntry[];
  sources: GroundingChunk[];
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
  .replace(/&gt;/gi, '>')
  .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCharCode(Number(dec)));

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

export const fetchText = async (url: string) => {
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
    .map((url) => {
      const normalizedUrl = url.replace(/^https?:\/\/t\.me\/(?!s\/)/, 'https://t.me/s/');
      const channelName = normalizedUrl.replace(/^https?:\/\/t\.me\/s\//, '').replace(/[/?#].*$/, '');
      const prettifiedName = channelName
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

      return {
        url: normalizedUrl,
        title: `Telegram - ${prettifiedName}`,
      };
    });
};

export const extractTelegramPosts = (html: string, source: { title: string; url: string }): TelegramPost[] => {
  const blocks = html.split('tgme_widget_message_wrap').slice(1);

  return blocks
    .map((block) => {
      const datetime = block.match(/datetime="([^"]+)"/)?.[1];
      const textHtml = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i)?.[1]
        ?? block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>\s*<div class="tgme_widget_message_footer"/i)?.[1]
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

const toUsdMetalPrice = (rawValue: string | null): number | null => {
  if (!rawValue) return null;
  const parsedValue = Number(normalizeDigits(rawValue).replace(/,/g, ''));
  if (!Number.isFinite(parsedValue) || parsedValue < METAL_PRICE_MIN || parsedValue > METAL_PRICE_MAX) {
    return null;
  }
  return parsedValue;
};

export const extractUsdPriceNearAliases = (text: string, aliases: string[]) => {
  const normalizedText = normalizeDigits(text);

  for (const alias of aliases) {
    const escapedAlias = escapeRegExp(normalizeDigits(alias));
    const patterns = [
      new RegExp(`${escapedAlias}[\\s\\S]{0,20}?\\$\\s?([0-9][0-9,\\.]{0,8})`, 'i'),
      new RegExp(`\\$\\s?([0-9][0-9,\\.]{0,8})[\\s\\S]{0,20}?${escapedAlias}`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      const price = toUsdMetalPrice(match?.[1] ?? null);
      if (price) {
        return price;
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

const createFallbackMarketData = (): MarketSnapshot => {
  const today = new Date().toISOString().slice(0, 10);

  return {
    cities: {
      sulaymaniyah: FALLBACK_MARKET_RATE,
      erbil: FALLBACK_MARKET_RATE - 250,
      duhok: FALLBACK_MARKET_RATE - 50,
    },
    history: [
      {
        date: today,
        rate: FALLBACK_MARKET_RATE,
      },
    ],
    sources: DEFAULT_TELEGRAM_SOURCES.map((source) => ({
      web: {
        uri: source.url,
        title: source.title,
      },
    })),
  };
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

const fetchTelegramMarketData = async (): Promise<MarketSnapshot> => {
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
    if (cachedRates) {
      return {
        cities: cachedRates.rate.cities,
        history: cachedRates.rateHistory,
        sources: DEFAULT_TELEGRAM_SOURCES.map((source) => ({
          web: {
            uri: source.url,
            title: source.title,
          },
        })),
      };
    }

    return createFallbackMarketData();
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
  try {
    const cbiHtml = await fetchText('https://cbi.iq/news/view/2229');
    const cbiText = htmlToText(cbiHtml);
    const officialRate = toDecimalRate(
      cbiText.match(/1320\s+dinars per dollar/i)?.[0]?.match(/([0-9.,]+)/)?.[1]
        ?? cbiText.match(/sale price of the dollar[\s\S]{0,40}?([0-9.,]+)/i)?.[1]
        ?? cbiText.match(/beneficiaries[\s\S]{0,40}?([0-9.,]+)/i)?.[1]
        ?? cbiText.match(/السعر الرسمي[\s\S]{0,40}?([0-9.,]+)/i)?.[1]
        ?? `${FALLBACK_CBI_SELL_RATE}`,
    );

    if (officialRate) {
      return officialRate;
    }
  } catch (_error) {
    // Fall back to the requested published selling price if the CBI page is unavailable.
  }

  return FALLBACK_CBI_SELL_RATE;
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

const fetchMetalsData = async (): Promise<{ metals: MetalsData | null; source: GroundingChunk | null }> => {
  try {
    const html = await fetchText(DEFAULT_METALS_SOURCE.url);
    const posts = extractTelegramPosts(html, DEFAULT_METALS_SOURCE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let dubaiLira: number | null = null;
    let palmSilver: number | null = null;
    let copper9999: number | null = null;

    for (const post of posts) {
      dubaiLira ??= extractUsdPriceNearAliases(post.text, METAL_ALIASES.dubaiLira);
      palmSilver ??= extractUsdPriceNearAliases(post.text, METAL_ALIASES.palmSilver);
      copper9999 ??= extractUsdPriceNearAliases(post.text, METAL_ALIASES.copper9999);

      if (dubaiLira && palmSilver && copper9999) {
        break;
      }
    }

    if (!dubaiLira && !palmSilver && !copper9999) {
      console.warn(
        `[metals] no items matched across ${posts.length} posts. First post sample: ${posts[0]?.text?.slice(0, 200) ?? '(no posts found)'}`,
      );
      return { metals: null, source: null };
    }

    if (!dubaiLira || !palmSilver || !copper9999) {
      console.warn(
        `[metals] partial match: dubaiLira=${dubaiLira} palmSilver=${palmSilver} copper9999=${copper9999} across ${posts.length} posts`,
      );
    }

    return {
      metals: { dubaiLira, palmSilver, copper9999 },
      source: { web: { uri: DEFAULT_METALS_SOURCE.url, title: DEFAULT_METALS_SOURCE.title } },
    };
  } catch (error) {
    // Metals are a non-essential add-on; a failed fetch shouldn't break the core rates response.
    console.warn(`[metals] fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    return { metals: null, source: null };
  }
};

const composeRatesResponse = async (): Promise<RatesApiResponse> => {
  const [marketData, centralBankRate, globalRates, metalsResult] = await Promise.all([
    fetchTelegramMarketData(),
    fetchCbiOfficialRate(),
    fetchGlobalRates(),
    fetchMetalsData(),
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
    metals: metalsResult.metals ?? undefined,
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
          uri: 'https://cbi.iq/news/view/2229',
          title: 'Central Bank of Iraq - USD Selling Price',
        },
      },
      {
        web: {
          uri: 'https://www.exchangerate-api.com/docs/free',
          title: 'ExchangeRate-API (Open Access)',
        },
      },
      ...(metalsResult.source ? [metalsResult.source] : []),
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
