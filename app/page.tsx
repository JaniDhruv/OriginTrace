'use client';

import { useEffect, useState, useRef } from 'react';

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

const SCAN_STEPS = [
  { id: 1, label: 'Fetching your original post' },
  { id: 2, label: 'Querying Serper for copies' },
  { id: 3, label: 'Comparing content overlap' },
  { id: 4, label: 'Generating DMCA evidence' },
];

export default function HomePage() {
  const [devToUrl, setDevToUrl] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ articles: 0, checks: 0, reposts: 0 });
  const [copiedUrl, setCopiedUrl] = useState('');
  const [scanPhase, setScanPhase] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'actionable' | 'credited'>('all');
  const phaseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scanning && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scanning]);

  useEffect(() => {
    if (scanResult && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scanResult]);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
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
      const segs = parsed.pathname.split('/').filter(Boolean);
      if (host !== 'dev.to' || segs.length < 2) {
        setError('Not a valid DEV.to post link. Format: dev.to/username/post-slug');
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
    setActiveTab('all');
    setScanPhase(1);

    phaseIntervalRef.current = setInterval(() => {
      setScanPhase(p => p < SCAN_STEPS.length ? p + 1 : p);
    }, 5500);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devToUrl: targetUrl }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Scan timed out — the article may have too many results. Please try again.');
      }
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScanResult(data);
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
      setScanning(false);
      setScanPhase(0);
    }
  }

  async function copyTemplate(url: string, template: string) {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch { setCopiedUrl(''); }
  }

  const actionableCount = scanResult?.copies.filter(c => c.verdict === 'unattributed_repost').length ?? 0;
  const creditedCount = scanResult?.copies.filter(c => c.verdict === 'credited_syndication').length ?? 0;

  const filteredCopies = scanResult?.copies.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'actionable') return c.verdict === 'unattributed_repost';
    if (activeTab === 'credited') return c.verdict === 'credited_syndication';
    return true;
  }) ?? [];

  return (
    <div className="container page">
      {/* =================== HERO =================== */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Powered by Sanity Knowledge Base
        </div>
        <h1>
          Your Words.<br />
          <span className="text-gradient">Your Rights.</span>
        </h1>
        <p>
          OriginTrace crawls the web looking for stolen copies of your DEV.to posts.
          Paste your article link — we&apos;ll find plagiarized reposts and generate ready-to-send DMCA takedown notices.
        </p>

        <div className="search-wrapper">
          <form onSubmit={handleScan} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="dev.to/username/your-original-post"
              value={devToUrl}
              onChange={e => setDevToUrl(e.target.value)}
              required
              disabled={scanning}
              aria-label="Original DEV.to post URL"
            />
            <button
              type="submit"
              className={`search-btn ${scanning ? 'scanning' : ''}`}
              disabled={scanning || !devToUrl.trim()}
            >
              {scanning
                ? <><span className="spinner" /> Scanning...</>
                : <>Scan Post →</>
              }
            </button>
          </form>

          {error && (
            <div className="error-toast">
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* SCROLL TARGET REF */}
        <div ref={scrollRef} style={{ scrollMarginTop: '100px' }}>
          {/* RADAR + PROGRESS STEPS */}
          {scanning && (
          <div className="scanner-overlay">
            <div className="radar-container">
              <div className="radar-circle" />
              <div className="radar-circle" />
              <div className="radar-circle" />
              <div className="radar-sweep" />
              <div className="radar-dot" />
              <div className="radar-ping" />
            </div>

            <div className="scan-steps">
              {SCAN_STEPS.map(step => (
                <div
                  key={step.id}
                  className={`scan-step ${scanPhase === step.id ? 'active' : ''} ${scanPhase > step.id ? 'done' : ''}`}
                >
                  <div className="scan-step-icon">
                    {scanPhase > step.id
                      ? <div className="scan-step-check">✓</div>
                      : scanPhase === step.id
                      ? <span className="spinner" />
                      : <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{step.id}</span>
                    }
                  </div>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </section>

      {/* =================== RESULTS =================== */}
      {scanResult && (
        <div className="results-section">
          {/* Report header */}
          <div className="scan-report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="scan-report-title">
                <span className="text-gradient">{scanResult.article.title}</span>
              </div>
              <div className="scan-report-meta">
                by {scanResult.article.authorName || 'Unknown'} ·{' '}
                <a href={scanResult.article.canonicalUrl} target="_blank" rel="noopener noreferrer">
                  {scanResult.article.canonicalUrl}
                </a>{' '}
                · {formatDate(scanResult.article.publishedAt)}
              </div>
            </div>
            
            <button 
              className="btn-share" 
              onClick={() => {
                const url = new URL(`/report/${scanResult.article.id}`, window.location.href).toString();
                navigator.clipboard.writeText(url);
                const btn = document.getElementById('share-btn-home');
                if (btn) {
                  const originalText = btn.innerText;
                  btn.innerText = 'Copied Link!';
                  setTimeout(() => btn.innerText = originalText, 2000);
                }
              }}
              id="share-btn-home"
            >
              🔗 Share Report
            </button>
          </div>

          {/* Metrics */}
          <div className="metrics-row">
            <div className="metric-card">
              <AnimatedNumber value={scanResult.totalSearchResults} />
              <div className="metric-label">Search Hits</div>
            </div>
            <div className="metric-card">
              <AnimatedNumber value={scanResult.copies.length} />
              <div className="metric-label">Copies Found</div>
            </div>
            <div className={`metric-card ${actionableCount > 0 ? 'danger-card' : ''}`}>
              <AnimatedNumber value={actionableCount} color={actionableCount > 0 ? 'var(--color-repost)' : undefined} />
              <div className="metric-label">Actionable Takedowns</div>
            </div>
          </div>

          {/* Tabs + Results */}
          {scanResult.copies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Clean Bill of Health!</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Scanned {scanResult.totalSearchResults} candidates — no pages crossed the similarity threshold.
              </p>
            </div>
          ) : (
            <>
              <div className="tabs-header">
                <div className="tabs-nav">
                  <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All
                    <span className="tab-count">{scanResult.copies.length}</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'actionable' ? 'active' : ''}`}
                    onClick={() => setActiveTab('actionable')}
                  >
                    Actionable
                    <span className={`tab-count ${actionableCount > 0 ? 'danger' : ''}`}>{actionableCount}</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'credited' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credited')}
                  >
                    Credited
                    <span className="tab-count">{creditedCount}</span>
                  </button>
                </div>
                <div className="badge neutral">Sanity-Backed Reconciliation</div>
              </div>

              <div className="result-list">
                {filteredCopies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No {activeTab} results in this scan.
                  </div>
                ) : (
                  filteredCopies.map((copy, i) => (
                    <ResultCard
                      key={copy.url}
                      copy={copy}
                      index={i}
                      copied={copiedUrl === copy.url}
                      onCopy={() => copy.dmcaTemplate && copyTemplate(copy.url, copy.dmcaTemplate)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* =================== STATS FOOTER =================== */}
      {!scanning && (
        <div className="stats-footer">
          <div className="stat-tile">
            <div className="stat-tile-value">{stats.articles}</div>
            <div className="stat-tile-label">Originals Indexed</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-value">{stats.checks}</div>
            <div className="stat-tile-label">Total Checks Run</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-value">{stats.reposts}</div>
            <div className="stat-tile-label">Plagiarisms Caught</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function AnimatedNumber({ value, color }: { value: number; color?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(value);

  useEffect(() => {
    ref.current = 0;
    setDisplay(0);
    const target = value;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      ref.current = Math.min(ref.current + step, target);
      setDisplay(ref.current);
      if (ref.current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className="metric-value"
      style={color
        ? { color, WebkitTextFillColor: color }
        : { background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
      }
    >
      {display}
    </div>
  );
}

function ResultCard({
  copy,
  index,
  copied,
  onCopy,
}: {
  copy: CopyResult;
  index: number;
  copied: boolean;
  onCopy: () => void;
}) {
  const isActionable = copy.verdict === 'unattributed_repost';
  const attr = copy.attribution;

  const getAttributionText = () => {
    if (!attr) return null;
    if (attr.isProperlyAttributed) return { text: 'Properly attributed — author name and original link present.', good: true };
    if (attr.missing.length === 2) return { text: 'Missing both original author name and original post link.', good: false };
    if (attr.missing.includes('original author name')) return { text: 'Links to original post, but missing the author name.', good: false };
    return { text: 'Author name present, but missing a link to the original post.', good: false };
  };

  const attrInfo = getAttributionText();

  return (
    <div
      className={`result-card ${isActionable ? 'danger' : 'safe'}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="result-card-inner">
        <div className="result-card-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href={copy.url} target="_blank" rel="noopener noreferrer" className="result-title" style={{ display: 'block' }}>
              {copy.title}
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

        <div className="result-stats">
          <div className="result-stat">
            <div className="result-stat-label">Duplicated Content</div>
            <div className={`result-stat-value ${isActionable ? 'red' : 'default'}`}>
              {copy.overlapPercent}%
            </div>
          </div>
          <div className="result-stat">
            <div className="result-stat-label">Found Date</div>
            <div className="result-stat-value default">
              {copy.foundDate ? formatDate(copy.foundDate) : 'Unknown'}
            </div>
          </div>
        </div>

        {attrInfo && (
          <div className={`attribution-pill ${attrInfo.good ? 'good' : 'bad'}`}>
            <span>{attrInfo.good ? '✓' : '✗'}</span>
            {attrInfo.text}
          </div>
        )}

        {copy.snippet && (
          <div className="result-snippet">
            <p>"{copy.snippet}"</p>
          </div>
        )}

        {copy.dmcaTemplate && (
          <div className="dmca-block">
            <div className="dmca-block-header">
              <div className="dmca-block-title">DMCA Takedown Template Ready</div>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={onCopy}
                type="button"
              >
                {copied ? '✓ Copied!' : '⎘ Copy to Clipboard'}
              </button>
            </div>
            <pre>{copy.dmcaTemplate}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
