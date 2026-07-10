// src/lib/queries.ts
// All GROQ queries for fetching content from Sanity at build time.

import { client } from './sanity';

// ========================================
// CASE STUDIES / WORK / PORTFOLIO
// ========================================

export async function getAllCaseStudies() {
  try {
    return await client.fetch(`
      *[_type == "caseStudy"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        client,
        industry,
        services,
        challenge,
        approach,
        results[] { metric, value, description },
        gallery[] { asset-> { _id, url }, alt, hotspot, crop },
        testimonial { quote, name, role },
        publishedAt,
        featuredImage { asset-> { _id, url }, alt },
        featured,
        seo { metaTitle, metaDescription, ogImage }
      }
    `);
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return [];
  }
}

export async function getFeaturedCaseStudies() {
  try {
    return await client.fetch(`
      *[_type == "caseStudy" && featured == true] | order(publishedAt desc) [0...3] {
        _id,
        title,
        slug,
        client,
        industry,
        services,
        results[] { metric, value, description },
        featuredImage { asset-> { _id, url }, alt },
        publishedAt
      }
    `);
  } catch (error) {
    console.error('Error fetching featured case studies:', error);
    return [];
  }
}

// Homepage testimonial slider. `showOnHomepage` is compared against false rather
// than true so a case study that predates the field still opts in, matching the
// schema's `initialValue: true`.
export async function getHomepageTestimonials() {
  try {
    return await client.fetch(`
      *[_type == "caseStudy"
        && defined(testimonial.quote)
        && testimonial.showOnHomepage != false
      ] | order(coalesce(displayOrder, 9999) asc, client asc) {
        _id,
        "quote": testimonial.quote,
        "client": client,
        "service": coalesce(testimonial.serviceLabel, services[0])
      }
    `);
  } catch (error) {
    console.error('Error fetching homepage testimonials:', error);
    return [];
  }
}

// Client names for the homepage marquee below the hero.
export async function getMarqueeClients() {
  try {
    const rows = await client.fetch(`
      *[_type == "caseStudy"
        && defined(client)
        && showInClientMarquee != false
      ] | order(coalesce(displayOrder, 9999) asc, client asc) {
        "client": client
      }
    `);
    // Two case studies can share a client; the marquee should name them once.
    return [...new Set(rows.map((row: { client: string }) => row.client))] as string[];
  } catch (error) {
    console.error('Error fetching marquee clients:', error);
    return [];
  }
}

export async function getCaseStudyBySlug(slug: string) {
  try {
    return await client.fetch(
      `*[_type == "caseStudy" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        client,
        industry,
        services,
        challenge,
        approach,
        results[] { metric, value, description },
        gallery[] { asset-> { _id, url }, alt, hotspot, crop },
        testimonial { quote, name, role },
        publishedAt,
        featuredImage { asset-> { _id, url }, alt },
        seo { metaTitle, metaDescription, ogImage }
      }`,
      { slug }
    );
  } catch (error) {
    console.error(`Error fetching case study with slug ${slug}:`, error);
    return null;
  }
}

export async function getAllCaseStudySlugs() {
  try {
    return await client.fetch(`
      *[_type == "caseStudy"] { 
        "slug": slug.current 
      }
    `);
  } catch (error) {
    console.error('Error fetching case study slugs:', error);
    return [];
  }
}

export async function getCaseStudiesByService(service: string) {
  try {
    return await client.fetch(
      `*[_type == "caseStudy" && $service in services] | order(publishedAt desc) {
        _id,
        title,
        slug,
        client,
        industry,
        services,
        results[] { metric, value, description },
        featuredImage { asset-> { _id, url }, alt },
        publishedAt
      }`,
      { service }
    );
  } catch (error) {
    console.error(`Error fetching case studies for service ${service}:`, error);
    return [];
  }
}

// ========================================
// BLOG POSTS
// ========================================

export async function getAllPosts() {
  try {
    return await client.fetch(`
      *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        body,
        publishedAt,
        _updatedAt,
        mainImage { asset-> { _id, url }, alt },
        author -> { name, slug, role, bio, photo { asset-> { _id, url } }, linkedIn, twitter, website, expertise },
        categories[] -> { title, slug },
        cta { heading, subtext, buttonText },
        seo { metaTitle, metaDescription, ogImage }
      }
    `);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getLatestBlogPosts(limit: number = 3) {
  try {
    return await client.fetch(`
      *[_type == "post"] | order(publishedAt desc) [0...${limit}] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        mainImage { asset-> { _id, url }, alt },
        categories[] -> { title, slug }
      }
    `);
  } catch (error) {
    console.error('Error fetching latest blog posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    return await client.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        excerpt,
        body,
        publishedAt,
        _updatedAt,
        mainImage { asset-> { _id, url }, alt },
        author -> { name, slug, role, bio, photo { asset-> { _id, url } }, linkedIn, twitter, website, expertise },
        categories[] -> { title, slug },
        seo { metaTitle, metaDescription, ogImage }
      }`,
      { slug }
    );
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null;
  }
}

export async function getAllPostSlugs() {
  try {
    return await client.fetch(`
      *[_type == "post"] { 
        "slug": slug.current 
      }
    `);
  } catch (error) {
    console.error('Error fetching post slugs:', error);
    return [];
  }
}

export async function getPostsByCategory(categorySlug: string) {
  try {
    return await client.fetch(
      `*[_type == "post" && $slug in categories[]->slug.current] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        mainImage { asset-> { _id, url }, alt },
        categories[] -> { title, slug }
      }`,
      { slug: categorySlug }
    );
  } catch (error) {
    console.error(`Error fetching posts for category ${categorySlug}:`, error);
    return [];
  }
}

// ========================================
// FAQs
// ========================================

export interface Faq {
  question: string;
  answer: string;
}

export interface FaqSection {
  /** Heading above the accordion. Undefined on pages that render it bare. */
  sectionTitle?: string;
  faqs: Faq[];
}

// FAQs are rendered as visible copy *and* as schema.org FAQPage structured data
// that search and AI answer engines index. A page that quietly builds with zero
// FAQs would drop indexed content and emit an empty, invalid FAQPage block — a
// silent SEO regression that no test would catch. So unlike the other queries in
// this file, this one throws rather than returning [] and letting the build pass.
export async function getFaqSection(categorySlug: string): Promise<FaqSection> {
  let section: FaqSection | null;

  try {
    section = await client.fetch(
      `*[_type == "faqCategory" && slug.current == $slug][0] {
        sectionTitle,
        "faqs": *[_type == "faq" && references(^._id)]
          | order(coalesce(displayOrder, 9999) asc) {
            question,
            answer
          }
      }`,
      { slug: categorySlug }
    );
  } catch (error) {
    throw new Error(
      `Failed to fetch FAQ category "${categorySlug}" from Sanity: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!section) {
    throw new Error(
      `No faqCategory in Sanity with slug "${categorySlug}". Create it in the ` +
        `Studio, or fix the slug this page queries by.`
    );
  }

  if (section.faqs.length === 0) {
    throw new Error(
      `faqCategory "${categorySlug}" has no FAQs. Refusing to build a page with ` +
        `an empty FAQ section and invalid FAQPage structured data.`
    );
  }

  return section;
}

export async function getAllFaqCategories() {
  try {
    return await client.fetch(`
      *[_type == "faqCategory"] | order(coalesce(displayOrder, 9999) asc) {
        _id,
        title,
        slug,
        sectionTitle,
        "faqCount": count(*[_type == "faq" && references(^._id)])
      }
    `);
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return [];
  }
}

// ========================================
// METADATA & UTILITIES
// ========================================

export async function getAllCaseStudyTags() {
  try {
    const studies = await client.fetch(`*[_type == "caseStudy"] { services }`);
    const allServices = new Set<string>();
    
    studies.forEach((study: any) => {
      if (study.services && Array.isArray(study.services)) {
        study.services.forEach((service: string) => {
          allServices.add(service);
        });
      }
    });
    
    return Array.from(allServices).sort();
  } catch (error) {
    console.error('Error fetching case study tags:', error);
    return [];
  }
}

export async function getAllBlogCategories() {
  try {
    return await client.fetch(`
      *[_type == "category"] | order(title asc) {
        _id,
        title,
        slug,
        description
      }
    `);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}

// ========================================
// PEOPLE (Authors, Team)
// ========================================

export async function getAllAuthors() {
  try {
    return await client.fetch(`
      *[_type == "person"] {
        _id,
        name,
        role,
        bio,
        photo { asset-> { _id, url } },
        linkedIn
      }
    `);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

export async function getAuthorByName(name: string) {
  try {
    return await client.fetch(
      `*[_type == "person" && name == $name][0] {
        _id,
        name,
        role,
        bio,
        photo { asset-> { _id, url } },
        linkedIn
      }`,
      { name }
    );
  } catch (error) {
    console.error(`Error fetching author ${name}:`, error);
    return null;
  }
}