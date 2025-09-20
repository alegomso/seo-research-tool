import { z } from 'zod';

// SERP Schemas
export const serpTaskSchema = z.object({
  keyword: z.string().min(1),
  location_name: z.string().default('United States'),
  language_name: z.string().default('English'),
  device: z.enum(['desktop', 'mobile']).default('desktop'),
  os: z.string().optional(),
});

export const serpItemSchema = z.object({
  type: z.string(),
  rank_group: z.number(),
  rank_absolute: z.number(),
  position: z.string(),
  xpath: z.string(),
  domain: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string(),
  is_image: z.boolean(),
  is_video: z.boolean(),
  timestamp: z.string().optional(),
});

export const serpResultSchema = z.object({
  keyword: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  check_url: z.string(),
  datetime: z.string(),
  se_results_count: z.string(),
  items: z.array(serpItemSchema),
});

// Keywords Schemas
export const keywordTaskSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(1000),
  location_name: z.string().default('United States'),
  language_name: z.string().default('English'),
});

export const keywordResultSchema = z.object({
  keyword: z.string(),
  location_code: z.number(),
  language_code: z.string(),
  search_volume: z.number().nullable(),
  cpc: z.number().nullable(),
  competition: z.number().nullable(),
  competition_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
  monthly_searches: z.array(z.object({
    year: z.number(),
    month: z.number(),
    search_volume: z.number(),
  })).optional(),
});

// Backlinks Schemas
export const backlinkTaskSchema = z.object({
  target: z.string().min(1),
  mode: z.enum(['domain', 'subdomain', 'page']).default('domain'),
});

export const backlinkResultSchema = z.object({
  target: z.string(),
  total_count: z.number(),
  live_count: z.number(),
  broken_count: z.number(),
  referring_domains: z.number(),
  referring_main_domains: z.number(),
  referring_pages: z.number(),
  dofollow_count: z.number(),
  nofollow_count: z.number(),
});

// DataForSEO API Response Schemas
export const dataForSEOTaskSchema = z.object({
  id: z.string(),
  status_code: z.number(),
  status_message: z.string(),
  time: z.string(),
  cost: z.number(),
  result_count: z.number(),
  path: z.array(z.string()),
  data: z.object({
    api: z.string(),
    function: z.string(),
    se: z.string(),
    se_type: z.string(),
    language_code: z.string(),
    location_code: z.number(),
    keyword: z.string(),
  }),
  result: z.array(z.any()),
});

export const dataForSEOResponseSchema = z.object({
  version: z.string(),
  status_code: z.number(),
  status_message: z.string(),
  time: z.string(),
  cost: z.number(),
  tasks_count: z.number(),
  tasks_error: z.number(),
  tasks: z.array(dataForSEOTaskSchema),
});

export type SERPTask = z.infer<typeof serpTaskSchema>;
export type SERPItem = z.infer<typeof serpItemSchema>;
export type SERPResult = z.infer<typeof serpResultSchema>;
export type KeywordTask = z.infer<typeof keywordTaskSchema>;
export type KeywordResult = z.infer<typeof keywordResultSchema>;
export type BacklinkTask = z.infer<typeof backlinkTaskSchema>;
export type BacklinkResult = z.infer<typeof backlinkResultSchema>;