import { sanityReadClient } from '@/sanity/client';
import Link from 'next/link';
import { CreditRequest } from './CreditRequest';

export const dynamic = 'force-dynamic';

interface ReconciledEntry {
  originalPassage: string;
  foundPassage: string;
  sourceUrl: string;
  sourceDate: string;
}

interface CheckData {
  _id: string;
  checkedUrl: string;
  checkedTitle: string;
  verdict: string;
  overlapPercent?: number;
  attribution?: {
    hasAuthorName: boolean;
    hasOriginalLink: boolean;
    missing?: string[];
  } | null;
  dmcaTemplate?: string | null;
  reconciledEntries: ReconciledEntry[];
  checkedAt: string;
  matchedArticle: {
    _id: string;
    title: string;
    canonicalUrl: string;
    publishedAt: string;
    authorName?: string | null;
  } | null;
}

const VERDICT_CONFIG: Record<string, { label: string; emoji: string; description: string; colorClass: string; bgColor: string; borderColor: string }> = {
  original: {
    label: 'Original Content',
    emoji: '✓',
    description: 'This URL matches your canonical publication. It appears to be the original or an authorised mirror.',
    colorClass: 'var(--color-original)',
    bgColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  credited_syndication: {
    label: 'Credited Syndication',
    emoji: '⟳',
    description: 'This page contains passages from your work with proper attribution linking back to your original.',
    colorClass: 'var(--color-syndication)',
    bgColor: 'rgba(59, 130, 246, 0.06)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  unattributed_repost: {
    label: 'Unattributed Repost',
    emoji: '⚠',
    description: 'This page contains passages from your work without crediting you. Action is recommended.',
    colorClass: 'var(--color-repost)',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  no_match: {
    label: 'No Match Found',
    emoji: '—',
    description: 'No significant content overlap was found between this page and any indexed article.',
    colorClass: 'var(--text-muted)',
    bgColor: 'rgba(255,255,255, 0.02)',
    borderColor: 'var(--border-glass)',
  },
  pending: {
    label: 'Pending Analysis',
    emoji: '◌',
    description: 'This URL has been queued for the next Knowledge Base build cycle.',
    colorClass: 'var(--accent-primary)',
    bgColor: 'rgba(168, 85, 247, 0.06)',
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
};

async function getCheck(id: string): Promise<CheckData | null> {
  const query = `*[_type == "provenanceCheck" && _id == $id][0]{
    _id,
    checkedUrl,
    checkedTitle,
    verdict,
    overlapPercent,
    attribution,
    dmcaTemplate,
    reconciledEntries,
    checkedAt,
    "matchedArticle": matchedArticle->{
      _id,
      title,
      canonicalUrl,
      publishedAt,
      "authorName": author->name
    }
  }`;
  return sanityReadClient.fetch(query, { id });
}

export default async function CheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await getCheck(id);

  if (!check) {
    return (
      <div className="container page" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>404</div>
        <h1 className="text-gradient" style={{ marginBottom: 12 }}>Check Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          No provenance check found with this ID.
        </p>
        <Link href="/" className="btn btn-primary">← Back to Scanner</Link>
      </div>
    );
  }

  const config = VERDICT_CONFIG[check.verdict] || VERDICT_CONFIG.no_match;
  const isActionable = check.verdict === 'unattributed_repost';
  const originalDate = check.matchedArticle
    ? new Date(check.matchedArticle.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const checkedDate = new Date(check.checkedAt).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="container page" style={{ paddingTop: '60px', maxWidth: '900px' }}>

      {/* Back nav */}
      <div style={{ marginBottom: 36, display: 'flex', gap: 16 }}>
        <Link href="/" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Scanner
        </Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <Link href="/history" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          History
        </Link>
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {id.slice(0, 10)}…
        </span>
      </div>

      {/* === VERDICT HERO === */}
      <div
        style={{
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '28px',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `${config.colorClass}22`,
            border: `1.5px solid ${config.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: config.colorClass,
            flexShrink: 0,
            boxShadow: `0 0 24px ${config.borderColor}`,
          }}
        >
          {config.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div
            className="verdict-badge"
            style={{
              background: `${config.colorClass}18`,
              border: `1px solid ${config.borderColor}`,
              color: config.colorClass,
              marginBottom: '10px',
              fontSize: '0.72rem',
              padding: '5px 14px',
            }}
          >
            {config.label}
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '16px' }}>
            {config.description}
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {check.overlapPercent !== undefined && check.overlapPercent > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Overlap</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isActionable ? 'var(--color-repost)' : config.colorClass }}>{check.overlapPercent}%</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>Scanned</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{checkedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* === TWO-COLUMN INFO === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        
        {/* Checked URL */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Flagged URL
          </div>
          {check.checkedTitle && (
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', lineHeight: 1.3 }}>{check.checkedTitle}</div>
          )}
          <a
            href={check.checkedUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-repost)', wordBreak: 'break-all', lineHeight: 1.5, display: 'block' }}
          >
            {check.checkedUrl}
          </a>
        </div>

        {/* Original article */}
        {check.matchedArticle ? (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Original Article
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', lineHeight: 1.3 }}>
              {check.matchedArticle.title}
            </div>
            <a
              href={check.matchedArticle.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-original)', wordBreak: 'break-all', lineHeight: 1.5, display: 'block', marginBottom: '8px' }}
            >
              {check.matchedArticle.canonicalUrl}
            </a>
            {check.matchedArticle.authorName && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                by {check.matchedArticle.authorName} · {originalDate}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No article matched in Knowledge Base.</p>
          </div>
        )}
      </div>

      {/* === PUBLICATION TIMELINE === */}
      {check.matchedArticle && (
        <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Publication Timeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Original */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--color-original)', background: 'rgba(16, 185, 129, 0.2)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }} />
              <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--color-original)', fontWeight: 700, marginBottom: '2px' }}>Your Original</div>
                <div style={{ color: 'var(--text-muted)' }}>{originalDate}</div>
              </div>
            </div>

            {/* Line with label */}
            <div style={{ flex: 1, position: 'relative', margin: '0 8px', top: '-14px' }}>
              <div style={{ height: '1px', background: 'var(--border-glass)' }} />
              <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                → then later →
              </div>
            </div>

            {/* Checked */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${isActionable ? 'var(--color-repost)' : 'var(--color-syndication)'}`, background: isActionable ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', boxShadow: `0 0 12px ${isActionable ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}` }} />
              <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                <div style={{ color: isActionable ? 'var(--color-repost)' : 'var(--color-syndication)', fontWeight: 700, marginBottom: '2px' }}>This Page</div>
                <div style={{ color: 'var(--text-muted)' }}>{new Date(check.checkedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === RECONCILED PASSAGES === */}
      {check.reconciledEntries && check.reconciledEntries.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Matched Passages</h3>
            <span className="badge neutral">{check.reconciledEntries.length} pair{check.reconciledEntries.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {check.reconciledEntries.map((entry, i) => (
              <div key={i} className="diff-container">
                <div className="diff-panel">
                  <div className="diff-panel-header" style={{ color: 'var(--color-original)' }}>Original</div>
                  {entry.originalPassage}
                </div>
                <div className="diff-panel">
                  <div className="diff-panel-header" style={{ color: isActionable ? 'var(--color-repost)' : 'var(--text-muted)' }}>Found on Flagged Page</div>
                  {entry.foundPassage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === DMCA TEMPLATE === */}
      {isActionable && check.matchedArticle && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>DMCA Takedown Template</h3>
            <span className="badge danger">Action Required</span>
          </div>
          <div className="dmca-block">
            <div className="dmca-block-header">
              <div className="dmca-block-title">Ready-to-send notice — fill in your contact details below</div>
              <CreditRequest
                originalTitle={check.matchedArticle.title}
                originalUrl={check.matchedArticle.canonicalUrl}
                originalDate={check.matchedArticle.publishedAt}
                checkedUrl={check.checkedUrl}
                checkedTitle={check.checkedTitle}
                overlapPercent={check.overlapPercent || 0}
                attribution={check.attribution || null}
                authorName={check.matchedArticle.authorName || null}
                dmcaTemplate={check.dmcaTemplate || null}
              />
            </div>
            <pre style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', lineHeight: 1.7 }}>
              {check.dmcaTemplate || 'Template not available.'}
            </pre>
          </div>
        </div>
      )}

      {/* === PENDING === */}
      {check.verdict === 'pending' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, animation: 'spin 3s linear infinite', display: 'inline-block' }}>◌</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Analysis Queued</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            This URL will be included in the next Knowledge Base build cycle.
          </p>
        </div>
      )}

    </div>
  );
}
