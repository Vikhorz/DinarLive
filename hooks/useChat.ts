import { useState, useCallback } from 'react';
import type {
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
  ExchangeRateData,
  Translation,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const CHAT_API_ENDPOINT = `${API_BASE_URL}/api/chat`;

const getLocaleFromTranslations = (t: Translation): ChatApiRequest['locale'] => {
  if (t.appName === 'دينار لايف') return 'ar';
  if (t.appName === 'دینار ڵایڤ') return 'ku';
  return 'en';
};

export const useChat = (rateData: ExchangeRateData | null, t: Translation) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedMessage };
    const history = [...messages];

    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const payload: ChatApiRequest = {
        message: trimmedMessage,
        history,
        rateData,
        locale: getLocaleFromTranslations(t),
      };

      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(errorPayload?.message || `Chat API returned ${response.status}`);
      }

      const data = await response.json() as ChatApiResponse;
      setMessages((prev) => [...prev, { role: 'model', content: data.message }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: error instanceof Error ? error.message : "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, rateData, t]);

  return { messages, isLoading, sendMessage };
};
