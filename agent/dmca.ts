import type { AttributionReport } from './verdict';

export interface DmcaTemplateParams {
  originalTitle: string;
  originalUrl: string;
  originalPublishDate: string | null;
  checkedTitle: string;
  checkedUrl: string;
  overlapPercent: number;
  attribution: AttributionReport | null;
  matchedPassages?: { original: string; found: string }[];
  authorName?: string | null;
}

export function generateDMCATemplate(params: DmcaTemplateParams): string {
  const {
    originalTitle,
    originalUrl,
    originalPublishDate,
    checkedTitle,
    checkedUrl,
    overlapPercent,
    attribution,
    matchedPassages = [],
    authorName,
  } = params;

  const publishedLine = originalPublishDate
    ? `Originally published: ${formatDate(originalPublishDate)}`
    : 'Originally published: [original publication date]';

  const missingAttribution = attribution?.missing.length
    ? attribution.missing.join(', ')
    : 'none detected';

  const passageEvidence = matchedPassages.length
    ? matchedPassages
        .slice(0, 3)
        .map((passage, index) => {
          return [
            `Evidence passage ${index + 1}:`,
            `Original: "${trimEvidence(passage.original)}"`,
            `Found: "${trimEvidence(passage.found)}"`,
          ].join('\n');
        })
        .join('\n\n')
    : 'Evidence passages: [attach screenshots, copied excerpts, or export from OriginTrace]';

  return `Subject: DMCA takedown notice - unauthorized copy of "${originalTitle}"

To: [Designated DMCA Agent / Hosting Provider]

I am the copyright owner, or am authorized to act on behalf of the copyright owner, for the work identified below.

Copyrighted work:
Title: ${originalTitle}
Author: ${authorName || '[copyright owner / author name]'}
Original URL: ${originalUrl}
${publishedLine}

Infringing material:
Page title: ${checkedTitle || '[page title]'}
URL to remove or disable: ${checkedUrl}

Evidence:
OriginTrace found approximately ${overlapPercent}% duplicated content.
Missing attribution: ${missingAttribution}.
Author name present on republished page: ${attribution?.hasAuthorName ? 'yes' : 'no'}.
Original post link present on republished page: ${attribution?.hasOriginalLink ? 'yes' : 'no'}.

${passageEvidence}

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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function trimEvidence(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 420);
}
