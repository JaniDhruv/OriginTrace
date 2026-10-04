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
        <img id="lightbox-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" className={styles.lightboxImg} />
        <span className={styles.lightboxClose}>✕</span>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>User Guide</h1>
        <p className={styles.subtitle}>A complete technical walkthrough of the OriginTrace pipeline.</p>
      </header>

      <main>
        {/* PREMIUM PILL TAB NAVIGATION */}
        <div className={styles.tabNav}>
          {([
            { id: 'scanner' as Tab, label: 'Pipeline & Scanning' },
            { id: 'ledger' as Tab, label: 'Data & Ledger' },
            { id: 'agent' as Tab, label: 'AI Action Agent' },
          ]).map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.activeTab : styles.tabBtn}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════ SCANNER TAB ═══════════════════ */}
        {activeTab === 'scanner' && (
          <div className={styles.fadeEnter}>
            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>1. Run a Scan</h2>
                <p className={styles.cardText}>
                  The workflow begins by pasting a DEV.to article URL. OriginTrace fetches the document and extracts distinctive linguistic features to use as search signals.
                </p>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/hero.png" alt="Scanner Homepage" className={styles.screenshot} />
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>2. Live Web Crawl</h2>
                <p className={styles.cardText}>
                  OriginTrace uses the Serper.dev Google Search API to query the web for exact-match sentences from your article. The radar visualizes the search in real-time.
                </p>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/scanning.png" alt="Live Radar Scanner" className={styles.screenshot} />
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>3. Overlap Analysis</h2>
                <p className={styles.cardText}>
                  Every discovered copy is fetched and compared against the original article using a robust multi-signal NLP engine.
                </p>
                <ul className={styles.featureList}>
                  <li>
                    <div>
                      <strong>Word Overlap (20%)</strong>
                      Jaccard similarity of shared vocabulary.
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>5-gram Shingling (50%)</strong>
                      Detects structurally identical paragraphs.
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>LCS Ratio (30%)</strong>
                      Longest Common Subsequence handles reordering.
                    </div>
                  </li>
                </ul>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/results.png" alt="Scan Results" className={styles.screenshot} />
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════ LEDGER TAB ═══════════════════ */}
        {activeTab === 'ledger' && (
          <div className={styles.fadeEnter}>
            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>The Provenance Ledger</h2>
                <p className={styles.cardText}>
                  All scan results are permanently indexed in the Sanity Content Lake. This creates a queryable, immutable history of your content across the web.
                </p>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/ledger.png" alt="Scan History Ledger" className={styles.screenshot} />
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>Attribution Detection</h2>
                <p className={styles.cardText}>
                  Beyond simple text overlap, the engine parses the DOM of each copycat to detect how they attribute the work.
                </p>
                <ul className={styles.featureList}>
                  <li>
                    <div>
                      <strong>Unattributed Reposts</strong>
                      Content duplicated without credit. Flagged for DMCA action.
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Credited Syndications</strong>
                      Articles that correctly name the author and link back.
                    </div>
                  </li>
                </ul>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/report.png" alt="Attribution Analysis" className={styles.screenshot} />
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>Aggregated Reporting</h2>
                <p className={styles.cardText}>
                  Each canonical article gets an aggregated report page consolidating all found copies, including automated one-click DMCA takedown generators.
                </p>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/aggregated_report.png" alt="Aggregated Report" className={styles.screenshot} />
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════ AGENT TAB ═══════════════════ */}
        {activeTab === 'agent' && (
          <div className={styles.fadeEnter}>
            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>Trigger Scans Programmatically</h2>
                <p className={styles.cardText}>
                  The AI Agent isn't just a chatbot; it's an Action Agent. You can instruct it to trigger the full scan pipeline directly from the chat interface.
                </p>
                <div className={styles.infoBox}>
                  Try it: <code>Scan my dev.to post [URL]</code>
                </div>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/agent_scan_thinking.png" alt="Agent triggering scan" className={styles.screenshot} />
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.textContent}>
                <h2>Sanity Context MCP</h2>
                <p className={styles.cardText}>
                  The agent is grounded entirely in the Sanity Content Lake. It writes dynamic GROQ queries to answer complex questions about your ledger.
                </p>
              </div>
              <div className={styles.imageBox}>
                <ZoomableImg src="/screenshots/agent_thoughts.png" alt="Agent Thoughts" className={styles.screenshot} />
              </div>
            </section>
            
            <section className={`${styles.sectionBlock} ${styles.fullWidthBlock}`}>
              <div className={styles.textContent}>
                <h2>Agent Guardrails</h2>
                <p className={styles.cardText}>The agent is equipped with strict scope limitations to prevent abuse and API timeouts.</p>
              </div>
              <div className={styles.promptGrid}>
                <div className={styles.promptColumn}>
                  <h3>Supported Tasks</h3>
                  <ul className={styles.promptList}>
                    <li><code>Scan my dev.to post [URL]</code></li>
                    <li><code>Which article has the highest overlap?</code></li>
                    <li><code>Draft a DMCA for the worst offender.</code></li>
                    <li><code>Did they credit me?</code></li>
                  </ul>
                </div>
                <div className={styles.promptColumn}>
                  <h3>Unsupported Tasks (Blacklisted)</h3>
                  <ul className={styles.promptList}>
                    <li>
                      <code>Scan all my posts</code>
                      <span className={styles.reasonText}>Blocked to prevent server timeouts</span>
                    </li>
                    <li>
                      <code>Scan my Medium article</code>
                      <span className={styles.reasonText}>Pipeline strictly requires DEV.to URLs</span>
                    </li>
                    <li>
                      <code>Write a React component</code>
                      <span className={styles.reasonText}>Blocked to enforce product character</span>
                    </li>
                    <li>
                      <code>Delete this article</code>
                      <span className={styles.reasonText}>Agent is restricted to read-only access</span>
                    </li>
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
