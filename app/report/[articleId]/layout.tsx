import type { Metadata } from 'next';
import { sanityReadClient } from '@/sanity/client';

interface Props {
  params: Promise<{ articleId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { articleId } = await params;

  try {
    const article = await sanityReadClient.fetch(
      `*[_type == "article" && _id == $articleId][0]{ title, "authorName": author->name }`,
      { articleId }
    );

    const totalCopies = await sanityReadClient.fetch(
      `count(array::unique(*[_type == "provenanceCheck" && matchedArticle._ref == $articleId].checkedUrl))`,
      { articleId }
    );

    const actionable = await sanityReadClient.fetch(
      `count(array::unique(*[_type == "provenanceCheck" && matchedArticle._ref == $articleId && verdict == "unattributed_repost"].checkedUrl))`,
      { articleId }
    );

    if (!article) {
      return { title: 'Report Not Found' };
    }

    const shortTitle = article.title.length > 40 ? article.title.slice(0, 40) + '…' : article.title;
    const title = `${totalCopies} copies of "${shortTitle}"`;
    const description = `OriginTrace found ${totalCopies} copies of "${article.title}" by ${article.authorName || 'Unknown'}. ${actionable} require DMCA takedowns.`;

    return {
      title,
      description,
      openGraph: {
        title: `OriginTrace — ${title}`,
        description,
        siteName: 'OriginTrace',
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: `OriginTrace — ${title}`,
        description,
      },
    };
  } catch {
    return { title: 'Aggregated Report' };
  }
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
