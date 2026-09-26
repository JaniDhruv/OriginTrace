'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AttributionReport {
  hasAuthorName: boolean;
  hasOriginalLink: boolean;
  missing?: string[];
  isProperlyAttributed: boolean;
}

interface CopyResult {
  _id: string;
  url: string;
  title: string;
  verdict: string;
  overlapPercent: number;
  attribution: AttributionReport | null;
  dmcaTemplate: string | null;
  checkedAt: string;
}

interface ReportData {
  article: {
    _id: string;
    title: string;
    canonicalUrl: string;
    publishedAt: string;
    authorName: string | null;
  };
  copies: CopyResult[];
}

export default function ReportPage({ params }: { params: Promise<{ articleId: string }> }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'actionable' | 'credited'>('all');
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { articleId } = await params;
        const res = await fetch(`/api/report/${articleId}`);
        if (!res.ok) throw new Error('Failed to load report');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  async function copyTemplate(id: string, template: string) {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="container page" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto', borderWidth: 4 }} />
        <p style={{ marginTop: 24, color: 'var(--text-muted)' }}>Loading aggregated report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚠</div>
        <h1 className="text-gradient" style={{ marginBottom: 12 }}>Report Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{error || 'No data available.'}</p>
        <Link href="/history" className="btn btn-primary">← Back to History</Link>
      </div>
    );
  }

  const actionableCount = data.copies.filter(c => c.verdict === 'unattributed_repost').length;
  const creditedCount = data.copies.filter(c => c.verdict === 'credited_syndication').length;

  const filteredCopies = data.copies.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'actionable') return c.verdict === 'unattributed_repost';
    if (activeTab === 'credited') return c.verdict === 'credited_syndication';
    return true;
  });

  return (
    <div className="container page" style={{ paddingTop: '60px' }}>
      
      {/* Back nav */}
      <div style={{ marginBottom: 36, display: 'flex', gap: 16 }}>
        <Link href="/history" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← History Ledger
        </Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Aggregated Report
        </span>
      </div>

      <div className="results-section">
        <div className="scan-report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="scan-report-title">
              <span className="text-gradient">{data.article.title}</span>
            </div>
            <div className="scan-report-meta">
              by {data.article.authorName || 'Unknown'} ·{' '}
              <a href={data.article.canonicalUrl} target="_blank" rel="noopener noreferrer">
                {data.article.canonicalUrl}
              </a>{' '}
              · {new Date(data.article.publishedAt).toLocaleDateString()}
            </div>
          </div>
          
          <button 
            className="btn-share" 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              const btn = document.getElementById('share-btn');
              if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                setTimeout(() => btn.innerText = originalText, 2000);
              }
            }}
            id="share-btn"
          >
            🔗 Share Report
          </button>
        </div>

        <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="metric-card">
            <div className="metric-value">{data.copies.length}</div>
            <div className="metric-label">Total Copies Tracked</div>
          </div>
          <div className={`metric-card ${actionableCount > 0 ? 'danger-card' : ''}`}>
            <div className="metric-value" style={actionableCount > 0 ? { color: 'var(--color-repost)', WebkitTextFillColor: 'var(--color-repost)' } : undefined}>
              {actionableCount}
            </div>
            <div className="metric-label">Actionable Takedowns</div>
          </div>
        </div>

        <div className="tabs-header">
          <div className="tabs-nav">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              All <span className="tab-count">{data.copies.length}</span>
            </button>
            <button className={`tab-btn ${activeTab === 'actionable' ? 'active' : ''}`} onClick={() => setActiveTab('actionable')}>
              Actionable <span className={`tab-count ${actionableCount > 0 ? 'danger' : ''}`}>{actionableCount}</span>
            </button>
            <button className={`tab-btn ${activeTab === 'credited' ? 'active' : ''}`} onClick={() => setActiveTab('credited')}>
              Credited <span className="tab-count">{creditedCount}</span>
            </button>
          </div>
          <div className="badge neutral">OriginTrace Knowledge Base</div>
        </div>

        <div className="result-list">
          {filteredCopies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No {activeTab} results found for this article.
            </div>
          ) : (
            filteredCopies.map((copy, i) => {
              const isActionable = copy.verdict === 'unattributed_repost';
              const attr = copy.attribution;
              
              let attrText = null;
              let attrGood = false;
              if (attr) {
                if (attr.isProperlyAttributed) {
                  attrText = 'Properly attributed — author name and original link present.';
                  attrGood = true;
                } else if (attr.missing?.length === 2) {
                  attrText = 'Missing both original author name and original post link.';
                } else if (attr.missing?.includes('original author name')) {
                  attrText = 'Links to original post, but missing the author name.';
                } else {
                  attrText = 'Author name present, but missing a link to the original post.';
                }
              }

              return (
                <div key={copy._id} className={`result-card ${isActionable ? 'danger' : 'safe'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="result-card-inner">
                    <div className="result-card-top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={copy.url} target="_blank" rel="noopener noreferrer" className="result-title" style={{ display: 'block' }}>
                          {copy.title || copy.url}
                        </a>
                        <a href={copy.url} target="_blank" rel="noopener noreferrer" className="result-url">
                          {copy.url}
                        </a>
                      </div>
                      <div className={`verdict-badge ${isActionable ? 'danger' : 'safe'}`}>
                        <span className="verdict-badge-dot" />
                        {isActionable ? 'Actionable Takedown' : 'Credited Republish'}
                      </div>
                    </div>

                    <div className="result-stats" style={{ marginBottom: '16px' }}>
                      <div className="result-stat">
                        <div className="result-stat-label">Duplicated Content</div>
                        <div className={`result-stat-value ${isActionable ? 'red' : 'default'}`}>
                          {copy.overlapPercent || 0}%
                        </div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-label">Last Scanned</div>
                        <div className="result-stat-value default">
                          {new Date(copy.checkedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {attrText && (
                      <div className={`attribution-pill ${attrGood ? 'good' : 'bad'}`} style={{ marginBottom: '16px' }}>
                        <span>{attrGood ? '✓' : '✗'}</span>
                        {attrText}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                      <Link href={`/check/${copy._id}`} className="btn btn-secondary">
                        View Full Details ↗
                      </Link>
                      {copy.dmcaTemplate && (
                        <button 
                          className={`copy-btn ${copiedId === copy._id ? 'copied' : ''}`}
                          style={{ margin: 0 }}
                          onClick={() => copy.dmcaTemplate && copyTemplate(copy._id, copy.dmcaTemplate)}
                        >
                          {copiedId === copy._id ? '✓ Copied Template!' : '⎘ Copy DMCA Template'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
