import { defineField, defineType } from 'sanity'

export const personType = defineType({
  name: 'person',
  title: 'Author / Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'e.g., "SEO Specialist", "Lead Designer", "Founder"',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      validation: (rule) => rule.required().max(500),
      description: 'Short biography (max 500 chars)',
    }),
    defineField({
      name: 'photo',
      title: 'Profile Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
      description: 'Square image works best (400x400px minimum)',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'linkedIn',
      title: 'LinkedIn URL',
      type: 'url',
      description: 'Full LinkedIn profile URL',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter/X URL',
      type: 'url',
      description: 'Full Twitter profile URL',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
      description: 'Full Instagram profile URL',
    }),
    defineField({
      name: 'website',
      title: 'Personal Website',
      type: 'url',
    }),
    defineField({
      name: 'expertise',
      title: 'Areas of Expertise',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'SEO',
          'Social Media',
          'Content Marketing',
          'PPC',
          'Email Marketing',
          'Web Design',
          'Web Development',
          'E-commerce',
          'Brand Strategy',
          'Graphic Design',
          'UX/UI',
          'Analytics',
        ],
      },
      description: 'Select relevant expertise areas',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Team Member',
      type: 'boolean',
      initialValue: false,
      description: 'Show on team page or about section',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
    },
  },
})
