/**
 * Wix Blog -> Sanity post importer.
 *
 * Reads the 24 published posts from the live Wix Blog REST API (by slug),
 * converts each post's Ricos rich-content body to Sanity Portable Text, and
 * creates matching `post` documents in the Sanity `production` dataset so every
 * /post/<slug> URL resolves 1:1 with the old Wix site (zero redirects).
 *
 * Run from the sanity/ folder so @sanity/client resolves and --env-file finds .env:
 *
 *   cd sanity
 *   node --env-file=.env scripts/import-wix-posts.mjs               # DRY RUN (no writes)
 *   node --env-file=.env scripts/import-wix-posts.mjs --slug seo-content-planning
 *   node --env-file=.env scripts/import-wix-posts.mjs --limit 3
 *   node --env-file=.env scripts/import-wix-posts.mjs --write        # REAL import into production
 *
 * Env (all in sanity/.env): WIX_API_KEY, WIX_ACCOUNT_ID, WIX_SITE_ID,
 * SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET.
 */

import { createClient } from '@sanity/client'

// ---------------------------------------------------------------------------
// Config / args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const onlySlug = valFlag('--slug')
const limit = Number(valFlag('--limit')) || 0

function valFlag(name) {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const {
  WIX_API_KEY,
  WIX_ACCOUNT_ID,
  WIX_SITE_ID,
  SANITY_WRITE_TOKEN,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
} = process.env

for (const [k, v] of Object.entries({
  WIX_API_KEY, WIX_ACCOUNT_ID, WIX_SITE_ID,
  SANITY_WRITE_TOKEN, SANITY_PROJECT_ID, SANITY_DATASET,
})) {
  if (!v) {
    console.error(`Missing env var: ${k}. Add it to sanity/.env.`)
    process.exit(1)
  }
}

const WIX_BASE = 'https://www.wixapis.com'

// ---------------------------------------------------------------------------
// The 24 posts: slug + cover image (Wix CDN) + category slug + fallback date.
// Title / excerpt / body / meta all come from the Wix API. Category slugs must
// match existing Sanity category slugs (verified: 11 categories exist).
// Edit the `cat` values here if you want a different category mapping.
// ---------------------------------------------------------------------------
const IMG = (id) => `https://static.wixstatic.com/media/${id}`
const POSTS = [
  { slug: 'transform-your-online-presence-with-a-website-design-agency', cat: 'website-design-and-development', img: IMG('c933c9_59710a5bac1447f6a1db9164619c0dd7~mv2.jpg'), date: '2025-11-03' },
  { slug: 'seo-content-planning', cat: 'search-engine-optimization-seo', img: IMG('c933c9_d5f86e0017304477997ed74f7fc3e8ea~mv2.png'), date: '2025-09-18' },
  { slug: 'developing-an-effective-keyword-research-strategy', cat: 'search-engine-optimization-seo', img: IMG('c933c9_cbcc40d13818475392b35eb39c20c3ff~mv2.png'), date: '2025-11-17' },
  { slug: 'local-seo-solutions-maximize-local-reach-with-nearby-seo-services', cat: 'search-engine-optimization-seo', img: IMG('c933c9_c8541efdd7644606a83615e1bd2b5b62~mv2.jpg'), date: '2025-08-12' },
  { slug: 'unlock-local-success-with-advanced-seo-optimization', cat: 'search-engine-optimization-seo', img: IMG('c933c9_cb350df2ba4d43ae8ae5a95e81fe1c0d~mv2.png'), date: '2025-09-01' },
  { slug: 'keep-your-site-running-with-website-maintenance-services', cat: 'website-hosting-and-maintenance', img: IMG('c933c9_a2361b226fe247b19622992fabac2d1f~mv2.png'), date: '2025-11-12' },
  { slug: 'leverage-content-marketing-services-for-brand-growth', cat: 'content-marketing', img: IMG('c933c9_6151b9d91ff340d49e3d8fb1d6dbe491~mv2.png'), date: '2025-11-12' },
  { slug: 'the-importance-of-local-seo-for-small-businesses', cat: 'search-engine-optimization-seo', img: IMG('c933c9_9ff502fdb59e454b9d7b8c2d558ee8d6~mv2.jpg'), date: '2025-08-23' },
  { slug: 'unlocking-quick-seo-wins-for-funded-start-ups-to-attract-investors-and-customers', cat: 'search-engine-optimization-seo', img: IMG('c933c9_f1060d3473744725b96caf4fc469f6d1~mv2.jpg'), date: '2025-09-01' },
  { slug: 'seo-content-method-build-winning-strategies-for-seo', cat: 'search-engine-optimization-seo', img: IMG('c933c9_d38ccad273c648bcbbbda9d69081ac1a~mv2.png'), date: '2025-08-12' },
  { slug: 'the-importance-of-adaptable-web-development-for-your-business', cat: 'website-design-and-development', img: IMG('c933c9_8e7a529f3e4641c58dc42dfea52d25b2~mv2.png'), date: '2026-02-23' },
  { slug: 'digital-growth-for-startups-smbs', cat: 'content-marketing', img: IMG('c933c9_29f7766c408d4da69ba5693f5b8b72aa~mv2.jpg'), date: '2025-08-23' },
  { slug: 'find-the-best-local-seo-providers-for-your-area', cat: 'search-engine-optimization-seo', img: IMG('c933c9_9b8651f781b547d98f9966e2974bf490~mv2.png'), date: '2025-09-01' },
  { slug: 'grow-your-brand-with-expert-social-media-marketing-solutions', cat: 'social-media-marketing', img: IMG('c933c9_49c017961693481ca5589fdec3de8488~mv2.png'), date: '2025-08-12' },
  { slug: 'what-makes-a-top-website-design-company', cat: 'website-design-and-development', img: IMG('c933c9_d8358134632b492abee519d2487e76eb~mv2.jpg'), date: '2025-11-03' },
  { slug: 'engage-and-convert-with-premium-content-marketing-solutions', cat: 'content-marketing', img: IMG('c933c9_ab3c6a9efa1b4e1597555d40c375fde5~mv2.jpg'), date: '2025-08-28' },
  { slug: 'achieving-responsive-website-design-for-all-devices', cat: 'website-design-and-development', img: IMG('c933c9_75dd5ab6648647478ebad40565477dc3~mv2.png'), date: '2025-11-03' },
  { slug: 'boosting-social-media-engagement-for-your-brand', cat: 'social-media-marketing', img: IMG('c933c9_38f29619acde4bb2b234b53f3d80ac81~mv2.png'), date: '2025-11-24' },
  { slug: 'enhancing-user-experience-with-website-speed-optimization', cat: 'website-design-and-development', img: IMG('c933c9_dc93cf818b98434f948126377ed466e8~mv2.png'), date: '2026-02-23' },
  { slug: 'maximize-engagement-with-social-media-marketing-services', cat: 'social-media-marketing', img: IMG('c933c9_bca4288512c9403fbb07f343676e5de1~mv2.png'), date: '2025-09-30' },
  { slug: 'website-features-that-convert', cat: 'website-design-and-development', img: IMG('c933c9_59710a5bac1447f6a1db9164619c0dd7~mv2.jpg'), date: '2025-08-23' },
  { slug: 'optimize-your-business-with-local-seo-strategies', cat: 'search-engine-optimization-seo', img: IMG('c933c9_6ba01d9d1381427295b02dd28ca5061a~mv2.jpg'), date: '2025-09-30' },
  { slug: 'understanding-social-media-management-for-brands', cat: 'social-media-marketing', img: IMG('c933c9_3aea5f5724aa46bd89765cbeba7de421~mv2.png'), date: '2025-11-12' },
  { slug: 'boost-website-performance-and-seo-reporting-benefits', cat: 'analytics-and-performance-reporting', img: IMG('c933c9_8a843702f6e0482d90945d78ed373771~mv2.jpg'), date: '2025-08-12' },
]

// ---------------------------------------------------------------------------
// Sanity client
// ---------------------------------------------------------------------------
const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const key = () => Math.random().toString(36).slice(2, 12)

function truncate(str, max) {
  if (!str) return str
  if (str.length <= max) return str
  const cut = str.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

async function wixGetPostBySlug(slug) {
  const url = `${WIX_BASE}/v3/posts/slugs/${encodeURIComponent(slug)}` +
    `?fieldsets=RICH_CONTENT&fieldsets=SEO&fieldsets=URL&fieldsets=CONTENT_TEXT`
  const res = await fetch(url, {
    headers: {
      Authorization: WIX_API_KEY,
      'wix-account-id': WIX_ACCOUNT_ID,
      'wix-site-id': WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Wix ${res.status} ${res.statusText} for "${slug}": ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  return json.post
}

// ---- Ricos (Wix rich content) -> Portable Text ----------------------------
const warnings = []

function decorationsToMarks(decorations = [], markDefs) {
  const marks = []
  for (const d of decorations) {
    switch (d.type) {
      case 'BOLD': marks.push('strong'); break
      case 'ITALIC': marks.push('em'); break
      case 'UNDERLINE': marks.push('underline'); break
      case 'STRIKETHROUGH': marks.push('strike-through'); break
      case 'LINK': {
        const href = d.linkData?.link?.url
        if (href) {
          const k = key()
          markDefs.push({ _type: 'link', _key: k, href })
          marks.push(k)
        }
        break
      }
      default: break // COLOR, FONT_SIZE, etc. -> ignore styling, keep text
    }
  }
  return marks
}

// Convert a Ricos node whose children are TEXT nodes into PT spans + markDefs.
function textNodesToChildren(nodes = []) {
  const markDefs = []
  const children = []
  for (const n of nodes) {
    if (n.type !== 'TEXT') {
      // Salvage any nested text (e.g. unexpected inline node types)
      const nested = textNodesToChildren(n.nodes || [])
      children.push(...nested.children)
      markDefs.push(...nested.markDefs)
      continue
    }
    const text = n.textData?.text ?? ''
    const marks = decorationsToMarks(n.textData?.decorations, markDefs)
    children.push({ _type: 'span', _key: key(), text, marks })
  }
  if (children.length === 0) children.push({ _type: 'span', _key: key(), text: '', marks: [] })
  return { children, markDefs }
}

function textBlock(nodes, style = 'normal', extra = {}) {
  const { children, markDefs } = textNodesToChildren(nodes)
  return { _type: 'block', _key: key(), style, markDefs, children, ...extra }
}

// Recursively collect plain text from any Ricos node subtree.
function ricosPlainText(nodes = []) {
  let out = ''
  for (const n of nodes) {
    if (n.type === 'TEXT') out += n.textData?.text ?? ''
    else if (n.nodes?.length) out += ricosPlainText(n.nodes)
  }
  return out.trim()
}

// The `body` schema has no table type, so flatten a Ricos TABLE to one
// readable paragraph per row (cells joined by " | ").
function tableToBlocks(tableNode) {
  const blocks = []
  for (const row of tableNode.nodes || []) {
    const cells = (row.nodes || []).map((cell) => ricosPlainText(cell.nodes || [])).filter(Boolean)
    if (cells.length) {
      const text = cells.join('  |  ')
      blocks.push({
        _type: 'block', _key: key(), style: 'normal', markDefs: [],
        children: [{ _type: 'span', _key: key(), text, marks: [] }],
      })
    }
  }
  return blocks
}

// pendingImages collects {src, alt} so the caller can upload them (only on --write).
function ricosToPortableText(rich, pendingImages) {
  const out = []
  const nodes = rich?.nodes || []

  const walkList = (listNode, listItemType, level) => {
    for (const li of listNode.nodes || []) {
      // each LIST_ITEM contains PARAGRAPH (and possibly nested lists)
      for (const child of li.nodes || []) {
        if (child.type === 'PARAGRAPH') {
          out.push(textBlock(child.nodes, 'normal', { listItem: listItemType, level }))
        } else if (child.type === 'BULLETED_LIST') {
          walkList(child, 'bullet', level + 1)
        } else if (child.type === 'ORDERED_LIST') {
          walkList(child, 'number', level + 1)
        }
      }
    }
  }

  for (const node of nodes) {
    switch (node.type) {
      case 'PARAGRAPH':
        out.push(textBlock(node.nodes, 'normal'))
        break
      case 'HEADING': {
        const lvl = Math.min(6, Math.max(1, node.headingData?.level || 2))
        out.push(textBlock(node.nodes, `h${lvl}`))
        break
      }
      case 'BLOCKQUOTE':
        // blockquote wraps paragraphs
        for (const c of node.nodes || []) {
          out.push(textBlock(c.nodes || [], 'blockquote'))
        }
        break
      case 'BULLETED_LIST':
        walkList(node, 'bullet', 1)
        break
      case 'ORDERED_LIST':
        walkList(node, 'number', 1)
        break
      case 'IMAGE': {
        const id = node.imageData?.image?.src?.id || node.imageData?.image?.src?.url
        const alt = node.imageData?.altText || ''
        if (id) {
          const src = id.startsWith('http') ? id : IMG(id)
          pendingImages.push({ src, alt, _key: key() })
          out.push({ _type: 'image', _key: pendingImages[pendingImages.length - 1]._key, alt, _pendingSrc: src })
        }
        break
      }
      case 'TABLE':
        out.push(...tableToBlocks(node))
        break
      case 'DIVIDER':
        break // no direct PT equivalent in default schema; drop
      case 'CODE_BLOCK':
        out.push(textBlock(node.nodes, 'normal'))
        warnings.push('CODE_BLOCK flattened to paragraph')
        break
      default:
        // Unknown block: salvage text if it has children
        if (node.nodes?.length) out.push(textBlock(node.nodes, 'normal'))
        warnings.push(`Unhandled Ricos node type: ${node.type}`)
    }
  }
  return out
}

function seoMeta(post) {
  const tags = post.seoData?.tags || []
  let metaTitle, metaDescription
  for (const t of tags) {
    if (t.type === 'title' && t.children) metaTitle = t.children
    if (t.type === 'meta' && t.props?.name === 'description') metaDescription = t.props?.content
  }
  return { metaTitle, metaDescription }
}

function publishedAt(post, fallbackDate) {
  const d = post.firstPublishedDate
  if (typeof d === 'string') return new Date(d).toISOString()
  if (d?.seconds) return new Date(Number(d.seconds) * 1000).toISOString()
  return new Date(fallbackDate + 'T09:00:00Z').toISOString()
}

async function uploadImage(src, filename) {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Image fetch ${res.status} for ${src}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const asset = await sanity.assets.upload('image', buf, { filename })
  return asset._id
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nMode: ${WRITE ? 'WRITE (creating documents in production)' : 'DRY RUN (no writes)'}\n`)

  // Resolve author + category ids from Sanity (no hardcoded ids)
  const [author, categories] = await Promise.all([
    sanity.fetch(`*[_type=="person"]|order(_createdAt asc)[0]{_id, name}`),
    sanity.fetch(`*[_type=="category"]{_id, "s": slug.current}`),
  ])
  if (!author?._id) throw new Error('No person/author document found in Sanity to reference.')
  const catBySlug = Object.fromEntries(categories.map((c) => [c.s, c._id]))
  console.log(`Author: ${author.name} (${author._id})`)
  console.log(`Categories available: ${categories.length}\n`)

  let list = POSTS
  if (onlySlug) list = list.filter((p) => p.slug === onlySlug)
  if (limit) list = list.slice(0, limit)
  if (list.length === 0) { console.error('No posts matched.'); process.exit(1) }

  let ok = 0, failed = 0
  for (const p of list) {
    warnings.length = 0
    try {
      const catId = catBySlug[p.cat]
      if (!catId) throw new Error(`Category slug "${p.cat}" not found in Sanity`)

      const post = await wixGetPostBySlug(p.slug)
      if (!post) throw new Error('Wix returned no post')

      const pendingImages = []
      const body = ricosToPortableText(post.richContent, pendingImages)
      const bodyWords = (post.contentText || '')
        .split(/\s+/).filter(Boolean).length
      const excerpt = truncate((post.excerpt || post.contentText || '').trim(), 300)
      const { metaTitle, metaDescription } = seoMeta(post)

      console.log(`#${String(list.indexOf(p) + 1).padStart(2)} ${p.slug}`)
      console.log(`     title:   ${post.title}`)
      console.log(`     body:    ${body.length} blocks, ~${bodyWords} words, ${pendingImages.length} inline image(s)`)
      console.log(`     excerpt: ${excerpt ? excerpt.slice(0, 70) + (excerpt.length > 70 ? '…' : '') : '(none)'}`)
      console.log(`     meta:    title=${metaTitle ? '✓' : '✗'} desc=${metaDescription ? '✓' : '✗'}`)
      console.log(`     cat:     ${p.cat}   date: ${publishedAt(post, p.date).slice(0, 10)}`)
      if (warnings.length) console.log(`     ⚠ ${[...new Set(warnings)].join('; ')}`)
      if (!bodyWords || body.length === 0) console.log('     ⚠ EMPTY BODY — check this post')

      if (WRITE) {
        // Upload cover image + inline images
        const mainAssetId = await uploadImage(p.img, `${p.slug}-cover`)
        for (const img of pendingImages) {
          try {
            const assetId = await uploadImage(img.src, `${p.slug}-inline`)
            const block = body.find((b) => b._key === img._key)
            if (block) { block.asset = { _type: 'reference', _ref: assetId }; delete block._pendingSrc }
          } catch (e) {
            warnings.push(`inline image skipped: ${e.message}`)
            const idx = body.findIndex((b) => b._key === img._key)
            if (idx >= 0) body.splice(idx, 1)
          }
        }

        const doc = {
          _id: `wix-${p.slug}`.slice(0, 128),
          _type: 'post',
          title: post.title,
          slug: { _type: 'slug', current: p.slug },
          excerpt,
          mainImage: {
            _type: 'image',
            asset: { _type: 'reference', _ref: mainAssetId },
            alt: post.media?.altText || post.title,
          },
          body,
          author: { _type: 'reference', _ref: author._id },
          categories: [{ _type: 'reference', _key: key(), _ref: catId }],
          publishedAt: publishedAt(post, p.date),
          ...(metaTitle || metaDescription
            ? { seo: { ...(metaTitle ? { metaTitle: truncate(metaTitle, 60) } : {}), ...(metaDescription ? { metaDescription: truncate(metaDescription, 160) } : {}) } }
            : {}),
        }
        await sanity.createOrReplace(doc)
        console.log(`     ✅ written as ${doc._id}`)
      }
      ok++
    } catch (e) {
      failed++
      console.log(`     ❌ ${p.slug}: ${e.message}`)
    }
    console.log('')
  }

  console.log(`Done. ${ok} ok, ${failed} failed${WRITE ? '' : ' (dry run — nothing written)'}.`)
  if (!WRITE) console.log('Re-run with --write to create the documents in Sanity production.')
}

main().catch((e) => { console.error(e); process.exit(1) })
