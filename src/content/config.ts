import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string().default('Equipo BrandMeister Venezuela'),
    authorCallsign: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().default('General'),
    readTime: z.string().default('4 min de lectura'),
    featured: z.boolean().default(false)
  })
});

export const collections = {
  blog: blogCollection
};
