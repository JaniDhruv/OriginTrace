import { defineField, defineType } from 'sanity';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
    }),
    defineField({
      name: 'profileUrl',
      title: 'Profile URL',
      type: 'url',
      description: 'Primary profile page (e.g., DEV.to profile).',
    }),
    defineField({
      name: 'handle',
      title: 'Handle',
      type: 'string',
      description: 'Username / handle on primary platform.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'handle',
    },
  },
});
