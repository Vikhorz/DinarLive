
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage, ExchangeRateData, Translation } from '../types';

const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => num.toLocaleString('en-US', options);

export const useChat = (rateData: ExchangeRateData | null, t: Translation) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);

  const createSystemInstruction = useCallback(() => {
    if (!rateData) {
      return `You are a helpful financial assistant for the DinarLive app.
        The app is currently unable to load live exchange rate data.
        Apologize to the user and ask them to try again later. Do not attempt to provide any financial data.`;
    }

    const { iqd, centralBankRate, eurPerUsd, tryPerUsd, gbpPerUsd, irtPerUsd } = rateData;
    const iqdPerEur = eurPerUsd > 0 ? iqd / eurPerUsd : 0;
    const iqdPerTry = tryPerUsd > 0 ? iqd / tryPerUsd : 0;
    const iqdPerGbp = gbpPerUsd > 0 ? iqd / gbpPerUsd : 0;
    const iqdPerIrt = irtPerUsd > 0 ? iqd / irtPerUsd : 0;

    return `You are "Dinar Bot", a helpful AI assistant for the DinarLive app.
      Your purpose is to answer user questions about currency exchange based on the real-time data provided below.
      - Be friendly, concise, and helpful.
      - Answer in the same language as the user's question.
      - Use the provided data to perform calculations if asked. Do not use any external knowledge for rates.
      - When providing a rate, always mention it's the current market rate from the app.
      - The user's locale is '${t.appName === "DinarLive" ? "en" : t.appName === "دينار لايف" ? "ar" : "ku"}'. Format numbers appropriately but keep currency symbols like USD, IQD, EUR, TRY, GBP, IRT.
      
      CURRENT REAL-TIME DATA:
      - Market Rate (100 USD to IQD): ${formatNumber(iqd * 100, {maximumFractionDigits: 0})} IQD
      - Central Bank Rate (100 USD to IQD): ${formatNumber(centralBankRate * 100, {maximumFractionDigits: 0})} IQD
      - 1 USD = ${formatNumber(iqd, {maximumFractionDigits: 2})} IQD
      - 1 EUR = ${formatNumber(iqdPerEur, {maximumFractionDigits: 2})} IQD
      - 1 TRY = ${formatNumber(iqdPerTry, {maximumFractionDigits: 2})} IQD
      - 1 GBP = ${formatNumber(iqdPerGbp, {maximumFractionDigits: 2})} IQD
      - 1 IRT = ${formatNumber(iqdPerIrt, {maximumFractionDigits: 2})} IQD
    `;
  }, [rateData, t]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (!chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: createSystemInstruction(),
          },
        });
      }
      
      const stream = await chatRef.current.sendMessageStream({ message });
      
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I couldn't process that. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [createSystemInstruction]);

  return { messages, isLoading, sendMessage };
};
