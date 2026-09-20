/**
 * Verdict interpreter — compares extracted content against canonical articles
 * from Sanity and determines a provenance verdict.
 *
 * Uses word-level shingle overlap (5-grams) for robust comparison that
 * survives formatting differences, minor edits, and content reordering.
 */

import type { ExtractedContent } from './fetcher';

interface SanityArticle {
  _id: string;
  title: string;
  bodyPlaintext: string;
  canonicalUrl: string;
  publishedAt: string;
  platform: string;
  authorName?: string;
}

interface ReconciledEntry {
  originalPassage: string;
  foundPassage: string;
  sourceUrl: string;
  sourceDate: string;
}

export interface VerdictResult {
  verdict: 'original' | 'credited_syndication' | 'unattributed_repost' | 'no_match' | 'pending';
  matchedArticleId: string | null;
  reconciledEntries: ReconciledEntry[];
  confidence: number;
  attribution: AttributionReport | null;
}

export interface AttributionReport {
  hasAuthorName: boolean;
  hasOriginalLink: boolean;
  hasAttributionPhrase: boolean;
  detectedAuthor: string | null;
  signals: string[];
  missing: string[];
  isProperlyAttributed: boolean;
}

/**
 * Interpret the provenance verdict by comparing extracted content
 * against indexed articles.
 */
export function interpretVerdict(
  extracted: ExtractedContent,
  articles: SanityArticle[]
): VerdictResult {
  if (!articles || articles.length === 0) {
    return { verdict: 'no_match', matchedArticleId: null, reconciledEntries: [], confidence: 0, attribution: null };
  }

  const extractedWords = tokenize(extracted.text);

  let bestMatch: {
    article: SanityArticle;
    overlapRatio: number;
    matchedPassages: ReconciledEntry[];
  } | null = null;

  for (const article of articles) {
    if (!article.bodyPlaintext) continue;

    // Skip self-check (same canonical URL)
    if (article.canonicalUrl === extracted.url) {
      return { verdict: 'original', matchedArticleId: article._id, reconciledEntries: [], confidence: 1, attribution: null };
    }

    const articleWords = tokenize(article.bodyPlaintext);

    // Method 1: Word overlap ratio
    const wordOverlap = computeWordOverlap(articleWords, extractedWords);
    // Method 2: 5-gram shingle overlap
    const shingleOverlap = computeShingleOverlap(articleWords, extractedWords, 5);
    // Method 3: LCS ratio
    const lcsRatio = computeLCSRatio(articleWords, extractedWords);

    // Combined score
    const combinedScore = (wordOverlap * 0.2) + (shingleOverlap * 0.5) + (lcsRatio * 0.3);

    const matchedPassages = findMatchingPassages(
      article.bodyPlaintext, extracted.text, article.canonicalUrl, article.publishedAt
    );

    if (!bestMatch || combinedScore > bestMatch.overlapRatio) {
      bestMatch = { article, overlapRatio: combinedScore, matchedPassages };
    }
  }

  const urlLower = extracted.url.toLowerCase();
  const htmlLower = extracted.rawHtml?.toLowerCase() || '';
  const isDevToNetwork = 
    urlLower.includes('practicaldev') ||
    urlLower.includes('benhalpern') ||
    urlLower.includes('forem') ||
    urlLower.includes('dev.to') ||
    htmlLower.includes('forem');

  if (!bestMatch || bestMatch.overlapRatio < 0.02 || (isDevToNetwork && bestMatch.matchedPassages.length === 0)) {
    return {
      verdict: 'no_match', matchedArticleId: null, reconciledEntries: [],
      confidence: 1 - (bestMatch?.overlapRatio || 0), attribution: null,
    };
  }

  // Check for attribution — using outbound links, raw HTML, and author name
  const attribution = analyzeAttribution(
    extracted,
    bestMatch.article.canonicalUrl,
    bestMatch.article.title,
    bestMatch.article.authorName || ''
  );

  if (attribution.isProperlyAttributed) {
    return {
      verdict: 'credited_syndication', matchedArticleId: bestMatch.article._id,
      reconciledEntries: bestMatch.matchedPassages.slice(0, 5), confidence: bestMatch.overlapRatio,
      attribution,
    };
  }

  return {
    verdict: 'unattributed_repost', matchedArticleId: bestMatch.article._id,
    reconciledEntries: bestMatch.matchedPassages.slice(0, 5), confidence: bestMatch.overlapRatio,
    attribution,
  };
}

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['']/g, "'").replace(/[""]/g, '"').replace(/[—–]/g, '-')
    .replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ')
    .filter(w => w.length > 1);
}

// ---------------------------------------------------------------------------
// Method 1: Word overlap
// ---------------------------------------------------------------------------

function computeWordOverlap(wordsA: string[], wordsB: string[]): number {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
    'like', 'no', 'just', 'him', 'know', 'take', 'into', 'your', 'some', 'could', 'them',
    'than', 'other', 'been', 'has', 'its', 'two', 'more', 'was', 'is', 'are', 'were', 'had', 'did',
  ]);

  const filteredA = new Set([...new Set(wordsA)].filter(w => !stopWords.has(w) && w.length > 2));
  const filteredB = new Set([...new Set(wordsB)].filter(w => !stopWords.has(w) && w.length > 2));

  if (filteredA.size === 0 || filteredB.size === 0) return 0;

  let intersection = 0;
  for (const word of filteredA) {
    if (filteredB.has(word)) intersection++;
  }

  return intersection / Math.min(filteredA.size, filteredB.size);
}

// ---------------------------------------------------------------------------
// Method 2: N-gram shingle overlap
// ---------------------------------------------------------------------------

function computeShingleOverlap(wordsA: string[], wordsB: string[], n: number): number {
  const shinglesA = getShingles(wordsA, n);
  const shinglesB = getShingles(wordsB, n);

  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;

  let intersection = 0;
  for (const s of shinglesA) {
    if (shinglesB.has(s)) intersection++;
  }

  return intersection / Math.min(shinglesA.size, shinglesB.size);
}

function getShingles(words: string[], n: number): Set<string> {
  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

// ---------------------------------------------------------------------------
// Method 3: LCS ratio
// ---------------------------------------------------------------------------

function computeLCSRatio(wordsA: string[], wordsB: string[]): number {
  const maxLen = 500;
  const a = wordsA.length > maxLen ? wordsA.slice(0, maxLen) : wordsA;
  const b = wordsB.length > maxLen ? wordsB.slice(0, maxLen) : wordsB;

  if (a.length === 0 || b.length === 0) return 0;

  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
      curr[j] = 0;
    }
  }

  return prev[b.length] / Math.min(a.length, b.length);
}

// ---------------------------------------------------------------------------
// Matching passages for side-by-side display
// ---------------------------------------------------------------------------

function findMatchingPassages(
  originalText: string, checkedText: string, sourceUrl: string, sourceDate: string
): ReconciledEntry[] {
  const passages: ReconciledEntry[] = [];
  const origChunks = splitIntoSentences(originalText);
  const checkChunks = splitIntoSentences(checkedText);

  for (const origChunk of origChunks) {
    if (origChunk.length < 60) continue;
    const origWords = tokenize(origChunk);
    if (origWords.length < 8) continue;

    for (const checkChunk of checkChunks) {
      if (checkChunk.length < 60) continue;
      const checkWords = tokenize(checkChunk);
      if (checkWords.length < 8) continue;

      const overlap = computeShingleOverlap(origWords, checkWords, 4);

      if (overlap > 0.3) {
        passages.push({
          originalPassage: origChunk.slice(0, 500),
          foundPassage: checkChunk.slice(0, 500),
          sourceUrl, sourceDate,
        });
        if (passages.length >= 5) return passages;
        break;
      }
    }
  }

  return passages;
}

function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n\n+/).map(s => s.trim()).filter(s => s.length > 30);
}

// ---------------------------------------------------------------------------
// Attribution check — uses outbound links, raw HTML, author name
// ---------------------------------------------------------------------------

export function analyzeAttribution(
  extracted: ExtractedContent,
  originalUrl: string,
  originalTitle: string,
  authorName: string = ''
): AttributionReport {
  const targetText = extracted.text || '';
  const rawHtml = extracted.rawHtml || '';
  const outboundLinks = extracted.outboundLinks || [];
  const lowerText = targetText.toLowerCase();
  const lowerHtml = rawHtml.toLowerCase();
  const originalUrlLower = originalUrl.toLowerCase();
  const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '').toLowerCase();
  const signals: string[] = [];

  // Check outbound links for canonical URL
  let hasOriginalLink = false;
  for (const link of outboundLinks) {
    const linkLower = link.toLowerCase();
    if (linkLower.includes(urlWithoutProtocol)) {
      hasOriginalLink = true;
      signals.push('Links to the original post URL');
      break;
    }
    if (linkLower.includes('dev.to') && originalUrlLower.includes('dev.to')) {
      const origSlug = originalUrlLower.split('/').pop();
      if (origSlug && origSlug.length > 5 && linkLower.includes(origSlug)) {
        hasOriginalLink = true;
        signals.push('Links to a matching Dev.to slug');
        break;
      }
    }
  }

  // Check raw HTML for URL mention
  if (!hasOriginalLink && lowerHtml.includes(urlWithoutProtocol)) {
    hasOriginalLink = true;
    signals.push('Mentions the original URL in page HTML');
  }

  // Check cleaned text for URL
  if (!hasOriginalLink && (lowerText.includes(originalUrlLower) || lowerText.includes(urlWithoutProtocol))) {
    hasOriginalLink = true;
    signals.push('Mentions the original URL in page text');
  }

  // Check for author name + attribution signal
  let hasAuthorName = false;
  if (authorName && authorName.length > 3) {
    const authorLower = authorName.toLowerCase();
    if (lowerText.includes(authorLower) || lowerHtml.includes(authorLower)) {
      hasAuthorName = true;
      signals.push(`Mentions original author: ${authorName}`);
    }
  }

  // Check attribution phrases + title
  const titleLower = originalTitle.toLowerCase();
  let hasAttributionPhrase = false;
  const phrases = [
    'originally published', 'originally posted', 'cross-posted from',
    'source:', 'via ', 'credit:', 'first appeared on', 'republished from', 'originally appeared',
  ];
  for (const phrase of phrases) {
    if (lowerText.includes(phrase) || lowerHtml.includes(phrase)) {
      hasAttributionPhrase = true;
      signals.push(`Uses attribution phrase: ${phrase}`);
      break;
    }
  }

  if (titleLower.length > 6 && (lowerText.includes(titleLower) || lowerHtml.includes(titleLower))) {
    signals.push('Mentions the original title');
  }

  const missing: string[] = [];
  if (!hasAuthorName) missing.push('original author name');
  if (!hasOriginalLink) missing.push('original post link');

  return {
    hasAuthorName,
    hasOriginalLink,
    hasAttributionPhrase,
    detectedAuthor: extracted.author || null,
    signals,
    missing,
    isProperlyAttributed: hasAuthorName && hasOriginalLink,
  };
}
