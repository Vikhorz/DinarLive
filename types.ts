
export interface MetalsData {
  dubaiLira: number | null; // USD per mithqal, null if not seen in recent posts
  palmSilver: number | null; // USD per mithqal, null if not seen in recent posts
  copper9999: number | null; // USD per mithqal, null if not seen in recent posts
}

export interface GoldData {
  date: string | null; // e.g. "16/08/2026", as posted
  karat22: number | null; // IQD per mithqal, sell price
  karat21: number | null; // IQD per mithqal, sell price
  karat18: number | null; // IQD per mithqal, sell price
  karat14: number | null; // IQD per mithqal, sell price
  karat12: number | null; // IQD per mithqal, sell price
  karat9: number | null; // IQD per mithqal, sell price
  ounceUsd: number | null; // USD per troy ounce, spot
}

export interface ExchangeRateData {
  iqd: number; // Main rate (Sulaymaniyah)
  centralBankRate: number; // Official rate from Credit Bank of Iraq
  cities: {
    sulaymaniyah: number;
    erbil: number;
    duhok: number;
  };
  eurPerUsd: number;
  tryPerUsd: number;
  gbpPerUsd: number;
  irtPerUsd: number;
  metals?: MetalsData;
  goldPrices?: GoldData;
  updated: string;
}

export interface RateHistoryEntry {
    date: string; // ISO 8601 string
    rate: number; // IQD per 100 USD
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface RatesApiResponse {
  rate: ExchangeRateData;
  sources: GroundingChunk[];
  rateHistory: RateHistoryEntry[];
  fetchedAt: string;
}

export type ExchangeRateErrorType = 'FAILED_AFTER_RETRIES' | null;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatApiRequest {
  message: string;
  history: ChatMessage[];
  rateData: ExchangeRateData | null;
  locale: 'ku' | 'ar' | 'en';
}

export interface ChatApiResponse {
  message: string;
}

export interface Translation {
  [key: string]: any;
  appName: string;
  headerTitle: string;
  headerSubtitle: string;
  marketRateLabel: string;
  marketRateDescription: string;
  centralBankRateLabel: string;
  centralBankRateDescription:string;
  iqdCurrency: string;
  errorFetching: string;
  errorFetchingOtherRates: string;
  fetchingRates: string;
  updated: string;
  justNow: string;
  secondsAgo: (seconds: number) => string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
  calculatorTitle: string;
  amountPlaceholder: string;
  amount: string;
  from: string;
  to: string;
  result: string;
  usd: string;
  iqd: string;
  eur: string;
  try: string;
  gbp: string;
  irt: string;
  invalidRateInputError: string;
  retryButton: string;
  comparisonRatesTitle: string;
  regionalRatesTitle: string;
  sulyName: string;
  erbilName: string;
  duhokName: string;
  eurToIqd: string;
  tryToIqd: string;
  gbpToIqd: string;
  irtToIqd: string;
  tryRateDescription: string;
  eurRateDescription: string;
  gbpRateDescription: string;
  irtRateDescription: string;
  updatingRates: string;
  sourcesTitle: string;
  aboutButton: string;
  sourcesButton: string;
  shareButton: string;
  aboutDialogTitle: string;
  aboutDialogContent: string;
  shareMessage: (marketRate: string, centralBankRate: string) => string;
  copiedToClipboard: string;
  closeButton: string;
  loadingTitle: string;
  loadingSubtitle: string;
  pullToRefresh: string;
  errorAfterRetriesTitle: string;
  errorAfterRetriesMessage: string;
  chatTitle: string;
  chatWelcomeMessage: string;
  chatInputPlaceholder: string;
  sendButton: string;
  assistantTyping: string;
  rateHistoryTitle: string;
  noHistoryData: string;
  refreshCooldown: (time: string) => string;
  usdTooltip: string;
  iqdTooltip: string;
  eurTooltip: string;
  tryTooltip: string;
  gbpTooltip: string;
  irtTooltip: string;
  resultTooltip: string;
  currencyInfoTitle: (name: string) => string;
  buyCurrencyTitle: (name: string) => string;
  buyButton: (code: string) => string;
  isoCode: string;
  commonUses: string;
  funFact: string;
  purchaseAmount: string;
  costInIqd: string;
  usd_name: string;
  usd_description: string;
  usd_fact: string;
  iqd_name: string;
  iqd_description: string;
  iqd_fact: string;
  eur_name: string;
  eur_description: string;
  eur_fact: string;
  try_name: string;
  try_description: string;
  try_fact: string;
  gbp_name: string;
  gbp_description: string;
  gbp_fact: string;
  irt_name: string;
  irt_description: string;
  irt_fact: string;
  metalsTitle: string;
  metalsPriceUnit: string;
  dubaiLiraLabel: string;
  palmSilverLabel: string;
  copper9999Label: string;
  metalsIqdLabel: string;
  metalsPendingLabel: string;
  goldTitle: string;
  goldKaratWord: string;
  goldPerMithqal: string;
  goldOunceLabel: string;
  goldSellPriceLabel: string;
  goldPricingNote: string;
  goldTapHint: string;
  goldPendingLabel: string;
  goldAsOfLabel: string;
}
