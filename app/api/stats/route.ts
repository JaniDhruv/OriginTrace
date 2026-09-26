import { NextResponse } from 'next/server';
import { sanityReadClient } from '@/sanity/client';

export async function GET() {
  try {
    const articlesQuery = `count(*[_type == "article"])`;
    const checksQuery = `count(array::unique(*[_type == "provenanceCheck"].checkedUrl))`;
    const repostsQuery = `count(array::unique(*[_type == "provenanceCheck" && verdict == "unattributed_repost"].checkedUrl))`;

    const [articles, checks, reposts] = await Promise.all([
      sanityReadClient.fetch(articlesQuery),
      sanityReadClient.fetch(checksQuery),
      sanityReadClient.fetch(repostsQuery),
    ]);

    return NextResponse.json({ articles, checks, reposts });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    return NextResponse.json({ articles: 0, checks: 0, reposts: 0 });
  }
}
