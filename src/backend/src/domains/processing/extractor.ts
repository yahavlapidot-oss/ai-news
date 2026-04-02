import * as cheerio from 'cheerio';

/**
 * Strips HTML tags and normalizes whitespace from raw article content.
 * Falls back to the raw string if no HTML detected.
 */
export function extractCleanText(rawContent: string): string {
  if (!rawContent) return '';

  // If it looks like HTML, parse it
  if (rawContent.includes('<')) {
    const $ = cheerio.load(rawContent);
    // Remove script/style/nav/footer noise
    $('script, style, nav, footer, aside, .ad, .advertisement').remove();
    const text = $('body').text();
    return normalizeWhitespace(text);
  }

  return normalizeWhitespace(rawContent);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Truncate content for Claude API to stay within token limits.
 * Keeps the most relevant leading content.
 */
export function truncateForProcessing(text: string, maxChars = 8000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...[truncated]';
}
