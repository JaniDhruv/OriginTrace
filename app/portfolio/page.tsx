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
      <div className="section-header">
        <div>
          <h1>Indexed Portfolio</h1>
          <p className="text-secondary" style={{ marginTop: 4 }}>
            {articles.length} articles in the Knowledge Base
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p className="text-secondary">
            No articles indexed yet. Run the seed script to import your DEV.to posts.
          </p>
          <code className="text-mono" style={{ display: 'block', marginTop: 12 }}>
            DEVTO_HANDLE=yourhandle npm run seed
          </code>
        </div>
      ) : (
        <div className="article-list">
          {articles.map((article) => (
            <div key={article._id} className="article-item">
              <div style={{ flex: 1 }}>
                <div className="article-title">{article.title}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {article.tags?.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="article-meta">
                <span>{PLATFORM_LABELS[article.platform] || article.platform}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                <a
                  href={article.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.8125rem' }}
                >
                  View original ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
