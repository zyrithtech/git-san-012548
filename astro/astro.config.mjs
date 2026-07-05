// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';

const { SANITY_PROJECT_ID, SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  ''
);

// https://astro.build/config
export default defineConfig({
  site: 'https://zyrithtech.com',
  output: 'static',

  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
  },

  integrations: [
    sanity({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: '2024-01-01',
      useCdn: false, // for static builds
    }),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
