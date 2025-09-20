import { DataForSEOClient, TaskPostResponse, TaskGetResponse } from './client.js';

export interface SerpTaskData {
  keyword: string;
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  os?: string;
}

export interface SerpResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell: any;
  refinement_chips: any;
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: SerpItem[];
}

export interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  breadcrumb?: string;
  website_name?: string;
  description?: string;
  highlighted?: string[];
  extra?: any;
  about_this_result?: any;
  related_search_url?: string;
  timestamp?: string;
}

export class SerpService {
  constructor(private client: DataForSEOClient) {}

  // Google Organic SERP
  async postGoogleOrganicTask(data: SerpTaskData[]): Promise<TaskPostResponse> {
    const endpoint = '/v3/serp/google/organic/task_post';

    // Transform data to DataForSEO format
    const taskData = data.map(task => ({
      keyword: task.keyword,
      location_name: task.location_name || 'United States',
      language_name: task.language_name || 'English',
      device: task.device || 'desktop',
      os: task.os || 'windows',
    }));

    return this.client.postTask(endpoint, taskData);
  }

  async getGoogleOrganicTasksReady(): Promise<TaskGetResponse> {
    const endpoint = '/v3/serp/google/organic/tasks_ready';
    return this.client.getTasksReady(endpoint);
  }

  async getGoogleOrganicTaskResult(taskId: string): Promise<TaskGetResponse> {
    const endpoint = `/v3/serp/google/organic/task_get/advanced/${taskId}`;
    return this.client.getTaskResult(taskId, endpoint);
  }

  // Google Maps SERP (for local intent queries)
  async postGoogleMapsTask(data: SerpTaskData[]): Promise<TaskPostResponse> {
    const endpoint = '/v3/business_data/google/maps/task_post';

    const taskData = data.map(task => ({
      keyword: task.keyword,
      location_name: task.location_name || 'United States',
      language_name: task.language_name || 'English',
      device: task.device || 'desktop',
    }));

    return this.client.postTask(endpoint, taskData);
  }

  async getGoogleMapsTasksReady(): Promise<TaskGetResponse> {
    const endpoint = '/v3/business_data/google/maps/tasks_ready';
    return this.client.getTasksReady(endpoint);
  }

  async getGoogleMapsTaskResult(taskId: string): Promise<TaskGetResponse> {
    const endpoint = `/v3/business_data/google/maps/task_get/advanced/${taskId}`;
    return this.client.getTaskResult(taskId, endpoint);
  }

  // Helper method to detect if a query has local intent
  detectLocalIntent(keyword: string): boolean {
    const localIndicators = [
      'near me',
      'nearby',
      'in',
      'restaurant',
      'hotel',
      'store',
      'shop',
      'clinic',
      'dentist',
      'lawyer',
      'plumber',
      'mechanic',
      'hours',
      'address',
      'phone number',
      'directions',
      'location',
      'local',
    ];

    const keywordLower = keyword.toLowerCase();
    return localIndicators.some(indicator => keywordLower.includes(indicator));
  }

  // Extract SERP features from results
  extractSerpFeatures(items: SerpItem[]): string[] {
    const features = new Set<string>();

    items.forEach(item => {
      if (item.type) {
        features.add(item.type);
      }
    });

    return Array.from(features);
  }

  // Analyze content types from SERP results
  analyzeContentTypes(items: SerpItem[]): { [key: string]: number } {
    const contentTypes: { [key: string]: number } = {};

    items.forEach(item => {
      if (item.type === 'organic') {
        // Simple content type detection based on title and description
        const text = `${item.title} ${item.description}`.toLowerCase();

        if (text.includes('video') || text.includes('youtube')) {
          contentTypes['video'] = (contentTypes['video'] || 0) + 1;
        } else if (text.includes('image') || text.includes('photo')) {
          contentTypes['image'] = (contentTypes['image'] || 0) + 1;
        } else if (text.includes('product') || text.includes('buy') || text.includes('shop')) {
          contentTypes['product'] = (contentTypes['product'] || 0) + 1;
        } else if (text.includes('how to') || text.includes('guide') || text.includes('tutorial')) {
          contentTypes['howto'] = (contentTypes['howto'] || 0) + 1;
        } else if (text.includes('list') || text.includes('best') || text.includes('top')) {
          contentTypes['list'] = (contentTypes['list'] || 0) + 1;
        } else {
          contentTypes['article'] = (contentTypes['article'] || 0) + 1;
        }
      }
    });

    return contentTypes;
  }

  // Calculate keyword difficulty based on SERP analysis
  calculateKeywordDifficulty(items: SerpItem[]): number {
    let difficulty = 0;
    let organicResults = items.filter(item => item.type === 'organic');

    if (organicResults.length === 0) return 0;

    // Factors that increase difficulty
    organicResults.forEach(item => {
      // Domain authority proxy (simplified)
      const domain = item.domain.toLowerCase();
      if (['wikipedia.org', 'youtube.com', 'amazon.com', 'reddit.com'].includes(domain)) {
        difficulty += 15;
      } else if (domain.includes('.gov') || domain.includes('.edu')) {
        difficulty += 10;
      }

      // URL depth (shorter URLs often indicate authority pages)
      const pathDepth = item.url.split('/').length - 3;
      if (pathDepth <= 1) {
        difficulty += 5;
      }
    });

    // Normalize to 0-100 scale
    difficulty = Math.min(100, difficulty);

    return Math.round(difficulty);
  }
}