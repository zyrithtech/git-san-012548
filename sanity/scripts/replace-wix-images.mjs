/**
 * Replace Wix-licensed post images with free-license Pexels photos.
 *
 * Wix stock is only licensed while content is hosted on Wix, so every migrated
 * image (24 covers + 52 inline) must be swapped before launch. For each image
 * this script searches Pexels using the image's existing alt text, uploads a
 * royalty-free replacement to Sanity, repoints the reference, and (unless
 * --keep-old) deletes the now-unreferenced Wix-sourced asset. Alt text is
 * preserved. Replacement assets are tagged source.name="pexels" so re-runs skip
 * already-replaced images (idempotent).
 *
 *   cd sanity
 *   node --env-file=.env scripts/replace-wix-images.mjs                # DRY RUN: show matches, no writes
 *   node --env-file=.env scripts/replace-wix-images.mjs --slug seo-content-planning
 *   node --env-file=.env scripts/replace-wix-images.mjs --write        # replace + delete old assets
 *   node --env-file=.env scripts/replace-wix-images.mjs --write --keep-old
 *
 * Env (sanity/.env): PEXELS_API_KEY, SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET.
 */

import { createClient } from '@sanity/client'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const KEEP_OLD = args.includes('--keep-old')
const onlySlug = flag('--slug')
const EXCLUDE = new Set((flag('--exclude') || '').split(',').map((s) => s.trim()).filter(Boolean))
function flag(n) { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }

const { PEXELS_API_KEY, SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET } = process.env
for (const [k, v] of Object.entries({ PEXELS_API_KEY, SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET })) {
  if (!v) { console.error(`Missing env var: ${k}. Add it to sanity/.env.`); process.exit(1) }
}

const SLUGS = [
  'transform-your-online-presence-with-a-website-design-agency', 'seo-content-planning',
  'developing-an-effective-keyword-research-strategy', 'local-seo-solutions-maximize-local-reach-with-nearby-seo-services',
  'unlock-local-success-with-advanced-seo-optimization', 'keep-your-site-running-with-website-maintenance-services',
  'leverage-content-marketing-services-for-brand-growth', 'the-importance-of-local-seo-for-small-businesses',
  'unlocking-quick-seo-wins-for-funded-start-ups-to-attract-investors-and-customers', 'seo-content-method-build-winning-strategies-for-seo',
  'the-importance-of-adaptable-web-development-for-your-business', 'digital-growth-for-startups-smbs',
  'find-the-best-local-seo-providers-for-your-area', 'grow-your-brand-with-expert-social-media-marketing-solutions',
  'what-makes-a-top-website-design-company', 'engage-and-convert-with-premium-content-marketing-solutions',
  'achieving-responsive-website-design-for-all-devices', 'boosting-social-media-engagement-for-your-brand',
  'enhancing-user-experience-with-website-speed-optimization', 'maximize-engagement-with-social-media-marketing-services',
  'website-features-that-convert', 'optimize-your-business-with-local-seo-strategies',
  'understanding-social-media-management-for-brands', 'boost-website-performance-and-seo-reporting-benefits',
]

const sanity = createClient({
  projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET,
  apiVersion: '2024-01-01', token: SANITY_WRITE_TOKEN, useCdn: false,
})

const STOPWORDS = new Set(['a','an','the','of','for','and','to','with','your','you','in','on','is','it','that','this','how','what','why','are','be','can','from','their','our'])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Turn descriptive alt text into a concise Pexels query (drop filler, cap length).
function toQuery(alt) {
  const words = (alt || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
  return words.slice(0, 6).join(' ').trim()
}

const queryUse = new Map() // spread picks so similar queries don't all get photo #1
async function pexelsSearch(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } })
  if (res.status === 429) throw new Error('Pexels rate limit (429) — wait an hour or slow down')
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}"`)
  const json = await res.json()
  const photos = json.photos || []
  if (!photos.length) return null
  const i = queryUse.get(query) || 0
  queryUse.set(query, i + 1)
  return photos[i % photos.length]
}

// alt -> query with fallbacks (shorter query, then category, then generic)
async function findPhoto(alt, categoryTitle) {
  const candidates = [toQuery(alt), toQuery(alt).split(' ').slice(0, 3).join(' '),
    (categoryTitle || '').toLowerCase(), 'business technology office']
  for (const q of candidates) {
    if (!q) continue
    const p = await pexelsSearch(q)
    if (p) return { photo: p, query: q }
    await sleep(120)
  }
  return null
}

async function uploadFromUrl(src, filename, photo) {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Download ${res.status} for ${src}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return sanity.assets.upload('image', buf, {
    filename,
    creditLine: `Photo by ${photo.photographer} on Pexels`,
    source: { name: 'pexels', id: String(photo.id), url: photo.url },
  })
}

async function main() {
  console.log(`\nMode: ${WRITE ? 'WRITE (replacing images' + (KEEP_OLD ? '' : ' + deleting old assets') + ')' : 'DRY RUN (search only, no writes)'}\n`)

  let slugs = SLUGS
  if (onlySlug) slugs = slugs.filter((s) => s === onlySlug)

  const posts = await sanity.fetch(
    `*[_type=="post" && slug.current in $slugs]{
      _id, "slug": slug.current, "cat": categories[0]->title,
      mainImage{ alt, "assetId": asset->_id, "src": asset->source },
      "bodyImages": body[_type=="image"]{ _key, alt, "assetId": asset->_id, "src": asset->source }
    }`, { slugs }
  )

  const oldAssets = new Set()
  let replaced = 0, skipped = 0, failed = 0

  for (const post of posts) {
    const targets = [
      { kind: 'cover', alt: post.mainImage?.alt, assetId: post.mainImage?.assetId, isPexels: post.mainImage?.src?.name === 'pexels' },
      ...post.bodyImages.map((b) => ({ kind: `inline ${b._key}`, alt: b.alt, assetId: b.assetId, isPexels: b.src?.name === 'pexels', _key: b._key })),
    ].filter((t) => t.assetId)

    console.log(`▶ ${post.slug}`)
    for (const t of targets) {
      if (t._key && EXCLUDE.has(t._key)) { console.log(`   • ${t.kind}: excluded — skip`); skipped++; continue }
      if (t.isPexels) { console.log(`   • ${t.kind}: already Pexels — skip`); skipped++; continue }
      try {
        const found = await findPhoto(t.alt, post.cat)
        if (!found) { console.log(`   ⚠ ${t.kind}: no Pexels match for "${t.alt?.slice(0, 50)}"`); failed++; continue }
        const { photo, query } = found
        console.log(`   • ${t.kind}: "${query}" -> pexels#${photo.id} by ${photo.photographer}`)

        if (WRITE) {
          const asset = await uploadFromUrl(photo.src.large2x || photo.src.large || photo.src.original,
            `${post.slug}-${t.kind.startsWith('cover') ? 'cover' : 'inline'}-pexels-${photo.id}.jpg`, photo)
          const path = t.kind === 'cover' ? 'mainImage.asset' : `body[_key=="${t._key}"].asset`
          await sanity.patch(post._id).set({ [path]: { _type: 'reference', _ref: asset._id } }).commit()
          if (t.assetId) oldAssets.add(t.assetId)
          console.log(`     ✅ replaced (${asset._id})`)
        }
        replaced++
        await sleep(150)
      } catch (e) {
        console.log(`   ❌ ${t.kind}: ${e.message}`)
        failed++
      }
    }
    console.log('')
  }

  if (WRITE && !KEEP_OLD && oldAssets.size) {
    console.log(`Deleting ${oldAssets.size} old Wix-sourced asset(s)...`)
    let del = 0, keptRef = 0
    for (const id of oldAssets) {
      try { await sanity.delete(id); del++ }
      catch { keptRef++ } // still referenced elsewhere — leave it
    }
    console.log(`  deleted ${del}, left ${keptRef} (still referenced)\n`)
  }

  console.log(`Done. ${replaced} ${WRITE ? 'replaced' : 'matched'}, ${skipped} already-Pexels, ${failed} failed.`)
  if (!WRITE) console.log('Re-run with --write to upload replacements and repoint references.')
}

main().catch((e) => { console.error(e); process.exit(1) })
