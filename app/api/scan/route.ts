import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { sanityClient, sanityReadClient } from '@/sanity/client';
import { findPotentialCopies, extractSearchPhrases } from '@/agent/search';
import { fetchAndExtract, type ExtractedContent } from '@/agent/fetcher';
import { interpretVerdict, type AttributionReport } from '@/agent/verdict';
import { generateDMCATemplate } from '@/agent/dmca';

export const maxDuration = 60; // Max allowed for Vercel Hobby

interface CanonicalArticle {
  _id: string;
  title: string;
  bodyPlaintext: string;
  canonicalUrl: string;
  publishedAt: string;
  platform: string;
  authorName?: string;
}

interface CandidateCopy {
  url: string;
  title: string;
  snippet: string;
  verdict: string;
  overlapPercent: number;
  attribution: AttributionReport | null;
  dmcaTemplate: string | null;
  matchedPassages: Array<{ original: string; found: string }>;
  foundDate: string | null;
  checkedAt: string;
}

/**
 * POST /api/scan
 *
 * Primary flow:
 * 1. Accept a user's original DEV.to URL.
 * 2. Fetch and extract the canonical post.
 * 3. Search the web for duplicate/republished copies.
 * 4. Compare candidate pages against the canonical content.
 * 5. Return overlap, attribution evidence, and a DMCA template when needed.
 *
 * Backward compatibility: still accepts { articleId } for seeded Sanity articles.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const devToUrl = typeof body.devToUrl === 'string' ? body.devToUrl : body.url;
    const articleId = typeof body.articleId === 'string' ? body.articleId : '';

    if (devToUrl) {
      return scanDevToPost(devToUrl);
    }

    if (articleId) {
      return scanSanityArticle(articleId);
    }

    return NextResponse.json(
      { error: 'devToUrl is required' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Scan failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function scanDevToPost(inputUrl: string) {
  const canonicalUrl = normalizeDevToUrl(inputUrl);

  if (!canonicalUrl) {
    return NextResponse.json(
      { error: 'Please provide a valid DEV.to post URL.' },
      { status: 400 }
    );
  }

  const original = await fetchAndExtract(canonicalUrl);

  if (!original || !original.text || original.text.length < 100) {
    return NextResponse.json(
      { error: 'Could not extract enough text from the DEV.to post.' },
      { status: 422 }
    );
  }

  const article = buildCanonicalArticle(original, canonicalUrl);
  await persistOriginalArticle(article, canonicalUrl);

  return scanCanonicalArticle({ ...article, authorName: article.authorName || undefined });
}

async function scanSanityArticle(articleId: string) {
  const article = await sanityReadClient.fetch(
    `*[_type == "article" && _id == $id][0]{
      _id, title, bodyPlaintext, canonicalUrl, publishedAt, platform,
      "authorName": author->name
    }`,
    { id: articleId }
  );

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  if (!article.bodyPlaintext) {
    return NextResponse.json({ error: 'Article has no body text to compare' }, { status: 422 });
  }

  return scanCanonicalArticle(article);
}

async function scanCanonicalArticle(article: CanonicalArticle) {
  const phrases = extractSearchPhrases(article.bodyPlaintext, article.title);

  if (phrases.length === 0) {
    return NextResponse.json(
      { error: 'Could not extract distinctive phrases from article' },
      { status: 422 }
    );
  }

  const parsedCanonical = new URL(article.canonicalUrl);
  const canonicalDomain = parsedCanonical.hostname.replace(/^www\./, '').toLowerCase();
  
  const excludeDomains = Array.from(new Set([canonicalDomain, 'dev.to', 'forem.com']));
  const searchResults = await findPotentialCopies(phrases, excludeDomains);
  const copies = await inspectCandidateCopies(article, searchResults);

  return NextResponse.json({
    article: {
      id: article._id,
      title: article.title,
      canonicalUrl: article.canonicalUrl,
      publishedAt: article.publishedAt,
      authorName: article.authorName || null,
    },
    sanityAnalysis: {
      engine: 'Sanity-backed content reconciliation',
      checkedCandidates: Math.min(searchResults.length, 8),
      attributionRule: 'Credited only when the repost includes both the original author name and original post link.',
    },
    phrasesSearched: phrases,
    totalSearchResults: searchResults.length,
    copies,
    scannedAt: new Date().toISOString(),
  });
}

async function inspectCandidateCopies(
  article: CanonicalArticle,
  searchResults: Array<{ title: string; link: string; snippet: string; date?: string }>
): Promise<CandidateCopy[]> {
  const copies: CandidateCopy[] = [];
  const originalKey = comparableUrl(article.canonicalUrl);
  const topResults = searchResults
    .filter((result) => result.link && comparableUrl(result.link) !== originalKey)
    .slice(0, 5);

  // Process sequentially to avoid JSDOM memory spikes on Vercel
  for (const result of topResults) {
    try {
      const extracted = await fetchAndExtract(result.link);
      if (!extracted || !extracted.text || extracted.text.length < 100) continue;
      if (comparableUrl(extracted.url) === originalKey) continue;

      const verdictResult = interpretVerdict(extracted, [article]);
      if (verdictResult.verdict === 'no_match' || verdictResult.verdict === 'original') continue;

      const overlapPercent = Math.min(100, Math.max(0, Math.round(verdictResult.confidence * 100)));
      const matchedPassages = verdictResult.reconciledEntries.slice(0, 3).map((entry) => ({
        original: entry.originalPassage,
        found: entry.foundPassage,
      }));
      const checkedAt = new Date().toISOString();
      const foundDate = extracted.publishDate || result.date || null;
      const title = extracted.title || result.title || result.link;
      const dmcaTemplate = verdictResult.verdict === 'unattributed_repost'
        ? generateDMCATemplate({
          originalTitle: article.title,
          originalUrl: article.canonicalUrl,
          originalPublishDate: article.publishedAt,
          checkedTitle: title,
          checkedUrl: result.link,
          overlapPercent,
          attribution: verdictResult.attribution,
          matchedPassages,
          authorName: article.authorName,
        })
        : null;

      await persistProvenanceCheck({
        article,
        checkedUrl: result.link,
        checkedTitle: title,
        verdict: verdictResult.verdict,
        reconciledEntries: verdictResult.reconciledEntries,
        checkedAt,
        overlapPercent,
        attribution: verdictResult.attribution,
        dmcaTemplate,
      });

      copies.push({
        url: result.link,
        title,
        snippet: result.snippet,
        verdict: verdictResult.verdict,
        overlapPercent,
        attribution: verdictResult.attribution,
        dmcaTemplate,
        matchedPassages,
        foundDate,
        checkedAt,
      });
    } catch (err) {
      console.error(`Failed to check ${result.link}:`, err);
    }
  }

  return copies;
}

function buildCanonicalArticle(extracted: ExtractedContent, canonicalUrl: string): CanonicalArticle {
  const fallbackAuthor = usernameFromDevToUrl(canonicalUrl);

  return {
    _id: `article-devto-url-${hashValue(canonicalUrl)}`,
    title: extracted.title || canonicalUrl,
    bodyPlaintext: extracted.text,
    canonicalUrl,
    publishedAt: extracted.publishDate || new Date().toISOString(),
    platform: 'devto',
    authorName: extracted.author || fallbackAuthor || undefined,
  };
}

async function persistOriginalArticle(article: CanonicalArticle, profileSourceUrl: string) {
  try {
    const authorId = article.authorName
      ? `author-devto-url-${hashValue(article.authorName)}`
      : null;

    if (authorId && article.authorName) {
      await sanityClient.createOrReplace({
        _id: authorId,
        _type: 'author',
        name: article.authorName,
        handle: usernameFromDevToUrl(profileSourceUrl),
        profileUrl: devToProfileUrl(profileSourceUrl),
        bio: `Original author for ${article.title}`,
      });
    }

    await sanityClient.createOrReplace({
      _id: article._id,
      _type: 'article',
      title: article.title,
      slug: { _type: 'slug', current: slugify(article.title) },
      bodyPlaintext: article.bodyPlaintext,
      publishedAt: article.publishedAt,
      canonicalUrl: article.canonicalUrl,
      platform: 'devto',
      ...(authorId ? { author: { _type: 'reference', _ref: authorId } } : {}),
    });
  } catch (err) {
    console.warn('Could not persist original article to Sanity:', err);
  }
}

async function persistProvenanceCheck(params: {
  article: CanonicalArticle;
  checkedUrl: string;
  checkedTitle: string;
  verdict: string;
  reconciledEntries: Array<{
    originalPassage: string;
    foundPassage: string;
    sourceUrl: string;
    sourceDate: string;
  }>;
  checkedAt: string;
  overlapPercent: number;
  attribution: AttributionReport | null;
  dmcaTemplate: string | null;
}) {
  try {
    await sanityClient.create({
      _type: 'provenanceCheck',
      checkedUrl: params.checkedUrl,
      checkedTitle: params.checkedTitle,
      verdict: params.verdict,
      matchedArticle: { _type: 'reference', _ref: params.article._id },
      reconciledEntries: params.reconciledEntries,
      checkedAt: params.checkedAt,
      overlapPercent: params.overlapPercent,
      attribution: params.attribution,
      dmcaTemplate: params.dmcaTemplate,
    });
  } catch (err) {
    console.warn('Could not persist provenance check to Sanity:', err);
  }
}

function normalizeDevToUrl(input: string): string | null {
  try {
    const parsed = new URL(input.trim());
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (hostname !== 'dev.to' || segments.length < 2) return null;

    parsed.protocol = 'https:';
    parsed.hostname = 'dev.to';
    parsed.hash = '';
    parsed.search = '';

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function comparableUrl(value: string): string {
  try {
    const parsed = new URL(value);
    return `${parsed.hostname.replace(/^www\./, '').toLowerCase()}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return value.toLowerCase().replace(/\/$/, '');
  }
}

function usernameFromDevToUrl(value: string): string {
  try {
    const parsed = new URL(value);
    return parsed.pathname.split('/').filter(Boolean)[0] || '';
  } catch {
    return '';
  }
}

function devToProfileUrl(value: string): string | undefined {
  const username = usernameFromDevToUrl(value);
  return username ? `https://dev.to/${username}` : undefined;
}

function hashValue(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);

  return slug || 'devto-post';
}
