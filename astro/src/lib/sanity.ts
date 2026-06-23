// src/lib/sanity.ts
// Sanity client configuration and helper functions

import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;// || 'production';
const apiVersion = '2024-01-01';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Always fresh data at build time
  token: import.meta.env.SANITY_API_TOKEN,
});

// Helper to generate Sanity image URLs
export function sanityImageUrl(asset: any, width: number = 800): string {
  if (!asset?._ref) return '';
  
  const id = asset._ref.replace('image-', '').replace(/-\d+$/, '');
  const format = asset._ref.split('-').pop();
  
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${width}w.${format}`;
}