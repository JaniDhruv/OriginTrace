/**
 * Seed script: Fetches articles from DEV.to API and uploads them to Sanity.
 *
 * Usage:
 *   DEVTO_HANDLE=dj29 npx tsx scripts/seed.ts
 *
 * Or set DEVTO_HANDLE in .env.local (defaults to "dj29").
 *
 * Requires SANITY_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, and
 * NEXT_PUBLIC_SANITY_DATASET to be set in environment or .env.local.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@sanity/client';

// Load .env.local since this script runs outside of Next.js
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local not found — rely on environment variables
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEVTO_HANDLE = process.env.DEVTO_HANDLE || 'dj29';
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

if (!SANITY_PROJECT_ID || !SANITY_TOKEN) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN'
  );
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: SANITY_TOKEN,
});

// ---------------------------------------------------------------------------
// DEV.to API types
// ---------------------------------------------------------------------------

interface DevToArticle {
  id: number;
  title: string;
  slug: string;
  url: string;
  published_at: string;
  body_markdown: string;
  body_html: string;
  tag_list: string[];
  user: {
    name: string;
    username: string;
    profile_image: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

function htmlToPlaintext(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownToPortableText(markdown: string) {
  // Split into paragraphs and create basic Portable Text blocks
  const paragraphs = markdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `block-${i}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `span-${i}`,
        text,
        marks: [],
      },
    ],
  }));
}

// ---------------------------------------------------------------------------
// Fetch articles from DEV.to
// ---------------------------------------------------------------------------

async function fetchDevToArticles(username: string): Promise<DevToArticle[]> {
  const perPage = 30;
  let page = 1;
  const allArticles: DevToArticle[] = [];

  console.log(`Fetching articles for DEV.to user: ${username}`);

  while (true) {
    const listUrl = `https://dev.to/api/articles?username=${username}&per_page=${perPage}&page=${page}`;
    const listRes = await fetch(listUrl);

    if (!listRes.ok) {
      throw new Error(`DEV.to API error: ${listRes.status} ${listRes.statusText}`);
    }

    const listData = await listRes.json();

    if (!Array.isArray(listData) || listData.length === 0) break;

    // Fetch full article content for each (list endpoint doesn't include body)
    for (const item of listData) {
      const articleUrl = `https://dev.to/api/articles/${item.id}`;
      const articleRes = await fetch(articleUrl);

      if (!articleRes.ok) {
        console.warn(`  Skipping article ${item.id}: ${articleRes.status}`);
        continue;
      }

      const fullArticle: DevToArticle = await articleRes.json();
      allArticles.push(fullArticle);
      console.log(`  Fetched: "${fullArticle.title}"`);

      // Rate limit: DEV.to API allows ~30 req/min
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (listData.length < perPage) break;
    page++;
  }

  console.log(`Total articles fetched: ${allArticles.length}`);
  return allArticles;
}

// ---------------------------------------------------------------------------
// Seed Sanity
// ---------------------------------------------------------------------------

async function seed() {
  console.log('=== OriginTrace Seed Script ===\n');

  const articles = await fetchDevToArticles(DEVTO_HANDLE);

  if (articles.length === 0) {
    console.log('No articles found. Check the DEVTO_HANDLE.');
    return;
  }

  // Create or update author document
  const firstArticle = articles[0];
  const authorId = `author-${DEVTO_HANDLE}`;

  // Create or update user document
  const userId = `user-${DEVTO_HANDLE}`;
  console.log(`\nCreating user profile for: ${firstArticle.user.name}`);
  await client.createOrReplace({
    _id: userId,
    _type: 'user',
    name: firstArticle.user.name,
    email: `${DEVTO_HANDLE}@example.com`,
    authId: `auth-${DEVTO_HANDLE}`,
    avatarUrl: firstArticle.user.profile_image,
  });

  console.log(`\nCreating author: ${firstArticle.user.name} (@${DEVTO_HANDLE})`);

  await client.createOrReplace({
    _id: authorId,
    _type: 'author',
    name: firstArticle.user.name,
    handle: DEVTO_HANDLE,
    profileUrl: `https://dev.to/${DEVTO_HANDLE}`,
    bio: `Articles by ${firstArticle.user.name} on DEV.to`,
  });

  // Create article documents
  console.log('\nSeeding articles into Sanity...\n');

  for (const article of articles) {
    const articleId = `article-devto-${article.id}`;
    const plaintext = htmlToPlaintext(article.body_html || '');
    const portableText = markdownToPortableText(article.body_markdown || '');

    try {
      await client.createOrReplace({
        _id: articleId,
        _type: 'article',
        title: article.title,
        slug: { _type: 'slug', current: slugify(article.slug || article.title) },
        body: portableText,
        bodyPlaintext: plaintext,
        publishedAt: article.published_at,
        canonicalUrl: article.url,
        platform: 'devto',
        author: { _type: 'reference', _ref: authorId },
        user: { _type: 'reference', _ref: userId },
        tags: article.tag_list || [],
      });

      console.log(`  ✓ ${article.title}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${article.title}`, err);
    }
  }

  console.log('\n=== Seeding complete ===');
  console.log(`  Author: ${firstArticle.user.name} (@${DEVTO_HANDLE})`);
  console.log(`  Articles: ${articles.length}`);
  console.log(`  Dataset: ${SANITY_DATASET}`);
  console.log(`  Project: ${SANITY_PROJECT_ID}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
