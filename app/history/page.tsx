import { sanityReadClient } from '@/sanity/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface HistoryArticle {
  _id: string;
  title: string;
  canonicalUrl: string;
  authorName: string | null;
  totalChecks: number;
  actionableCount: number;
  lastCheckedAt: string;
}

async function getHistory(): Promise<HistoryArticle[]> {
  const query = `*[_type == "article" && count(*[_type == "provenanceCheck" && matchedArticle._ref == ^._id]) > 0] {
    _id,
    title,
    canonicalUrl,
    "authorName": author->name,
    "totalChecks": count(array::unique(*[_type == "provenanceCheck" && matchedArticle._ref == ^._id].checkedUrl)),
    "actionableCount": count(array::unique(*[_type == "provenanceCheck" && matchedArticle._ref == ^._id && verdict == 'unattributed_repost'].checkedUrl)),
    "lastCheckedAt": *[_type == "provenanceCheck" && matchedArticle._ref == ^._id] | order(checkedAt desc)[0].checkedAt
  } | order(lastCheckedAt desc)[0...50]`;

  return sanityReadClient.fetch(query);
}

export default async function HistoryPage() {
  const history = await getHistory();

  return (
    <div className="container page" style={{ paddingTop: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Scan <span className="text-gradient">Ledger</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>
            All DEV.to posts that have been scanned and tracked on OriginTrace.
          </p>
        </div>
        <div className="badge neutral">Live Network</div>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏱</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>No Scans Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Be the first to run a scan on the homepage to start building the history ledger.
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 24 }}>
            Go to Scanner
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map((article, i) => (
            <div key={article._id} className="result-card safe" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="result-card-inner" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="badge safe" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>Tracked Post</div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Last scan: {new Date(article.lastCheckedAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="result-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                    {article.title}
                  </div>
                  <a href={article.canonicalUrl} target="_blank" rel="noopener noreferrer" className="result-url" style={{ fontSize: '0.9rem' }}>
                    {article.canonicalUrl}
                  </a>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{article.totalChecks}</div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Copies Found</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: article.actionableCount > 0 ? 'var(--color-repost)' : 'var(--text-main)' }}>
                      {article.actionableCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Actionable</div>
                  </div>
                  
                  <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border-glass)' }}>
                    <Link href={`/report/${article._id}`} className="btn btn-secondary">
                      View Report ↗
                    </Link>
                  </div>
                </div>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
