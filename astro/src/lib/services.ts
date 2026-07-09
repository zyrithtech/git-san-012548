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
      { label: 'SEO', href: '/services/digital-marketing/search-engine-optimization-seo' },
      { label: 'Social Media Marketing', href: '/services/digital-marketing/social-media-marketing' },
      { label: 'PPC Advertising', href: '/services/digital-marketing/ppc-advertising' },
      { label: 'Email Marketing', href: '/services/digital-marketing/email-marketing' },
      { label: 'Content Marketing', href: '/services/digital-marketing/content-marketing' },
      { label: 'Analytics & Reporting', href: '/services/digital-marketing/analytics-and-performance-reporting' },
    ],
  },
  'web-development': {
    label: 'Web Development',
    href: '/services/web-development',
    children: [
      { label: 'Website Design & Development', href: '/services/web-development/website-design-and-development' },
      { label: 'E-commerce Solutions', href: '/services/web-development/e-commerce-solutions' },
      { label: 'Website Hosting & Maintenance', href: '/services/web-development/website-hosting-and-maintenance' },
    ],
  },
  'creative-branding': {
    label: 'Creative & Branding',
    href: '/services/creative-branding',
    children: [
      { label: 'Graphic & Visual Design', href: '/services/creative-branding/graphic-visual-design' },
      { label: 'Logo & Brand Identity', href: '/services/creative-branding/logo-and-brand-identity' },
    ],
  },
};

export const pillars = Object.values(serviceTaxonomy);
