import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    // note = 기술 노트, devlog = 개발 일지
    kind: z.enum(['note', 'devlog']),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    series: z.object({ id: z.string(), order: z.number() }).optional(),
    // 이 글의 작업에 쓴 AI 모델. 쓰지 않았으면 생략한다.
    ai: z
      .object({
        design: z.string().optional(), // 설계에 쓴 모델
        dev: z.string().optional(), // 개발(구현)에 쓴 모델
        note: z.string().optional(),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
