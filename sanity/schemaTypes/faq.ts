import { defineField, defineType } from 'sanity'

// A single question/answer pair, rendered by astro/src/components/FAQAccordion.astro
// into both visible HTML and a schema.org FAQPage JSON-LD block. `answer` is
// deliberately plain text rather than Portable Text: the same string is emitted
// verbatim into the JSON-LD `acceptedAnswer.text`, and keeping it plain
// guarantees the rendered copy and the structured data can never drift apart.
export const faqType = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required().min(5).max(300),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 5,
      description:
        'Plain text. Appears on the page and inside the FAQPage structured data ' +
        'that Google and AI answer engines read, so write a complete, self-contained answer.',
      validation: (rule) => rule.required().min(20),
    }),
    defineField({
      name: 'category',
      title: 'FAQ Category',
      type: 'reference',
      to: [{ type: 'faqCategory' }],
      description: 'Which page this question appears on.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the category.',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Category, then Display Order',
      name: 'categoryDisplayOrderAsc',
      by: [
        { field: 'category.title', direction: 'asc' },
        { field: 'displayOrder', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'question',
      category: 'category.title',
      displayOrder: 'displayOrder',
    },
    prepare({ title, category, displayOrder }) {
      return {
        title,
        subtitle: [category, displayOrder != null ? `#${displayOrder}` : null]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
