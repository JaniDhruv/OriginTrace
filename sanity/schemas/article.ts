import { defineField, defineType } from 'sanity';

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full article content as Portable Text blocks for paragraph-level granularity.',
    }),
    defineField({
      name: 'bodyPlaintext',
      title: 'Body (Plaintext)',
      type: 'text',
      description: 'Plain text version of the body for KB indexing and comparison.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      description: 'The original publication timestamp — critical for provenance claims.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
      description: 'The original publication URL that proves ownership.',
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'DEV.to', value: 'devto' },
          { title: 'Medium', value: 'medium' },
          { title: 'Personal Blog', value: 'personal' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'user',
      title: 'User (Owner)',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'The user account who claims/owns this canonical article.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
    },
  },
});
