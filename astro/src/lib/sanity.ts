// src/lib/sanity.ts
// Sanity client configuration and helper functions

import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';
const apiVersion = '2024-01-01';

if (!projectId) {
  throw new Error(
    'SANITY_PROJECT_ID is not set. Add it to astro/.env locally, or to the ' +
      'Netlify site environment variables (Site configuration → Environment ' +
      'variables) so it is available at build time.',
  );
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Always fresh data at build time
  token: import.meta.env.SANITY_API_TOKEN,
  perspective: 'published', // never leak draft content into a static build
});

const builder = createImageUrlBuilder(client);

// Helper to generate Sanity image URLs. Accepts a raw image field
// ({ asset: { _ref } }), a raw asset reference ({ _ref }), or a
// dereferenced asset (the `asset-> { _id, url }` shape used throughout queries.ts).
export function sanityImageUrl(source: SanityImageSource, width: number = 800): string {
  if (!source) return '';
  return builder.image(source).width(width).auto('format').url();
}

// Companion to sanityImageUrl for responsive <img srcset>. Pair with a `sizes`
// attribute that reflects the real layout, or the browser will over-fetch.
export function sanityImageSrcSet(
  source: SanityImageSource,
  widths: number[] = [400, 600, 800, 1200],
): string {
  if (!source) return '';
  return widths.map((w) => `${sanityImageUrl(source, w)} ${w}w`).join(', ');
}