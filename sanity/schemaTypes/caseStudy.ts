import { defineField, defineType } from 'sanity'

export const caseStudyType = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (rule) => rule.required().min(3).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'industry',
      title: 'Industry',
      type: 'string',
      options: {
        list: [
          { title: 'Technology', value: 'Technology' },
          { title: 'E-commerce', value: 'E-commerce' },
          { title: 'SaaS', value: 'SaaS' },
          { title: 'Agency', value: 'Agency' },
          { title: 'Startup', value: 'Startup' },
          { title: 'Healthcare', value: 'Healthcare' },
          { title: 'Education', value: 'Education' },
          { title: 'Finance', value: 'Finance' },
          { title: 'Real Estate', value: 'Real Estate' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'services',
      title: 'Services Applied',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'SEO',
          'Social Media Marketing',
          'PPC Advertising',
          'Email Marketing',
          'Content Marketing',
          'Analytics & Reporting',
          'Website Design & Development',
          'E-commerce Solutions',
          'Website Hosting & Maintenance',
          'Graphic & Visual Design',
          'Logo & Brand Identity',
        ],
      },
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'text',
      validation: (rule) => rule.required(),
      description: 'Describe the client\'s challenge or goal',
    }),
    defineField({
      name: 'approach',
      title: 'Approach & Solution',
      type: 'text',
      validation: (rule) => rule.required(),
      description: 'Explain how you solved the problem',
    }),
    defineField({
      name: 'results',
      title: 'Results & Metrics',
      type: 'array',
      of: [
        defineField({
          type: 'object',
          fields: [
            defineField({
              name: 'metric',
              title: 'Metric Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'e.g., "150%" or "$50K" or "Page 1"',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (rule) => rule.required().max(60),
              description: 'Brief explanation of the result',
            }),
          ],
          preview: {
            select: {
              title: 'metric',
              subtitle: 'value',
            },
          },
        }),
      ],
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Project Gallery',
      type: 'array',
      of: [
        defineField({
          type: 'image',
          options: { hotspot: true },
        }),
      ],
      description: 'Additional images showing the project',
    }),
    defineField({
      name: 'testimonial',
      title: 'Client Testimonial',
      type: 'object',
      fields: [
        defineField({
          name: 'quote',
          title: 'Quote',
          type: 'text',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'name',
          title: 'Client Name',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'role',
          title: 'Client Role',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'company',
          title: 'Company',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
      description: 'Show this case study on the homepage',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          validation: (rule) => rule.max(160),
        }),
        defineField({
          name: 'ogImage',
          title: 'OG Image',
          type: 'image',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'client',
      media: 'featuredImage',
    },
    prepare(selection) {
      return {
        title: selection.title,
        subtitle: `Client: ${selection.subtitle}`,
        media: selection.media,
      }
    },
  },
})
