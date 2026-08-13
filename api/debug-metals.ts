import {
  DEFAULT_METALS_SOURCE,
  METAL_ALIASES,
  extractTelegramPosts,
  extractUsdPriceNearAliases,
  fetchText,
} from '../server/ratesService.js';

export const maxDuration = 15;

// TEMPORARY: for diagnosing why the metals card isn't populating. Remove once fixed.
export async function GET() {
  try {
    const html = await fetchText(DEFAULT_METALS_SOURCE.url);
    const posts = extractTelegramPosts(html, DEFAULT_METALS_SOURCE);

    const postSamples = posts.slice(0, 20).map((post) => ({
      date: post.date,
      text: post.text.slice(0, 300),
      dubaiLira: extractUsdPriceNearAliases(post.text, METAL_ALIASES.dubaiLira),
      palmSilver: extractUsdPriceNearAliases(post.text, METAL_ALIASES.palmSilver),
      copper9999: extractUsdPriceNearAliases(post.text, METAL_ALIASES.copper9999),
    }));

    return Response.json({
      htmlLength: html.length,
      htmlSample: html.slice(0, 2000),
      blockCount: html.split('tgme_widget_message_wrap').length - 1,
      postsExtracted: posts.length,
      postSamples,
    });
  } catch (error) {
    return Response.json(
      {
        error: 'debug-metals fetch failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
