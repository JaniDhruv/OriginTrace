/**
 * Web page fetcher — extracts main content from a URL using
 * Mozilla Readability and Cheerio.
 * 
 * Also extracts outbound links and author attribution signals
 * from the raw HTML (not just cleaned text) to detect credited reposts.
 */

import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedContent {
  title: string;
  text: string;
  publishDate: string | null;
  author: string | null;
  url: string;
  /** All outbound links found on the page */
  outboundLinks: string[];
  /** Raw HTML for deeper attribution analysis */
  rawHtml: string;
}

/**
 * Fetch a URL and extract its main textual content.
 */
export async function fetchAndExtract(url: string): Promise<ExtractedContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OriginTrace/1.0 (Content Provenance Checker)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Fetch failed for ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract metadata with Cheerio
    const $ = cheerio.load(html);
    const publishDate = extractPublishDate($);
    const author = extractAuthor($);

    // Extract all outbound links
    const outboundLinks: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        outboundLinks.push(href);
      }
    });

    // Extract main content with Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent?.trim()) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      if (!bodyText) return null;

      return {
        title: $('title').text().trim() || url,
        text: bodyText.slice(0, 50000),
        publishDate,
        author,
        url,
        outboundLinks,
        rawHtml: html.slice(0, 100000),
      };
    }

    return {
      title: article.title || $('title').text().trim() || url,
      text: article.textContent.replace(/\s+/g, ' ').trim().slice(0, 50000),
      publishDate,
      author,
      url,
      outboundLinks,
      rawHtml: html.slice(0, 100000),
    };
  } catch (err) {
    console.error(`Fetch/extract error for ${url}:`, err);
    return null;
  }
}

/**
 * Try to extract publish date from meta tags, time elements, or JSON-LD.
 */
function extractPublishDate($: cheerio.CheerioAPI): string | null {
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish-date"]',
    'meta[name="DC.date.issued"]',
    'meta[property="og:article:published_time"]',
  ];

  for (const sel of metaSelectors) {
    const content = $(sel).attr('content');
    if (content) return content;
  }

  const timeEl = $('time[datetime]').first().attr('datetime');
  if (timeEl) return timeEl;

  const jsonLd = $('script[type="application/ld+json"]').first().html();
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd);
      if (data.datePublished) return data.datePublished;
      if (data.mainEntity?.datePublished) return data.mainEntity.datePublished;
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return null;
}

/**
 * Try to extract author from meta tags or JSON-LD.
 */
function extractAuthor($: cheerio.CheerioAPI): string | null {
  const metaAuthor = $('meta[name="author"]').attr('content');
  if (metaAuthor) return metaAuthor;

  const metaOgAuthor = $('meta[property="article:author"]').attr('content');
  if (metaOgAuthor) return metaOgAuthor;

  const jsonLd = $('script[type="application/ld+json"]').first().html();
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd);
      if (data.author?.name) return data.author.name;
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return null;
}
