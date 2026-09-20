'use client';

import { useState } from 'react';

interface AttributionSummary {
  hasAuthorName: boolean;
  hasOriginalLink: boolean;
  missing?: string[];
}

export function CreditRequest({
  originalTitle,
  originalUrl,
  originalDate,
  checkedUrl,
  checkedTitle,
  overlapPercent,
  attribution,
  authorName,
  dmcaTemplate,
}: {
  originalTitle: string;
  originalUrl: string;
  originalDate: string;
  checkedUrl: string;
  checkedTitle?: string;
  overlapPercent?: number;
  attribution?: AttributionSummary | null;
  authorName?: string | null;
  dmcaTemplate?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const message = dmcaTemplate || buildFallbackTemplate({
    originalTitle,
    originalUrl,
    originalDate,
    checkedUrl,
    checkedTitle,
    overlapPercent,
    attribution,
    authorName,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="credit-request">
      <pre>{message}</pre>
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button className="copy-btn" onClick={handleCopy} type="button">
          {copied ? 'Copied' : 'Copy to clipboard'}
        </button>
      </div>
    </div>
  );
}

function buildFallbackTemplate({
  originalTitle,
  originalUrl,
  originalDate,
  checkedUrl,
  checkedTitle,
  overlapPercent,
  attribution,
  authorName,
}: {
  originalTitle: string;
  originalUrl: string;
  originalDate: string;
  checkedUrl: string;
  checkedTitle?: string;
  overlapPercent?: number;
  attribution?: AttributionSummary | null;
  authorName?: string | null;
}) {
  const date = new Date(originalDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `Subject: DMCA takedown notice - unauthorized copy of "${originalTitle}"

To: [Designated DMCA Agent / Hosting Provider]

I am the copyright owner, or am authorized to act on behalf of the copyright owner, for the work identified below.

Copyrighted work:
Title: ${originalTitle}
Author: ${authorName || '[copyright owner / author name]'}
Original URL: ${originalUrl}
Originally published: ${date}

Infringing material:
Page title: ${checkedTitle || '[page title]'}
URL to remove or disable: ${checkedUrl}

Evidence:
OriginTrace found approximately ${overlapPercent || 0}% duplicated content.
Missing attribution: ${attribution?.missing?.join(', ') || 'original author name and original post link'}.
Author name present on republished page: ${attribution?.hasAuthorName ? 'yes' : 'no'}.
Original post link present on republished page: ${attribution?.hasOriginalLink ? 'yes' : 'no'}.

I have a good faith belief that use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

I state under penalty of perjury that the information in this notice is accurate and that I am the copyright owner, or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

Contact information:
Name: [full legal name]
Company: [optional]
Address: [mailing address]
Phone: [phone number]
Email: [email address]

Electronic signature:
/s/ [full legal name]

Date: [date]`;
}
