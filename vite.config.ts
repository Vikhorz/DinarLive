import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { createRatesResponse } from './server/ratesService';
import { createChatResponse } from './server/chatService';

const ratesApiPlugin = (): PluginOption => ({
  name: 'dinarlive-backend-api',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/api/rates', async (req, res, next) => {
      if (req.method !== 'GET') {
        next();
        return;
      }

      try {
        const payload = await createRatesResponse();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          error: 'Failed to fetch rates',
          message: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    });

    server.middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      try {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const response = await createChatResponse(payload);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(response));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              error: 'Failed to generate chat response',
              message: error instanceof Error ? error.message : 'Unknown error',
            }));
          }
        });
      } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          error: 'Failed to generate chat response',
          message: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY;
  process.env.GEMINI_CHAT_MODEL ||= env.GEMINI_CHAT_MODEL;
  process.env.TELEGRAM_MARKET_SOURCES ||= env.TELEGRAM_MARKET_SOURCES;
  process.env.FRONTEND_ORIGIN ||= env.FRONTEND_ORIGIN;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), ratesApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
