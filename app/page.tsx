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
  unattributed_repost: 'Actionable Takedown',
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
  const [scanPhase, setScanPhase] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'actionable' | 'credited'>('all');

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

    let targetUrl = devToUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      const parsed = new URL(targetUrl);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      const segments = parsed.pathname.split('/').filter(Boolean);
      
      if (host !== 'dev.to' || segments.length < 2) {
        setError('This is not a valid DEV.to post link.');
        setScanResult(null);
        return;
      }
    } catch {
      setError('Please enter a valid URL.');
      setScanResult(null);
      return;
    }

    setScanning(true);
    setScanResult(null);
    setError('');
    setScanPhase(1);

    // Mock progress phases for UX
    const phaseInterval = setInterval(() => {
      setScanPhase(p => (p < 3 ? p + 1 : p));
    }, 2000);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devToUrl: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setScanResult(data);
      fetchStats();
      fetchRecentChecks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      clearInterval(phaseInterval);
      setScanning(false);
      setScanPhase(0);
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
      {/* Dynamic Hero Section */}
      <section className="hero">
        <h1>Protect Your <span className="text-gradient">Intellectual Property</span></h1>
        <p>
          OriginTrace uses advanced heuristics to find plagiarized content across the web. 
          Enter your original article below to detect unattributed copies and instantly generate DMCA takedowns.
        </p>

        <form onSubmit={handleScan} className="input-group">
          <input
            type="text"
            className="input"
            placeholder="dev.to/username/original-post"
            value={devToUrl}
            onChange={(event) => setDevToUrl(event.target.value)}
            required
            disabled={scanning}
            aria-label="Original Dev.to post URL"
          />
          <button type="submit" className="btn btn-primary" disabled={scanning || !devToUrl.trim()}>
            {scanning ? 'Scanning...' : 'Scan Post'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 24, display: 'inline-block' }} className="badge danger">
            {error}
          </div>
        )}

        {/* Dynamic Terminal Progress Loader */}
        {scanning && (
          <div className="scanning-status">
            <div className={`status-pill ${scanPhase >= 1 ? 'active' : ''}`}>
              {scanPhase === 1 ? <span className="spinner" /> : null}
              Fetching original
            </div>
            <div className={`status-pill ${scanPhase >= 2 ? 'active' : ''}`}>
              {scanPhase === 2 ? <span className="spinner" /> : null}
              Querying Serper
            </div>
            <div className={`status-pill ${scanPhase >= 3 ? 'active' : ''}`}>
              {scanPhase === 3 ? <span className="spinner" /> : null}
              Comparing overlap
            </div>
          </div>
        )}
      </section>

      {/* High-End Dashboard Results */}
      {scanResult && (
        <div style={{ animation: 'fadeUp 0.6s ease-out forwards' }}>
          <section className="section">
            <h2 style={{ marginBottom: 24, textAlign: 'center' }}>
              Scan Report: <span className="text-gradient">{scanResult.article.title}</span>
            </h2>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{scanResult.totalSearchResults}</div>
                <div className="metric-label">Search Hits</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{scanResult.copies.length}</div>
                <div className="metric-label">Copies Found</div>
              </div>
              <div className="metric-card" style={{ borderColor: unattributedCount > 0 ? 'var(--color-repost)' : 'var(--border-glass)' }}>
                <div className="metric-value" style={{ background: unattributedCount > 0 ? 'var(--color-repost)' : 'inherit', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {unattributedCount}
                </div>
                <div className="metric-label">Actionable Takedowns</div>
              </div>
            </div>
          </section>

          <section className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2>Duplicate & Republish Results</h2>
              <div className="badge safe">Sanity-Backed Reconciliation</div>
            </div>

            {scanResult.copies.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Clean Bill of Health!</h3>
                <p style={{ color: 'var(--text-muted)' }}>The search ran across {scanResult.totalSearchResults} candidates, but no pages passed the overlap threshold.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
                  <button 
                    onClick={() => setActiveTab('all')} 
                    className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '30px' }}
                  >
                    All Results ({scanResult.copies.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('actionable')} 
                    className={`btn ${activeTab === 'actionable' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '30px' }}
                  >
                    Actionable ({unattributedCount})
                  </button>
                  <button 
                    onClick={() => setActiveTab('credited')} 
                    className={`btn ${activeTab === 'credited' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '30px' }}
                  >
                    Credited ({scanResult.copies.length - unattributedCount})
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {scanResult.copies
                    .filter(copy => {
                      if (activeTab === 'all') return true;
                      if (activeTab === 'actionable') return copy.verdict === 'unattributed_repost';
                      if (activeTab === 'credited') return copy.verdict === 'credited_syndication';
                      return true;
                    })
                    .map((copy) => (
                    <CopyCard
                      key={copy.url}
                      copy={copy}
                      copied={copiedUrl === copy.url}
                      onCopy={() => copy.dmcaTemplate && copyTemplate(copy.url, copy.dmcaTemplate)}
                    />
                  ))}
                  
                  {/* Empty state for tabs */}
                  {activeTab !== 'all' && scanResult.copies.filter(copy => {
                    if (activeTab === 'actionable') return copy.verdict === 'unattributed_repost';
                    if (activeTab === 'credited') return copy.verdict === 'credited_syndication';
                    return false;
                  }).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No {activeTab} results found.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Global Stats Section */}
      {!scanResult && !scanning && (
        <section className="section" style={{ marginTop: 60 }}>
          <div className="metrics-grid" style={{ opacity: 0.6, transform: 'scale(0.95)' }}>
            <div className="metric-card">
              <div className="metric-value">{stats.articles}</div>
              <div className="metric-label">Originals Indexed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{stats.checks}</div>
              <div className="metric-label">Checks Run</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{stats.reposts}</div>
              <div className="metric-label">Plagiarisms Caught</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

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
  const cardClass = isActionable ? 'report-card danger' : 'report-card syndicated';

  return (
    <div className={cardClass}>
      <div className="report-header">
        <div>
          <a href={copy.url} target="_blank" rel="noopener noreferrer" className="report-title text-gradient" style={{ display: 'block' }}>
            {copy.title}
          </a>
          <a href={copy.url} target="_blank" rel="noopener noreferrer" className="report-url">
            {copy.url}
          </a>
        </div>
        <div className={`badge ${isActionable ? 'danger' : 'safe'}`}>
          {VERDICT_LABELS[copy.verdict] || copy.verdict}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div>
          <div className="metric-label" style={{ fontSize: '0.75rem' }}>Duplicated Content</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isActionable ? 'var(--color-repost)' : 'var(--text-main)' }}>
            {copy.overlapPercent}%
          </div>
        </div>
        <div>
          <div className="metric-label" style={{ fontSize: '0.75rem' }}>Found Date</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {copy.foundDate ? formatDate(copy.foundDate) : 'Unknown'}
          </div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="metric-label" style={{ fontSize: '0.75rem' }}>Attribution Analysis</div>
          <div style={{ fontSize: '1rem', marginTop: 4, lineHeight: '1.4' }}>
            {attribution?.isProperlyAttributed 
              ? <span style={{ color: 'var(--color-original)' }}>Properly attributed with author name and link.</span>
              : attribution?.missing.length === 2
                ? <span style={{ color: 'var(--color-repost)' }}>Missing both original author name and original post link.</span>
                : attribution?.missing.includes('original author name')
                  ? <span style={{ color: 'var(--color-repost)' }}>Links to the original post, but missing the original author name.</span>
                  : <span style={{ color: 'var(--color-repost)' }}>Mentions the author name, but missing a link to the original post.</span>}
          </div>
        </div>
      </div>

      {copy.snippet && (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)', marginBottom: 20 }}>
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            "{copy.snippet}"
          </p>
        </div>
      )}

      {copy.dmcaTemplate && (
        <div className="dmca-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>DMCA Takedown Template Generated</h3>
            <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={onCopy} type="button">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <pre>{copy.dmcaTemplate}</pre>
        </div>
      )}
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
