import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://zyrithtech.com',
  output: 'static',
  
  integrations: [
    sanity({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,// || 'production',
      apiVersion: '2024-01-01',
      useCdn: false,
    }),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  
  adapter: netlify(),
  
  vite: {
    ssr: {
      external: ['svgo'],
    },
  },
});




