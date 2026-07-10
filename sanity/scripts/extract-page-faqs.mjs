/**
 * Astro page -> faqs-extracted.json
 *
 * Reads the hardcoded `const faqs = [...]` literal (and the FAQAccordion
 * `title=` prop) out of each Astro page that renders an FAQ accordion, and
 * writes them to scripts/faqs-extracted.json.
 *
 * The literals are parsed out of the source rather than retyped by hand: the
 * question/answer strings are indexed content that also feeds FAQPage
 * structured data, so any transcription drift (a straight quote for a curly
 * one, an en dash for an em dash) would be a silent content change. Parsing
 * makes the migration byte-exact by construction.
 *
 * This is a one-shot migration aid. Once the pages have been cleaned to fetch
 * from Sanity the literals are gone, and faqs-extracted.json is the record of
 * what was imported — import-faqs.mjs reads the JSON, never the pages.
 *
 *   cd sanity
 *   node scripts/extract-page-faqs.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PAGES = resolve(HERE, '../../astro/src/pages')
const OUT = resolve(HERE, 'faqs-extracted.json')

// page file -> { slug, title, sectionTitle }
// `slug` is the CMS filter key the page will query by after cleanup.
const CATEGORIES = [
  { file: 'index.astro', slug: 'homepage', title: 'Homepage' },
  { file: 'about-us.astro', slug: 'about-us', title: 'About Us' },
  { file: 'contact.astro', slug: 'contact', title: 'Contact' },
  { file: 'portfolio/index.astro', slug: 'portfolio', title: 'Portfolio' },
  { file: 'services/index.astro', slug: 'services', title: 'Services Overview' },
  { file: 'services/web-development/index.astro', slug: 'web-development', title: 'Web Development' },
  { file: 'services/digital-marketing/index.astro', slug: 'digital-marketing', title: 'Digital Marketing' },
  { file: 'services/creative-branding/index.astro', slug: 'creative-branding', title: 'Creative Branding' },
  { file: 'services/web-design-development/index.astro', slug: 'web-design-development', title: 'Website Design & Development' },
  { file: 'services/ecommerce-solutions/index.astro', slug: 'ecommerce-solutions', title: 'E-commerce Solutions' },
  { file: 'services/website-maintenance/index.astro', slug: 'website-maintenance', title: 'Website Hosting & Maintenance' },
  { file: 'services/search-engine-optimization-seo/index.astro', slug: 'search-engine-optimization-seo', title: 'Search Engine Optimization (SEO)' },
  { file: 'services/content-marketing/index.astro', slug: 'content-marketing', title: 'Content Marketing' },
  { file: 'services/social-media-marketing/index.astro', slug: 'social-media-marketing', title: 'Social Media Marketing' },
  { file: 'services/ppc-advertising/index.astro', slug: 'ppc-advertising', title: 'PPC Advertising' },
  { file: 'services/email-marketing/index.astro', slug: 'email-marketing', title: 'Email Marketing' },
  { file: 'services/analytics-and-performance-reporting/index.astro', slug: 'analytics-and-performance-reporting', title: 'Analytics & Performance Reporting' },
  { file: 'services/logo-and-brand-identity/index.astro', slug: 'logo-and-brand-identity', title: 'Logo & Brand Identity' },
  { file: 'services/graphic-visual-design/index.astro', slug: 'graphic-visual-design', title: 'Graphic & Visual Design' },
]

// Pull the `const faqs = [ ... ];` array literal and evaluate it. The literal is
// plain JS data (no identifiers, no calls), so a Function wrapper is enough.
function extractFaqs(src, file) {
  const start = src.indexOf('const faqs = [')
  if (start === -1) throw new Error(`No 'const faqs = [' found in ${file}`)

  const open = src.indexOf('[', start)
  let depth = 0
  let end = -1
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) throw new Error(`Unbalanced faqs array in ${file}`)

  const literal = src.slice(open, end + 1)
  const faqs = new Function(`return ${literal}`)()

  faqs.forEach((faq, i) => {
    if (typeof faq.question !== 'string' || typeof faq.answer !== 'string') {
      throw new Error(`${file}: entry ${i} is not a {question, answer} pair`)
    }
  })
  return faqs
}

// <FAQAccordion title="..." faqs={faqs} /> — absent on the homepage, which
// renders the accordion with no heading.
function extractSectionTitle(src) {
  const tag = src.match(/<FAQAccordion\b[^>]*>/)
  if (!tag) return undefined
  const title = tag[0].match(/\btitle="([^"]*)"/)
  return title ? title[1] : undefined
}

const out = CATEGORIES.map((category, index) => {
  const src = readFileSync(resolve(PAGES, category.file), 'utf8')
  return {
    ...category,
    displayOrder: (index + 1) * 10,
    sectionTitle: extractSectionTitle(src),
    faqs: extractFaqs(src, category.file).map((faq, i) => ({
      question: faq.question,
      answer: faq.answer,
      displayOrder: (i + 1) * 10,
    })),
  }
})

writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8')

const total = out.reduce((n, c) => n + c.faqs.length, 0)
console.log(`Wrote ${out.length} categories / ${total} FAQs to ${OUT}`)
for (const c of out) {
  console.log(`  ${c.slug.padEnd(38)} ${String(c.faqs.length).padStart(2)} FAQs  title=${JSON.stringify(c.sectionTitle)}`)
}
