import { NextResponse } from 'next/server';
import { sanityReadClient } from '@/sanity/client';

export async function GET(request: Request, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const { articleId } = await params;

    const articleQuery = `*[_type == "article" && _id == $articleId][0] {
      _id,
      title,
      canonicalUrl,
      publishedAt,
      "authorName": author->name
    }`;

    const article = await sanityReadClient.fetch(articleQuery, { articleId });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const checksQuery = `*[_type == "provenanceCheck" && matchedArticle._ref == $articleId] | order(checkedAt desc) {
      _id,
      "url": checkedUrl,
      "title": checkedTitle,
      verdict,
      overlapPercent,
      attribution,
      dmcaTemplate,
      checkedAt
    }`;

    const copies = await sanityReadClient.fetch(checksQuery, { articleId });

    // Deduplicate copies by URL (since they are ordered by checkedAt desc, the first seen is the latest)
    const seenUrls = new Set();
    const deduplicatedCopies = [];
    
    for (const copy of copies) {
      if (!seenUrls.has(copy.url)) {
        seenUrls.add(copy.url);
        deduplicatedCopies.push(copy);
      }
    }

    return NextResponse.json({ article, copies: deduplicatedCopies });
  } catch (err) {
    console.error('Report API error:', err);
    return NextResponse.json({ error: 'Failed to load report data' }, { status: 500 });
  }
}
