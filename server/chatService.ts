import { GoogleGenAI } from '@google/genai';
import type { ChatApiRequest, ChatApiResponse, ChatMessage, ExchangeRateData } from '../types';

const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => num.toLocaleString('en-US', options);

const getLocaleLabel = (locale: ChatApiRequest['locale']) => {
  if (locale === 'ar') return 'ar';
  if (locale === 'ku') return 'ku';
  return 'en';
};

const buildSystemInstruction = (rateData: ExchangeRateData | null, locale: ChatApiRequest['locale']) => {
  if (!rateData) {
    return `You are a helpful financial assistant for the DinarLive app.
The app is currently unable to load live exchange rate data.
Apologize to the user and ask them to try again later. Do not attempt to provide financial rates.
Always answer in ${getLocaleLabel(locale)}.`;
  }

  const { iqd, centralBankRate, eurPerUsd, tryPerUsd, gbpPerUsd, irtPerUsd } = rateData;
  const iqdPerEur = eurPerUsd > 0 ? iqd / eurPerUsd : 0;
  const iqdPerTry = tryPerUsd > 0 ? iqd / tryPerUsd : 0;
  const iqdPerGbp = gbpPerUsd > 0 ? iqd / gbpPerUsd : 0;
  const iqdPerIrt = irtPerUsd > 0 ? iqd / irtPerUsd : 0;

  return `You are "Dinar Bot", a helpful financial assistant for the DinarLive app.
- Be concise, accurate, and friendly.
- Answer in ${getLocaleLabel(locale)}.
- Use only the supplied exchange-rate data.
- When calculations are requested, show the result clearly.
- If the user asks for unsupported live data, say you only know the current app data.

CURRENT REAL-TIME DATA:
- Market Rate (100 USD to IQD): ${formatNumber(iqd * 100, { maximumFractionDigits: 0 })} IQD
- Central Bank Rate (100 USD to IQD): ${formatNumber(centralBankRate * 100, { maximumFractionDigits: 0 })} IQD
- 1 USD = ${formatNumber(iqd, { maximumFractionDigits: 2 })} IQD
- 1 EUR = ${formatNumber(iqdPerEur, { maximumFractionDigits: 2 })} IQD
- 1 TRY = ${formatNumber(iqdPerTry, { maximumFractionDigits: 2 })} IQD
- 1 GBP = ${formatNumber(iqdPerGbp, { maximumFractionDigits: 2 })} IQD
- 1 IRT = ${formatNumber(iqdPerIrt, { maximumFractionDigits: 2 })} IQD`;
};

const toModelContents = (history: ChatMessage[], latestMessage: string) => {
  const trimmedHistory = history.slice(-10).map((entry) => ({
    role: entry.role === 'model' ? 'model' : 'user',
    parts: [{ text: entry.content }],
  }));

  trimmedHistory.push({
    role: 'user',
    parts: [{ text: latestMessage }],
  });

  return trimmedHistory;
};

export const createChatResponse = async (payload: ChatApiRequest): Promise<ChatApiResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chat is not configured because GEMINI_API_KEY is missing on the backend');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(payload.rateData, payload.locale);
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
    contents: toModelContents(payload.history, payload.message),
  });

  const message = response.text?.trim();
  if (!message) {
    throw new Error('Chat provider returned an empty response');
  }

  return { message };
};
