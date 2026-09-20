import { NextResponse } from 'next/server';
import { sanityReadClient } from '@/sanity/client';

export async function GET() {
  try {
    const query = `*[_type == "provenanceCheck"] | order(checkedAt desc) [0..9] {
      _id,
      checkedUrl,
      checkedTitle,
      verdict,
      checkedAt
    }`;

    const checks = await sanityReadClient.fetch(query);

    return NextResponse.json({ checks });
  } catch (err) {
    console.error('Failed to fetch checks:', err);
    return NextResponse.json({ checks: [] });
  }
}
