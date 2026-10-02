/**
 * Web search agent — uses Serper.dev (Google Search API) to find
 * potential copies of an article across the entire web.
 */

const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const SERPER_ENDPOINT = 'https://google.serper.dev/search';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

/**
 * Search the web for a quoted phrase, excluding specified domains.
 */
export async function searchWeb(
  phrase: string,
  excludeDomains: string[] = ['dev.to']
): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY not configured');
  }

  // Build query: quoted phrase + site exclusions
  const exclusions = excludeDomains.map(d => `-site:${d}`).join(' ');
  const query = `"${phrase}" ${exclusions}`;

  const response = await fetch(SERPER_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: 10,
    }),
  });

  if (!response.ok) {
    console.error(`Serper search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const organic = data.organic || [];

  return organic.map((r: { title?: string; link?: string; snippet?: string; date?: string }) => ({
    title: r.title || '',
    link: r.link || '',
    snippet: r.snippet || '',
    date: r.date || undefined,
  }));
}

/**
 * Search for potential copies of an article using multiple distinctive phrases.
 * Deduplicates results by URL.
 */
export async function findPotentialCopies(
  phrases: string[],
  excludeDomains: string[] = ['dev.to']
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const phrase of phrases) {
    try {
      const results = await searchWeb(phrase, excludeDomains);
      for (const result of results) {
        // Deduplicate by domain+path (ignore query params)
        const urlKey = normalizeUrl(result.link);
        if (!seenUrls.has(urlKey)) {
          seenUrls.add(urlKey);
          allResults.push(result);
        }
      }
    } catch (err) {
      console.error(`Search failed for phrase "${phrase}":`, err);
    }

    // Rate limit: 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allResults;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

/**
 * Extract 3–5 distinctive phrases from article text for search.
 */
export function extractSearchPhrases(text: string, title: string): string[] {
  const phrases: string[] = [];

  // Title is always a strong signal (trim to reasonable length)
  if (title && title.length > 15) {
    phrases.push(title.length > 100 ? title.slice(0, 100) : title);
  }

  // Split into sentences and pick distinctive ones
  const sentences = text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => {
      // Want sentences that are: long enough, not too long, and distinctive
      if (s.length < 50 || s.length > 180) return false;
      // Skip sentences that are mostly generic words
      const words = s.split(/\s+/);
      if (words.length < 8) return false;
      return true;
    });

  if (sentences.length === 0) return phrases;

  // Pick from beginning and middle of article
  const picks = [
    0,
    Math.floor(sentences.length * 0.5),
  ];

  for (const idx of picks) {
    if (idx >= 0 && idx < sentences.length && phrases.length < 3) {
      const sentence = sentences[idx];
      // Trim to ~12 words for a focused search query
      const words = sentence.split(/\s+/).slice(0, 12).join(' ');
      if (words.length > 30 && !phrases.includes(words)) {
        phrases.push(words);
      }
    }
  }

  return phrases.slice(0, 3);
}
