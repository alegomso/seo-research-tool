import { z } from 'zod';

export const queryTypeSchema = z.enum([
  'keyword_discovery',
  'serp_snapshot',
  'competitor_overview',
  'backlink_check',
  'onpage_check'
]);

export const queryStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed'
]);

export const querySchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  type: queryTypeSchema,
  payload_json: z.record(z.any()),
  status: queryStatusSchema,
  created_by: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createQuerySchema = z.object({
  project_id: z.string().uuid(),
  type: queryTypeSchema,
  payload_json: z.record(z.any()),
});

export const taskStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed'
]);

export const taskSchema = z.object({
  id: z.string().uuid(),
  query_id: z.string().uuid().optional(),
  provider: z.enum(['dataforseo', 'openai']),
  provider_task_id: z.string(),
  status: taskStatusSchema,
  cost_estimate: z.number().min(0),
  result_json: z.record(z.any()).optional(),
  error_message: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type QueryType = z.infer<typeof queryTypeSchema>;
export type QueryStatus = z.infer<typeof queryStatusSchema>;
export type Query = z.infer<typeof querySchema>;
export type CreateQuery = z.infer<typeof createQuerySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;