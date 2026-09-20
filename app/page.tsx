'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AttributionReport {
  hasAuthorName: boolean;
  hasOriginalLink: boolean;
  hasAttributionPhrase: boolean;
  detectedAuthor: string | null;
  signals: string[];
  missing: string[];
  isProperlyAttributed: boolean;
}

interface CopyResult {
  url: string;
  title: string;
  snippet: string;
  verdict: string;
  overlapPercent: number;
  attribution: AttributionReport | null;
  dmcaTemplate: string | null;
  matchedPassages: Array<{ original: string; found: string }>;
  foundDate: string | null;
  checkedAt: string;
}

interface ScanResult {
  article: {
    id: string;
    title: string;
    canonicalUrl: string;
    publishedAt: string;
    authorName: string | null;
  };
  sanityAnalysis: {
    engine: string;
    checkedCandidates: number;
    attributionRule: string;
  };
  phrasesSearched: string[];
  totalSearchResults: number;
  copies: CopyResult[];
  scannedAt: string;
}

interface RecentCheck {
  _id: string;
  checkedUrl: string;
  checkedTitle: string;
  verdict: string;
  checkedAt: string;
}

const VERDICT_LABELS: Record<string, string> = {
  original: 'Original',
  credited_syndication: 'Credited republish',
  unattributed_repost: 'Missing attribution',
  no_match: 'No match',
};

export default function HomePage() {
  const [devToUrl, setDevToUrl] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ articles: 0, checks: 0, reposts: 0 });
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    fetchStats();
    fetchRecentChecks();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // Ignore dashboard stat failures.
    }
  }

  async function fetchRecentChecks() {
    try {
      const res = await fetch('/api/checks');
      if (res.ok) {
        const data = await res.json();
        setRecentChecks(data.checks || []);
      }
    } catch {
      // Ignore recent check failures.
    }
  }

  async function handleScan(event: React.FormEvent) {
    event.preventDefault();
    if (!devToUrl.trim()) return;

    setScanning(true);
    setScanResult(null);
    setError('');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devToUrl: devToUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setScanResult(data);
      fetchStats();
      fetchRecentChecks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  async function copyTemplate(url: string, template: string) {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 1800);
    } catch {
      setCopiedUrl('');
    }
  }

  const unattributedCount = scanResult?.copies.filter((copy) => copy.verdict === 'unattributed_repost').length || 0;

  return (
    <div className="container page">
      <section className="section">
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                Dev.to duplicate scanner
              </p>
              <h1>Find copied posts and missing attribution</h1>
              <p className="text-secondary" style={{ marginTop: 10, maxWidth: 680 }}>
                Paste your original Dev.to post. OriginTrace searches the web, checks overlap with Sanity-backed reconciliation, and drafts takedown evidence for unattributed reposts.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{stats.reposts}</div>
              <div className="stat-label">reposts caught</div>
            </div>
          </div>

          <form onSubmit={handleScan} className="input-group">
            <input
              type="url"
              className="input"
              placeholder="https://dev.to/username/original-post"
              value={devToUrl}
              onChange={(event) => setDevToUrl(event.target.value)}
              required
              disabled={scanning}
              aria-label="Original Dev.to post URL"
            />
            <button type="submit" className="btn btn-primary" disabled={scanning || !devToUrl.trim()}>
              {scanning ? <><span className="spinner" /> Scanning...</> : 'Scan post'}
            </button>
          </form>

          {scanning && (
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {['Fetch original', 'Search web', 'Compare overlap', 'Draft DMCA'].map((step) => (
                <div key={step} style={{ padding: 12, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <section className="section">
          <div className="card" style={{ borderColor: 'rgba(248,81,73,0.45)', color: 'var(--color-repost)' }}>
            {error}
          </div>
        </section>
      )}

      {scanResult && (
        <>
          <section className="section">
            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                  <h2>{scanResult.article.title}</h2>
                  <a href={scanResult.article.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-mono" style={{ display: 'inline-block', marginTop: 8 }}>
                    {scanResult.article.canonicalUrl}
                  </a>
                  <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.875rem' }}>
                    {scanResult.article.authorName || 'Author not detected'} - {formatDate(scanResult.article.publishedAt)}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(88px, 1fr))', gap: 12, width: 'min(100%, 340px)' }}>
                  <Metric label="search hits" value={scanResult.totalSearchResults} />
                  <Metric label="copies" value={scanResult.copies.length} />
                  <Metric label="actionable" value={unattributedCount} danger={unattributedCount > 0} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div className="stat-label">Sanity analysis</div>
                  <div style={{ fontWeight: 600 }}>{scanResult.sanityAnalysis.engine}</div>
                </div>
                <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div className="stat-label">Attribution rule</div>
                  <div style={{ fontWeight: 600 }}>Author name + original link required</div>
                </div>
              </div>
            </div>
          </section>

          {scanResult.copies.length === 0 ? (
            <section className="section">
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <h3>No duplicated reposts found</h3>
                <p className="text-secondary" style={{ marginTop: 8 }}>
                  The search ran, but no candidate page passed the overlap threshold.
                </p>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="section-header">
                <h2>Duplicate And Republish Results</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {scanResult.copies.map((copy) => (
                  <CopyCard
                    key={copy.url}
                    copy={copy}
                    copied={copiedUrl === copy.url}
                    onCopy={() => copy.dmcaTemplate && copyTemplate(copy.url, copy.dmcaTemplate)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.articles}</div>
            <div className="stat-label">Originals indexed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.checks}</div>
            <div className="stat-label">Checks run</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reposts}</div>
            <div className="stat-label">Missing attribution</div>
          </div>
        </div>
      </section>

      {recentChecks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Recent Checks</h2>
          </div>
          <div className="article-list">
            {recentChecks.map((check) => (
              <Link
                key={check._id}
                href={`/check/${check._id}`}
                className="article-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ flex: 1 }}>
                  <div className="article-title">{check.checkedTitle || check.checkedUrl}</div>
                  <p className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 4 }}>
                    {check.checkedUrl}
                  </p>
                </div>
                <div className="article-meta">
                  <span className={`verdict-badge verdict-${check.verdict}`}>
                    {VERDICT_LABELS[check.verdict] || check.verdict}
                  </span>
                  <span>{formatDate(check.checkedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <div className="stat-value" style={{ fontSize: '1.5rem', color: danger ? 'var(--color-repost)' : 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function CopyCard({
  copy,
  copied,
  onCopy,
}: {
  copy: CopyResult;
  copied: boolean;
  onCopy: () => void;
}) {
  const attribution = copy.attribution;
  const isActionable = copy.verdict === 'unattributed_repost';

  return (
    <div className="card" style={{ padding: 24, borderColor: isActionable ? 'rgba(248,81,73,0.35)' : 'rgba(88,166,255,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <a href={copy.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: '1.05rem' }}>
            {copy.title}
          </a>
          <p className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 4, wordBreak: 'break-word' }}>
            {copy.url}
          </p>
        </div>
        <span className={`verdict-badge verdict-${copy.verdict}`} style={{ flexShrink: 0 }}>
          {VERDICT_LABELS[copy.verdict] || copy.verdict}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Evidence label="Duplicated content" value={`${copy.overlapPercent}%`} danger={isActionable} />
        <Evidence label="Author name" value={attribution?.hasAuthorName ? 'Present' : 'Missing'} danger={!attribution?.hasAuthorName} />
        <Evidence label="Original post link" value={attribution?.hasOriginalLink ? 'Present' : 'Missing'} danger={!attribution?.hasOriginalLink} />
        <Evidence label="Found date" value={copy.foundDate ? formatDate(copy.foundDate) : 'Unknown'} />
      </div>

      {copy.snippet && (
        <p className="text-secondary" style={{ fontSize: '0.875rem', fontStyle: 'italic', marginBottom: 14 }}>
          &quot;{copy.snippet}&quot;
        </p>
      )}

      {attribution && (
        <div style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 14 }}>
          <div className="stat-label">Attribution evidence</div>
          <p style={{ marginTop: 4, fontSize: '0.875rem' }}>
            {attribution.signals.length ? attribution.signals.join('; ') : 'No attribution signals detected.'}
          </p>
          {attribution.missing.length > 0 && (
            <p style={{ color: 'var(--color-repost)', marginTop: 6, fontSize: '0.875rem' }}>
              Missing: {attribution.missing.join(', ')}
            </p>
          )}
        </div>
      )}

      {copy.matchedPassages.length > 0 && (
        <details style={{ marginBottom: copy.dmcaTemplate ? 16 : 0 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 600 }}>
            Matched passages ({copy.matchedPassages.length})
          </summary>
          <div style={{ marginTop: 12 }}>
            {copy.matchedPassages.map((passage, index) => (
              <div key={index} className="diff-container" style={{ marginBottom: 12 }}>
                <div className="diff-panel">
                  <div className="diff-panel-header">Original Dev.to post</div>
                  <div className="diff-text">{passage.original}</div>
                </div>
                <div className="diff-panel">
                  <div className="diff-panel-header">Found copy</div>
                  <div className="diff-text">{passage.found}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {copy.dmcaTemplate && (
        <div className="credit-request">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1rem' }}>DMCA complaint template</h3>
            <button className="copy-btn" onClick={onCopy} type="button">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>{copy.dmcaTemplate}</pre>
        </div>
      )}
    </div>
  );
}

function Evidence({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
      <div className="stat-label">{label}</div>
      <div style={{ fontWeight: 700, color: danger ? 'var(--color-repost)' : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
