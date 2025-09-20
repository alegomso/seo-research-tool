export type QueryType = 'keyword_discovery' | 'serp_snapshot' | 'competitor_overview' | 'backlink_check' | 'onpage_check';
export type QueryStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Query {
  id: string;
  project_id: string;
  type: QueryType;
  payload_json: Record<string, any>;
  status: QueryStatus;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  query_id?: string;
  provider: 'dataforseo' | 'openai';
  provider_task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cost_estimate: number;
  result_json?: Record<string, any>;
  error_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  kind: 'keywords' | 'serp' | 'competitors' | 'backlinks' | 'onpage';
  meta_json: Record<string, any>;
  source_query_id?: string;
  createdAt: Date;
  updatedAt: Date;
}