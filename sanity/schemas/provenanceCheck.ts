import { defineField, defineType } from 'sanity';

export const provenanceCheck = defineType({
  name: 'provenanceCheck',
  title: 'Provenance Check',
  type: 'document',
  fields: [
    defineField({
      name: 'checkedUrl',
      title: 'Checked URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'checkedTitle',
      title: 'Checked Page Title',
      type: 'string',
    }),
    defineField({
      name: 'matchedArticle',
      title: 'Matched Article',
      type: 'reference',
      to: [{ type: 'article' }],
      description: 'The canonical article this content matches, if any.',
    }),
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'The user who initiated this scan.',
    }),
    defineField({
      name: 'verdict',
      title: 'Verdict',
      type: 'string',
      options: {
        list: [
          { title: 'Original', value: 'original' },
          { title: 'Credited Syndication', value: 'credited_syndication' },
          { title: 'Unattributed Repost', value: 'unattributed_repost' },
          { title: 'No Match', value: 'no_match' },
          { title: 'Pending', value: 'pending' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'reconciledEntries',
      title: 'Reconciled Entries',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'originalPassage', title: 'Original Passage', type: 'text' }),
            defineField({ name: 'foundPassage', title: 'Found Passage', type: 'text' }),
            defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
            defineField({ name: 'sourceDate', title: 'Source Date', type: 'datetime' }),
          ],
        },
      ],
      description: 'Passages reconciled by the Knowledge Base showing overlap between sources.',
    }),
    defineField({
      name: 'overlapPercent',
      title: 'Duplicated Content (%)',
      type: 'number',
      description: 'Estimated amount of the original content duplicated by the checked page.',
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution Evidence',
      type: 'object',
      fields: [
        defineField({ name: 'hasAuthorName', title: 'Has Original Author Name', type: 'boolean' }),
        defineField({ name: 'hasOriginalLink', title: 'Has Original Post Link', type: 'boolean' }),
        defineField({ name: 'hasAttributionPhrase', title: 'Has Attribution Phrase', type: 'boolean' }),
        defineField({ name: 'detectedAuthor', title: 'Detected Page Author', type: 'string' }),
        defineField({ name: 'signals', title: 'Signals', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'missing', title: 'Missing Attribution', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'isProperlyAttributed', title: 'Properly Attributed', type: 'boolean' }),
      ],
    }),
    defineField({
      name: 'dmcaTemplate',
      title: 'DMCA Complaint Template',
      type: 'text',
      description: 'Draft takedown notice generated from overlap and attribution evidence.',
    }),
    defineField({
      name: 'checkedAt',
      title: 'Checked At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'checkedUrl',
      subtitle: 'verdict',
    },
  },
});
