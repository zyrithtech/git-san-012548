import { defineField, defineType } from 'sanity'

// One faqCategory per page that renders an FAQ accordion. The slug is the CMS
// filter the Astro page queries by, so it must match the value passed to
// getFaqSection() in that page's frontmatter (see astro/src/lib/queries.ts).
export const faqCategoryType = defineType({
  name: 'faqCategory',
  title: 'FAQ Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Category Name',
      type: 'string',
      description: 'Internal label, e.g. "Web Development" or "Homepage".',
      validation: (rule) => rule.required().min(2).max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      description:
        'The filter key the page fetches by. Changing this silently empties the ' +
        'FAQ section on the page that queries the old value — update both together.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sectionTitle',
      title: 'Section Heading',
      type: 'string',
      description:
        'Heading rendered above the accordion, e.g. "Questions Before You Book a Call". ' +
        'Leave empty to render the accordion with no heading (the homepage does this).',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Internal note about which page this category feeds. Not rendered.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort order in the Studio list. Does not affect the site.',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
    },
  },
})
