import { createClient, type SanityClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN || '';

function createSanityClient(options: { useCdn: boolean; withToken: boolean }): SanityClient {
  // During build without env vars, return a client that will fail gracefully at runtime
  if (!projectId) {
    console.warn('NEXT_PUBLIC_SANITY_PROJECT_ID not set — Sanity queries will fail.');
  }

  return createClient({
    projectId: projectId || 'placeholder',
    dataset,
    apiVersion: '2024-01-01',
    useCdn: options.useCdn,
    ...(options.withToken && token ? { token } : {}),
  });
}

/** Write client — used for creating/updating documents. Requires SANITY_API_TOKEN. */
export const sanityClient = createSanityClient({ useCdn: false, withToken: true });

/** Read client — uses CDN for faster reads. No token needed for public datasets. */
export const sanityReadClient = createSanityClient({ useCdn: true, withToken: false });
