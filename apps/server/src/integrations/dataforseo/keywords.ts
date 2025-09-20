import { DataForSEOClient, TaskPostResponse, TaskGetResponse } from './client.js';

export interface KeywordTaskData {
  keywords: string[];
  location_name?: string;
  location_code?: number;
  language_name?: string;
  language_code?: string;
}

export interface KeywordData {
  keyword: string;
  location_code: number;
  language_code: string;
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  categories: number[];
  monthly_searches: MonthlySearch[];
}

export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

export interface TrendsData {
  keyword: string;
  location_code: number;
  language_code: string;
  type: string;
  items: TrendsItem[];
}

export interface TrendsItem {
  position: number;
  type: string;
  title: string;
  keywords: string[];
  data: TrendsDataPoint[];
}

export interface TrendsDataPoint {
  date_from: string;
  date_to: string;
  timestamp: number;
  values: number[];
}

export class KeywordsService {
  constructor(private client: DataForSEOClient) {}

  // Google Ads Keywords Data
  async postGoogleAdsKeywordsTask(data: KeywordTaskData[]): Promise<TaskPostResponse> {
    const endpoint = '/v3/keywords_data/google_ads/search_volume/task_post';

    const taskData = data.map(task => ({
      keywords: task.keywords,
      location_name: task.location_name || 'United States',
      language_name: task.language_name || 'English',
    }));

    return this.client.postTask(endpoint, taskData);
  }

  async getGoogleAdsKeywordsTasksReady(): Promise<TaskGetResponse> {
    const endpoint = '/v3/keywords_data/google_ads/search_volume/tasks_ready';
    return this.client.getTasksReady(endpoint);
  }

  async getGoogleAdsKeywordsTaskResult(taskId: string): Promise<TaskGetResponse> {
    const endpoint = `/v3/keywords_data/google_ads/search_volume/task_get/${taskId}`;
    return this.client.getTaskResult(taskId, endpoint);
  }

  // Google Trends Keywords Data
  async postGoogleTrendsTask(data: KeywordTaskData[]): Promise<TaskPostResponse> {
    const endpoint = '/v3/keywords_data/google_trends/explore/task_post';

    const taskData = data.map(task => ({
      keywords: task.keywords,
      location_code: task.location_code || 2840, // United States
      language_code: task.language_code || 'en',
      date_from: '2019-01-01',
      date_to: new Date().toISOString().split('T')[0], // Today
    }));

    return this.client.postTask(endpoint, taskData);
  }

  async getGoogleTrendsTasksReady(): Promise<TaskGetResponse> {
    const endpoint = '/v3/keywords_data/google_trends/explore/tasks_ready';
    return this.client.getTasksReady(endpoint);
  }

  async getGoogleTrendsTaskResult(taskId: string): Promise<TaskGetResponse> {
    const endpoint = `/v3/keywords_data/google_trends/explore/task_get/advanced/${taskId}`;
    return this.client.getTaskResult(taskId, endpoint);
  }

  // Keyword Ideas (Google Keyword Planner alternative)
  async postKeywordIdeasTask(data: { seed_keywords: string[]; location_name?: string; language_name?: string }[]): Promise<TaskPostResponse> {
    const endpoint = '/v3/keywords_data/google_ads/keywords_for_keywords/task_post';

    const taskData = data.map(task => ({
      keywords: task.seed_keywords,
      location_name: task.location_name || 'United States',
      language_name: task.language_name || 'English',
      search_partners: false,
      date_from: '2024-01-01',
      date_to: '2024-12-31',
    }));

    return this.client.postTask(endpoint, taskData);
  }

  async getKeywordIdeasTasksReady(): Promise<TaskGetResponse> {
    const endpoint = '/v3/keywords_data/google_ads/keywords_for_keywords/tasks_ready';
    return this.client.getTasksReady(endpoint);
  }

  async getKeywordIdeasTaskResult(taskId: string): Promise<TaskGetResponse> {
    const endpoint = `/v3/keywords_data/google_ads/keywords_for_keywords/task_get/${taskId}`;
    return this.client.getTaskResult(taskId, endpoint);
  }

  // Analyze keyword metrics and provide insights
  analyzeKeywordMetrics(keywords: KeywordData[]): {
    avgSearchVolume: number;
    avgCpc: number;
    competitionDistribution: { [key: string]: number };
    topKeywords: KeywordData[];
    longTailKeywords: KeywordData[];
    lowCompetitionHighVolume: KeywordData[];
  } {
    if (keywords.length === 0) {
      return {
        avgSearchVolume: 0,
        avgCpc: 0,
        competitionDistribution: {},
        topKeywords: [],
        longTailKeywords: [],
        lowCompetitionHighVolume: [],
      };
    }

    // Calculate averages
    const avgSearchVolume = keywords.reduce((sum, k) => sum + k.search_volume, 0) / keywords.length;
    const avgCpc = keywords.reduce((sum, k) => sum + k.cpc, 0) / keywords.length;

    // Competition distribution
    const competitionDistribution: { [key: string]: number } = {};
    keywords.forEach(k => {
      competitionDistribution[k.competition_level] = (competitionDistribution[k.competition_level] || 0) + 1;
    });

    // Sort by search volume for top keywords
    const topKeywords = [...keywords]
      .sort((a, b) => b.search_volume - a.search_volume)
      .slice(0, 10);

    // Long tail keywords (3+ words, decent search volume)
    const longTailKeywords = keywords.filter(k =>
      k.keyword.split(' ').length >= 3 && k.search_volume >= 100
    );

    // Low competition, high volume opportunities
    const lowCompetitionHighVolume = keywords.filter(k =>
      (k.competition_level === 'LOW' || k.competition < 0.3) &&
      k.search_volume >= 1000
    );

    return {
      avgSearchVolume: Math.round(avgSearchVolume),
      avgCpc: Math.round(avgCpc * 100) / 100,
      competitionDistribution,
      topKeywords,
      longTailKeywords,
      lowCompetitionHighVolume,
    };
  }

  // Extract seasonal trends from monthly search data
  extractSeasonalTrends(keywords: KeywordData[]): {
    keyword: string;
    seasonality: 'high' | 'medium' | 'low';
    peakMonths: number[];
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  }[] {
    return keywords.map(keyword => {
      if (!keyword.monthly_searches || keyword.monthly_searches.length === 0) {
        return {
          keyword: keyword.keyword,
          seasonality: 'low' as const,
          peakMonths: [],
          trendDirection: 'stable' as const,
        };
      }

      const searches = keyword.monthly_searches;
      const volumes = searches.map(s => s.search_volume);
      const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      const maxVolume = Math.max(...volumes);
      const minVolume = Math.min(...volumes);

      // Calculate seasonality (coefficient of variation)
      const standardDev = Math.sqrt(volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length);
      const coefficientOfVariation = standardDev / avgVolume;

      let seasonality: 'high' | 'medium' | 'low' = 'low';
      if (coefficientOfVariation > 0.5) seasonality = 'high';
      else if (coefficientOfVariation > 0.25) seasonality = 'medium';

      // Find peak months (above 120% of average)
      const peakMonths = searches
        .filter(s => s.search_volume > avgVolume * 1.2)
        .map(s => s.month);

      // Determine trend direction (compare first 3 months vs last 3 months)
      const firstHalf = searches.slice(0, 3).reduce((sum, s) => sum + s.search_volume, 0) / 3;
      const secondHalf = searches.slice(-3).reduce((sum, s) => sum + s.search_volume, 0) / 3;

      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const changePercent = (secondHalf - firstHalf) / firstHalf;
      if (changePercent > 0.1) trendDirection = 'increasing';
      else if (changePercent < -0.1) trendDirection = 'decreasing';

      return {
        keyword: keyword.keyword,
        seasonality,
        peakMonths,
        trendDirection,
      };
    });
  }
}