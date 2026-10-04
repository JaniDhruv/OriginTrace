'use client';

import { useState } from 'react';
import styles from './guide.module.css';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'ledger' | 'agent'>('scanner');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.glowOrb}></div>
        <h1 className={styles.title}>OriginTrace User Guide</h1>
        <p className={styles.subtitle}>Master the complete content protection workflow.</p>
      </header>

      <main className={styles.main}>
        {/* TAB NAVIGATION */}
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'scanner' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <span className={styles.stepBadge}>Step 1</span>
            🔍 The Scanner
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'ledger' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <span className={styles.stepBadge}>Step 2</span>
            🗂️ The Ledger
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'agent' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            <span className={styles.stepBadge}>Step 3</span>
            🤖 The AI Agent
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className={styles.tabContent}>
          {/* STEP 1: SCANNER */}
          {activeTab === 'scanner' && (
            <div className={`${styles.card} ${styles.fadeEnter}`}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>🔍 The Scanner</h2>
                  <p className={styles.cardText}>Paste your DEV.to article URL into the scanner. OriginTrace will automatically extract distinctive phrasing and search the web for potential plagiarism.</p>
                  <div className={styles.tipBox}>
                    <strong>Pro Tip:</strong> You can also trigger scans directly from the Agent Chat!
                  </div>
                </div>
                <div className={styles.imageBox}>
                  <img src="/screenshots/scanning.png" alt="Scanning Interface" className={styles.screenshot} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LEDGER */}
          {activeTab === 'ledger' && (
            <div className={`${styles.card} ${styles.fadeEnter}`}>
              <div className={styles.contentSplit}>
                <div className={styles.textContent}>
                  <h2>🗂️ The Ledger</h2>
                  <p className={styles.cardText}>All scanned articles and found copies are securely indexed into the <strong>Sanity Content Lake</strong>. Review overlap percentages and attribution signals in the History tab.</p>
                  <ul className={styles.statusList}>
                    <li><span className={styles.dotRed}></span> <strong>Unattributed Repost:</strong> Stolen without credit.</li>
                    <li><span className={styles.dotGreen}></span> <strong>Credited Syndication:</strong> Properly attributed.</li>
                  </ul>
                </div>
                <div className={styles.imageBox}>
                  <img src="/screenshots/results.png" alt="Ledger Results" className={styles.screenshot} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AGENT */}
          {activeTab === 'agent' && (
            <div className={`${styles.card} ${styles.fadeEnter}`}>
              <div className={styles.agentSplit}>
                <div className={styles.textContent}>
                  <h2>🤖 The AI Agent</h2>
                  <p className={styles.cardText}>The OriginTrace Agent uses the Sanity Context MCP to answer complex questions about your content ledger. It strictly acts as your copyright assistant.</p>
                  <div className={styles.imageBoxFull}>
                    <img src="/screenshots/agent_response.png" alt="Agent Chat" className={styles.screenshot} />
                  </div>
                </div>
                
                <div className={styles.promptColumnsVertical}>
                  <div className={styles.promptGroup}>
                    <h3>✅ Try these prompts</h3>
                    <ul className={styles.promptList}>
                      <li><code>Scan my dev.to post [DEV.TO URL]</code></li>
                      <li><code>Which article has the highest overlap percentage?</code></li>
                      <li><code>Draft a DMCA takedown notice for the worst offender.</code></li>
                    </ul>
                  </div>
                  <div className={styles.promptGroup}>
                    <h3 className={styles.badTitle}>❌ Blacklisted (Agent will refuse)</h3>
                    <ul className={`${styles.promptList} ${styles.promptListBad}`}>
                      <li><code>"Scan all my posts"</code> <span className={styles.reason}>(Timeout risk)</span></li>
                      <li><code>"Scan my Medium article"</code> <span className={styles.reason}>(DEV.to only)</span></li>
                      <li><code>"Write a React component"</code> <span className={styles.reason}>(Off-topic)</span></li>
                      <li><code>"Delete this article"</code> <span className={styles.reason}>(Read-only)</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
