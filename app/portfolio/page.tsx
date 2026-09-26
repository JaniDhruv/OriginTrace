import { sanityReadClient } from '@/sanity/client';

export const dynamic = 'force-dynamic';

interface Article {
  _id: string;
  title: string;
  publishedAt: string;
  canonicalUrl: string;
  platform: string;
  tags: string[];
}

async function getArticles(): Promise<Article[]> {
  const query = `*[_type == "article"] | order(publishedAt desc) {
    _id,
    title,
    publishedAt,
    canonicalUrl,
    platform,
    tags
  }`;

  return sanityReadClient.fetch(query);
}

const PLATFORM_LABELS: Record<string, string> = {
  devto: 'DEV.to',
  medium: 'Medium',
  personal: 'Blog',
  other: 'Other',
};

export default async function PortfolioPage() {
  const articles = await getArticles();

  return (
    <div className="container page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1>Indexed <span className="text-gradient">Portfolio</span></h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            {articles.length} canonical articles stored in the Sanity Knowledge Base
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            No articles indexed yet. Run the seed script to import your DEV.to posts.
          </p>
          <code style={{ display: 'block', marginTop: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
            DEVTO_HANDLE=yourhandle npm run seed
          </code>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {articles.map((article) => (
            <div key={article._id} className="report-card safe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div className="report-title">{article.title}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span className="badge safe">{PLATFORM_LABELS[article.platform] || article.platform}</span>
                  {article.tags?.map((tag) => (
                    <span key={tag} className="badge" style={{ background: 'var(--bg-overlay)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ fontWeight: 600 }}>{new Date(article.publishedAt).toLocaleDateString()}</div>
                <a
                  href={article.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  View Original ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
