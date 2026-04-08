import { createRatesResponse } from '../server/ratesService.js';

export const maxDuration = 15;

export async function GET() {
  try {
    const payload = await createRatesResponse();
    return Response.json(payload, {
      headers: {
        'cache-control': 's-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to fetch rates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
