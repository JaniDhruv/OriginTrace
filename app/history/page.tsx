import { sanityReadClient } from '@/sanity/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface HistoryCheck {
  _id: string;
  checkedUrl: string;
  verdict: string;
  checkedAt: string;
  matchedArticle: {
    title: string;
    canonicalUrl: string;
  } | null;
}

async function getHistory(): Promise<HistoryCheck[]> {
  const query = `*[_type == "provenanceCheck"] | order(checkedAt desc)[0...50] {
    _id,
    checkedUrl,
    verdict,
    checkedAt,
    "matchedArticle": matchedArticle->{
      title,
      canonicalUrl
    }
  }`;

  return sanityReadClient.fetch(query);
}

const VERDICT_STYLES: Record<string, { label: string; class: string }> = {
  original: { label: 'Original', class: 'safe' },
  credited_syndication: { label: 'Credited', class: 'safe' },
  unattributed_repost: { label: 'Takedown', class: 'danger' },
  no_match: { label: 'No Match', class: 'neutral' },
};

export default async function HistoryPage() {
  const history = await getHistory();

  return (
    <div className="container page" style={{ paddingTop: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Scan <span className="text-gradient">History</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Recent provenance checks executed on the OriginTrace network.
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
          {history.map((check) => {
            const vStyle = VERDICT_STYLES[check.verdict] || VERDICT_STYLES.no_match;
            
            return (
              <div key={check._id} className={`result-card ${vStyle.class}`}>
                <div className="result-card-inner" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <div className={`verdict-badge ${vStyle.class}`} style={{ padding: '4px 10px', fontSize: '0.65rem' }}>
                        {vStyle.class === 'danger' && <span className="verdict-badge-dot" />}
                        {vStyle.label}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(check.checkedAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: 600 }}>Scanned URL</div>
                      <a href={check.checkedUrl} target="_blank" rel="noopener noreferrer" className="result-url text-gradient" style={{ fontSize: '0.95rem' }}>
                        {check.checkedUrl}
                      </a>
                    </div>
                  </div>
                  
                  {check.matchedArticle && (
                    <div style={{ flex: 1, minWidth: '250px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '20px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Original Match</div>
                      <div className="result-title" style={{ fontSize: '0.9rem', marginBottom: '2px' }}>{check.matchedArticle.title}</div>
                    </div>
                  )}
                  
                  <div>
                    <Link href={`/check/${check._id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      View Report ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
