'use client';

import { useState } from 'react';
import styles from './guide.module.css';

type Tab = 'scanner' | 'ledger' | 'agent';

function ZoomableImg({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} zoomable-img`}
      onClick={() => {
        const overlay = document.getElementById('lightbox-overlay') as HTMLDivElement;
        const img = document.getElementById('lightbox-img') as HTMLImageElement;
        if (overlay && img) {
          img.src = src;
          img.alt = alt;
          overlay.classList.add('lightbox-visible');
        }
      }}
      style={{ cursor: 'zoom-in' }}
    />
  );
}

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');

  return (
    <div className={styles.container}>
      {/* Lightbox Overlay */}
      <div
        id="lightbox-overlay"
        className={styles.lightboxOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
            (e.currentTarget as HTMLDivElement).classList.remove('lightbox-visible');
          }
        }}
      >
        <img id="lightbox-img" src="" alt="" className={styles.lightboxImg} />
        <span className={styles.lightboxClose}>✕</span>
      </div>
      <header className={styles.header}>
        <div className={styles.glowOrb}></div>
        <h1 className={styles.title}>User Guide</h1>
        <p className={styles.subtitle}>Master the complete content protection workflow — from scan to takedown.</p>
      </header>

      <main className={styles.main}>
        {/* TAB NAVIGATION */}
        <div className={styles.tabNav}>
          {([
            { id: 'scanner' as Tab, step: '1', icon: '🔍', label: 'The Scanner' },
            { id: 'ledger' as Tab, step: '2', icon: '🗂️', label: 'The Ledger' },
            { id: 'agent' as Tab, step: '3', icon: '🤖', label: 'The AI Agent' },
          ]).map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.stepBadge}>Step {tab.step}</span>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════ SCANNER TAB ═══════════════════ */}
        {activeTab === 'scanner' && (
          <div className={styles.fadeEnter}>
            {/* Hero */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Paste. Scan. Protect.</h2>
                  <p className={styles.cardText}>
                    Drop any DEV.to article URL into the scanner. OriginTrace's programmatic pipeline will automatically extract distinctive phrases from your writing and search the entire web for potential plagiarism.
                  </p>
                  <div className={styles.stepList}>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>1</span>
                      <span>Paste your DEV.to article URL</span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>2</span>
                      <span>Watch the radar sweep the web in real-time</span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>3</span>
                      <span>Review your results with detailed evidence</span>
                    </div>
                  </div>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/hero.png" alt="Scanner Homepage" className={styles.screenshot} />
                </div>
              </div>
            </section>

            {/* Scanning Animation */}
            <section className={styles.card}>
              <div className={styles.contentSplitReverse}>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/scanning.png" alt="Live Radar Scanner" className={styles.screenshot} />
                </div>
                <div className={styles.textContent}>
                  <h2>Live Radar Scanner</h2>
                  <p className={styles.cardText}>
                    While the scan runs, a real-time animated radar visualizes the web crawl. The pipeline extracts your article's title + 4 most distinctive sentences, then queries them as exact-match phrases across search engines.
                  </p>
                  <div className={styles.tipBox}>
                    <strong>How it works:</strong> OriginTrace uses Serper.dev (Google Search API) with quoted-phrase queries to find pages that contain your exact sentences — the strongest signal of content theft.
                  </div>
                </div>
              </div>
            </section>

            {/* Results */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Actionable Results</h2>
                  <p className={styles.cardText}>
                    Each discovered copy is deep-analyzed using a <strong>multi-signal overlap engine</strong> that combines three algorithms for robust detection:
                  </p>
                  <div className={styles.metricGrid}>
                    <div className={styles.metric}>
                      <span className={styles.metricValue}>20%</span>
                      <span className={styles.metricLabel}>Word Overlap</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricValue}>50%</span>
                      <span className={styles.metricLabel}>5-gram Shingling</span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricValue}>30%</span>
                      <span className={styles.metricLabel}>LCS Ratio</span>
                    </div>
                  </div>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/results.png" alt="Scan Results" className={styles.screenshot} />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════ LEDGER TAB ═══════════════════ */}
        {activeTab === 'ledger' && (
          <div className={styles.fadeEnter}>
            {/* Ledger Overview */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Your Content Provenance Ledger</h2>
                  <p className={styles.cardText}>
                    Every scan is permanently recorded in the <strong>Sanity Content Lake</strong> — creating an immutable, queryable ledger of your content's provenance history. Think of it as a blockchain explorer for your writing.
                  </p>
                  <ul className={styles.statusList}>
                    <li><span className={styles.dotRed}></span> <strong>Unattributed Repost</strong> — Stolen without credit. DMCA recommended.</li>
                    <li><span className={styles.dotGreen}></span> <strong>Credited Syndication</strong> — Properly attributed with author name + link.</li>
                    <li><span className={styles.dotGray}></span> <strong>No Match</strong> — Below similarity threshold. Filtered out.</li>
                  </ul>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/ledger.png" alt="Scan History Ledger" className={styles.screenshot} />
                </div>
              </div>
            </section>

            {/* Attribution Detail */}
            <section className={styles.card}>
              <div className={styles.contentSplitReverse}>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/report.png" alt="Attribution Analysis" className={styles.screenshot} />
                </div>
                <div className={styles.textContent}>
                  <h2>Smart Attribution Detection</h2>
                  <p className={styles.cardText}>
                    OriginTrace doesn't just find copies — it checks <strong>how</strong> the copy credits you. Each candidate is evaluated for:
                  </p>
                  <div className={styles.booleanGrid}>
                    <div className={styles.booleanItem}>
                      <span className={styles.boolTrue}>✓</span> Author name present?
                    </div>
                    <div className={styles.booleanItem}>
                      <span className={styles.boolTrue}>✓</span> Original link included?
                    </div>
                    <div className={styles.booleanItem}>
                      <span className={styles.boolFalse}>✗</span> Attribution phrases?
                    </div>
                    <div className={styles.booleanItem}>
                      <span className={styles.boolFalse}>✗</span> Canonical tag set?
                    </div>
                  </div>
                  <p className={styles.cardTextSmall}>These booleans are stored as structured fields in Sanity — enabling the AI Agent to query them precisely.</p>
                </div>
              </div>
            </section>

            {/* Aggregated Reports */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Sharable Aggregated Reports</h2>
                  <p className={styles.cardText}>
                    Each article gets its own sharable report page that aggregates all discovered copies across multiple scans. Share the link with your legal team or use it as evidence for platform abuse reports.
                  </p>
                  <div className={styles.tipBox}>
                    <strong>Pro Tip:</strong> Each report page includes one-click DMCA template generation with pre-filled evidence passages, overlap percentages, and source URLs.
                  </div>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/aggregated_report.png" alt="Aggregated Report" className={styles.screenshot} />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════ AGENT TAB ═══════════════════ */}
        {activeTab === 'agent' && (
          <div className={styles.fadeEnter}>
            {/* Scan From Chat */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Action Agent: Scan From Chat</h2>
                  <p className={styles.cardText}>
                    The OriginTrace Agent doesn't just <em>read</em> data — it can <strong>take action</strong>. Ask it to scan any DEV.to article and it will trigger the full programmatic pipeline, wait for results, and report back with a structured summary.
                  </p>
                  <div className={styles.tipBox}>
                    <strong>Try it:</strong> <code>Scan my dev.to post [YOUR DEV.TO URL]</code>
                  </div>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/agent_scan_thinking.png" alt="Agent triggering scan" className={styles.screenshot} />
                </div>
              </div>
            </section>

            {/* Agent Results */}
            <section className={styles.card}>
              <div className={styles.contentSplitReverse}>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/agent_scan_results.png" alt="Agent scan results" className={styles.screenshot} />
                </div>
                <div className={styles.textContent}>
                  <h2>Structured Scan Summary</h2>
                  <p className={styles.cardText}>
                    After the scan completes, the agent delivers a structured breakdown: how many copies were found, how many are unattributed vs. credited, and actionable next steps — all grounded in the Sanity Content Lake.
                  </p>
                </div>
              </div>
            </section>

            {/* Query & Reasoning */}
            <section className={styles.card}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>Deep Reasoning & MCP Queries</h2>
                  <p className={styles.cardText}>
                    The agent uses <strong>Sanity Context MCP</strong> to dynamically write GROQ queries at runtime. Every step of its reasoning is transparent — expand the "Agent Thoughts" blocks to see exactly how it arrives at each answer.
                  </p>
                </div>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/agent_thoughts.png" alt="Agent Thoughts" className={styles.screenshot} />
                </div>
              </div>
            </section>

            {/* Agent Response */}
            <section className={styles.card}>
              <div className={styles.contentSplitReverse}>
                <div className={styles.imageBox}>
                  <ZoomableImg src="/screenshots/agent_response.png" alt="Agent response with tables" className={styles.screenshot} />
                </div>
                <div className={styles.textContent}>
                  <h2>Rich, Actionable Responses</h2>
                  <p className={styles.cardText}>
                    The agent delivers beautifully formatted responses — markdown tables, attribution boolean breakdowns, overlap rankings, and DMCA drafts — all derived from structured Sanity data, not hallucinated guesses.
                  </p>
                </div>
              </div>
            </section>

            {/* Prompts Section */}
            <section className={styles.card}>
              <h2 style={{ marginBottom: '2rem' }}>💬 What You Can Ask</h2>
              <div className={styles.promptColumns}>
                <div className={styles.promptGroup}>
                  <h3>✅ Try these prompts</h3>
                  <ul className={styles.promptList}>
                    <li><code>Scan my dev.to post [DEV.TO URL]</code></li>
                    <li><code>Which article has the highest overlap percentage?</code></li>
                    <li><code>Draft a DMCA takedown notice for the worst offender.</code></li>
                    <li><code>Did the top copycat credit the original author?</code></li>
                    <li><code>Show me all copies above 80% overlap that are missing the author name.</code></li>
                  </ul>
                </div>
                <div className={styles.promptGroup}>
                  <h3 className={styles.badTitle}>❌ Blacklisted (Agent will refuse)</h3>
                  <ul className={`${styles.promptList} ${styles.promptListBad}`}>
                    <li><code>&quot;Scan all my posts&quot;</code> <span className={styles.reason}>Server timeout risk — one URL at a time</span></li>
                    <li><code>&quot;Scan my Medium article&quot;</code> <span className={styles.reason}>Pipeline is DEV.to-exclusive</span></li>
                    <li><code>&quot;Write a React component&quot;</code> <span className={styles.reason}>Off-topic — agent stays in character</span></li>
                    <li><code>&quot;Delete this article from the ledger&quot;</code> <span className={styles.reason}>Agent has read-only Sanity access</span></li>
                    <li><code>&quot;Draft a fake DMCA against this URL&quot;</code> <span className={styles.reason}>Requires actual evidence in Sanity</span></li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
