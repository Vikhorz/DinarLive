import type { ChatApiRequest } from '../types';
import { createChatResponse } from '../server/chatService.js';

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as ChatApiRequest;
    const response = await createChatResponse(payload);
    return Response.json(response, {
      headers: {
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to generate chat response',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
