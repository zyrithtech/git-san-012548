/**
 * faqs-extracted.json -> Sanity `faqCategory` + `faq` documents.
 *
 * Creates one faqCategory per page that renders an FAQ accordion, and one faq
 * document per question, referencing its category. Document IDs are derived
 * from the category slug, so re-running replaces the same documents rather
 * than creating duplicates.
 *
 * Documents are created published (no `drafts.` prefix) because the Astro build
 * client uses perspective: 'published' and would otherwise render nothing.
 *
 * Run from the sanity/ folder so @sanity/client resolves and --env-file finds .env:
 *
 *   cd sanity
 *   node --env-file=.env scripts/import-faqs.mjs            # DRY RUN (no writes)
 *   node --env-file=.env scripts/import-faqs.mjs --write     # real import into production
 *
 * Env (all in sanity/.env): SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

const HERE = dirname(fileURLToPath(import.meta.url))
const WRITE = process.argv.includes('--write')

const { SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET } = process.env

for (const [k, v] of Object.entries({ SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET })) {
  if (!v) {
    console.error(`Missing env var: ${k}. Add it to sanity/.env.`)
    process.exit(1)
  }
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
})

const categories = JSON.parse(readFileSync(resolve(HERE, 'faqs-extracted.json'), 'utf8'))

const docs = []
for (const category of categories) {
  const categoryId = `faqCategory-${category.slug}`

  docs.push({
    _id: categoryId,
    _type: 'faqCategory',
    title: category.title,
    slug: { _type: 'slug', current: category.slug },
    ...(category.sectionTitle ? { sectionTitle: category.sectionTitle } : {}),
    description: `FAQs rendered on the ${category.title} page.`,
    displayOrder: category.displayOrder,
  })

  for (const faq of category.faqs) {
    docs.push({
      _id: `faq-${category.slug}-${faq.displayOrder / 10}`,
      _type: 'faq',
      question: faq.question,
      answer: faq.answer,
      category: { _type: 'reference', _ref: categoryId },
      displayOrder: faq.displayOrder,
    })
  }
}

const categoryCount = docs.filter((d) => d._type === 'faqCategory').length
const faqCount = docs.filter((d) => d._type === 'faq').length

console.log(
  `${WRITE ? 'IMPORTING' : 'DRY RUN'}: ${categoryCount} faqCategory + ${faqCount} faq documents ` +
    `into ${SANITY_PROJECT_ID}/${SANITY_DATASET}`,
)

if (!WRITE) {
  for (const doc of docs) {
    const label = doc._type === 'faqCategory' ? doc.title : doc.question
    console.log(`  ${doc._id.padEnd(46)} ${label.slice(0, 70)}`)
  }
  console.log('\nNo writes performed. Re-run with --write to import.')
  process.exit(0)
}

// createOrReplace keeps the script idempotent: a second run overwrites the same
// IDs instead of duplicating every question.
const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction())

try {
  await tx.commit()
  console.log(`Done. Imported ${categoryCount} categories and ${faqCount} FAQs.`)
} catch (error) {
  console.error('Import failed:', error.message)
  process.exit(1)
}
