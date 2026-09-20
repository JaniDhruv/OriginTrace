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

const VERDICT_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  original: {
    label: 'Original Content',
    icon: '✅',
    description: 'This content matches your canonical publication and appears to be your original work.',
  },
  credited_syndication: {
    label: 'Credited Syndication',
    icon: '🔗',
    description: 'This content contains passages from your work with proper attribution or link-back.',
  },
  unattributed_repost: {
    label: 'Unattributed Repost',
    icon: '🚨',
    description: 'This content contains passages from your work without proper attribution.',
  },
  no_match: {
    label: 'No Match',
    icon: '—',
    description: 'No significant overlap found between this content and your indexed portfolio.',
  },
  pending: {
    label: 'Pending Analysis',
    icon: '⏳',
    description: 'This URL has been queued for the next Knowledge Base build cycle.',
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

export default async function CheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const check = await getCheck(id);

  if (!check) {
    return (
      <div className="container page" style={{ textAlign: 'center' }}>
        <h1>Check Not Found</h1>
        <p className="text-secondary" style={{ marginTop: 12 }}>
          No provenance check found with this ID.
        </p>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: 24 }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  const config = VERDICT_CONFIG[check.verdict] || VERDICT_CONFIG.no_match;

  return (
    <div className="container page">
      {/* Back link */}
      <Link href="/" style={{ fontSize: '0.875rem', marginBottom: 24, display: 'inline-block' }}>
        ← Back to checks
      </Link>

      {/* Verdict Card */}
      <section className="section">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>{config.icon}</div>
          <div className={`verdict-badge verdict-${check.verdict}`} style={{ fontSize: '1.125rem', padding: '10px 24px', marginBottom: 16 }}>
            {config.label}
          </div>
          <p className="text-secondary" style={{ maxWidth: 500, margin: '0 auto' }}>
            {config.description}
          </p>
        </div>
      </section>

      {/* Checked URL */}
      <section className="section">
        <h3 style={{ marginBottom: 12 }}>Checked URL</h3>
        <div className="card">
          <a href={check.checkedUrl} target="_blank" rel="noopener noreferrer" className="text-mono">
            {check.checkedUrl}
          </a>
          {check.checkedTitle && (
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
              {check.checkedTitle}
            </p>
          )}
          <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.8125rem' }}>
            Checked on {new Date(check.checkedAt).toLocaleString()}
          </p>
        </div>
      </section>

      {/* Timeline — if matched article exists */}
      {check.matchedArticle && (
        <section className="section">
          <h3 style={{ marginBottom: 12 }}>Publication Timeline</h3>
          <div className="card">
            <div className="timeline">
              <div className="timeline-point">
                <div className="timeline-dot timeline-dot-original" />
                <div className="timeline-label">
                  <strong style={{ color: 'var(--color-original)' }}>Your Original</strong>
                  <br />
                  {new Date(check.matchedArticle.publishedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="timeline-line" />
              <div className="timeline-point">
                <div className="timeline-dot timeline-dot-checked" />
                <div className="timeline-label">
                  <strong style={{ color: 'var(--color-repost)' }}>Checked Page</strong>
                  <br />
                  {new Date(check.checkedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.875rem' }}>
                <strong>Original:</strong>{' '}
                <a href={check.matchedArticle.canonicalUrl} target="_blank" rel="noopener noreferrer">
                  {check.matchedArticle.title}
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Reconciled Passages */}
      {check.reconciledEntries && check.reconciledEntries.length > 0 && (
        <section className="section">
          <h3 style={{ marginBottom: 12 }}>Reconciled Passages</h3>
          {check.reconciledEntries.map((entry, i) => (
            <div key={i} className="diff-container" style={{ marginBottom: 16 }}>
              <div className="diff-panel">
                <div className="diff-panel-header">
                  Your Original
                </div>
                <div className="diff-text">{entry.originalPassage}</div>
              </div>
              <div className="diff-panel">
                <div className="diff-panel-header">
                  Found Content
                </div>
                <div className="diff-text">{entry.foundPassage}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Credit Request — only for unattributed reposts */}
      {check.verdict === 'unattributed_repost' && check.matchedArticle && (
        <section className="section">
          <h3 style={{ marginBottom: 12 }}>DMCA Complaint Template</h3>
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
        </section>
      )}

      {/* Pending notice */}
      {check.verdict === 'pending' && (
        <section className="section">
          <div className="card" style={{ textAlign: 'center', borderColor: 'var(--color-pending)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              This URL will be included in the next Knowledge Base build.
              <br />
              You&apos;ll be notified when the check completes.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
