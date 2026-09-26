import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { article, author, provenanceCheck, user } from './schemas';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'origintrace',
  title: 'OriginTrace',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {
    types: [user, article, author, provenanceCheck],
  },
});
