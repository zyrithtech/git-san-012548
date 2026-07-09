// src/lib/services.ts
// Single source of truth for the service taxonomy (pillars -> child services).
// Used by RelatedServices.astro for internal linking, and safe to reuse in
// nav/footer/sitemap logic later.

export interface ServiceLink {
  label: string;
  href: string;
}

export interface Pillar {
  label: string;
  href: string;
  children: ServiceLink[];
}

export const serviceTaxonomy: Record<string, Pillar> = {
  'digital-marketing': {
    label: 'Digital Marketing',
    href: '/services/digital-marketing',
    children: [
      { label: 'SEO', href: '/services/search-engine-optimization-seo' },
      { label: 'Social Media Marketing', href: '/services/social-media-marketing' },
      { label: 'PPC Advertising', href: '/services/ppc-advertising' },
      { label: 'Email Marketing', href: '/services/email-marketing' },
      { label: 'Content Marketing', href: '/services/content-marketing' },
      { label: 'Analytics & Reporting', href: '/services/analytics-and-performance-reporting' },
    ],
  },
  'web-development': {
    label: 'Web Development',
    href: '/services/web-development',
    children: [
      { label: 'Website Design & Development', href: '/services/web-design-development' },
      { label: 'E-commerce Solutions', href: '/services/ecommerce-solutions' },
      { label: 'Website Hosting & Maintenance', href: '/services/website-maintenance' },
    ],
  },
  'creative-branding': {
    label: 'Creative & Branding',
    href: '/services/creative-branding',
    children: [
      { label: 'Graphic & Visual Design', href: '/services/graphic-visual-design' },
      { label: 'Logo & Brand Identity', href: '/services/logo-and-brand-identity' },
    ],
  },
};

export const pillars = Object.values(serviceTaxonomy);
