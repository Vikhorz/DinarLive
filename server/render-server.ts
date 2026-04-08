import express from 'express';
import { createRatesResponse } from './ratesService.js';
import { createChatResponse } from './chatService.js';
import type { ChatApiRequest } from '../types';

const app = express();
const port = Number(process.env.PORT || 10000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    service: 'dinarlive-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/rates', async (_req, res) => {
  try {
    const payload = await createRatesResponse();
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch rates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const payload = req.body as ChatApiRequest;
    const response = await createChatResponse(payload);
    res.setHeader('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate chat response',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`DinarLive backend listening on port ${port}`);
});
