// DataForSEO API Types

export interface DataForSEOTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: {
    api: string;
    function: string;
    se: string;
    se_type: string;
    language_code: string;
    location_code: number;
    keyword: string;
  };
  result: any[];
}

export interface DataForSEOResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSEOTask[];
}

// SERP Types
export interface SERPTask {
  keyword: string;
  location_name: string;
  language_name: string;
  device: 'desktop' | 'mobile';
  os?: string;
}

export interface SERPResult {
  keyword: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  se_results_count: string;
  items: SERPItem[];
}

export interface SERPItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  description: string;
  is_image: boolean;
  is_video: boolean;
  timestamp?: string;
}

// Keywords Types
export interface KeywordTask {
  keywords: string[];
  location_name: string;
  language_name: string;
}

export interface KeywordResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

// Backlinks Types
export interface BacklinkTask {
  target: string;
  mode: 'domain' | 'subdomain' | 'page';
}

export interface BacklinkResult {
  target: string;
  total_count: number;
  live_count: number;
  broken_count: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_pages: number;
  dofollow_count: number;
  nofollow_count: number;
}