// src/lib/slugify.ts
// Shared slug generator — used to build heading anchor ids for the blog
// table of contents and to give the matching h2 elements the same id.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
