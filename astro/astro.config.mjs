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

const projectId = SANITY_PROJECT_ID;
const dataset = SANITY_DATASET || 'production';

if (!projectId) {
  throw new Error(
    'SANITY_PROJECT_ID is not set. Add it to astro/.env locally, or to the ' +
      'Netlify site environment variables (Site configuration → Environment ' +
      'variables) so it is available at build time.'
  );
}

// https://astro.build/config
export default defineConfig({
  site: 'https://zyrithtech.com',
  output: 'static',

  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
  },

  integrations: [
    sanity({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false, // for static builds
    }),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
