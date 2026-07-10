
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Import all schema types
import {caseStudyType} from './schemaTypes/caseStudy'
import {postType} from './schemaTypes/post'
import {categoryType} from './schemaTypes/category'
import {personType} from './schemaTypes/person'
import {faqType} from './schemaTypes/faq'
import {faqCategoryType} from './schemaTypes/faqCategory'


export default defineConfig({
  name: 'default',
  title: 'zyrith-website',

  projectId: 'umvfvgt9',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],
  
  schema: {
    types: [
      caseStudyType,
      postType,
      categoryType,
      personType,
      faqType,
      faqCategoryType,
    ],
  },
})
