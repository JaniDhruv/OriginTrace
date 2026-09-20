import { NextResponse } from 'next/server';
import { sanityReadClient } from '@/sanity/client';

export async function GET() {
  try {
    const query = `*[_type == "article"] | order(publishedAt desc) {
      _id,
      title,
      canonicalUrl,
      publishedAt,
      platform,
      tags
    }`;

    const articles = await sanityReadClient.fetch(query);

    return NextResponse.json({ articles });
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    return NextResponse.json({ articles: [] });
  }
}
