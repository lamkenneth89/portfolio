import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Also the order the index renders in. */
export const CATEGORIES = [
  'Business Intelligence',
  'Data Science',
  'CRM',
  'Engineering & AI',
  'Market Research',
] as const;

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(CATEGORIES),
    summary: z.string(),
    /** Shown in the dossier column of a case study. */
    role: z.string().optional(),
    period: z.string().optional(),
    stack: z.array(z.string()).default([]),
    metrics: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .default([]),
    /** A demo the visitor can operate. `iframe` embeds it in the case study. */
    demo: z
      .object({
        type: z.enum(['iframe', 'link', 'video', 'image']),
        url: z.string(),
        label: z.string().optional(),
        /** Shown instead of the iframe on small screens. */
        fallbackImage: z.string().optional(),
      })
      .optional(),
    repo: z.url().optional(),
    /**
     * Set on anything that spends Kenneth's API credit, holds his credentials,
     * or lives in a private repo. The case study then shows this note instead
     * of any way in — a public link to a metered endpoint is an invitation to
     * run up the bill. Such an entry must not also carry a `demo` or `repo`.
     */
    restricted: z.string().optional(),
    /** Where an index row points when there is no case study page yet. */
    external: z.string().optional(),
    thumb: z.string().optional(),
    /** Employer work rebuilt on synthetic data — drives the disclosure banner. */
    confidential: z.boolean().default(false),
    featured: z.boolean().default(false),
    /** Position within the featured block. `order` governs the index only. */
    featuredRank: z.number().default(99),
    /** Only entries with a written case study get their own page. */
    hasCaseStudy: z.boolean().default(false),
    order: z.number().default(50),
  }),
});

export const collections = { projects };
