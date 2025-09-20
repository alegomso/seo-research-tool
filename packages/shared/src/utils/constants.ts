// User Roles and Permissions
export const USER_ROLES = {
  MARKETER: 'marketer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
} as const;

export const USER_PERMISSIONS = {
  [USER_ROLES.MARKETER]: [
    'read:projects',
    'read:queries',
    'create:queries',
    'read:datasets',
    'create:briefs',
    'read:briefs',
  ],
  [USER_ROLES.ANALYST]: [
    'read:projects',
    'create:projects',
    'read:queries',
    'create:queries',
    'read:datasets',
    'export:datasets',
    'create:briefs',
    'read:briefs',
    'update:briefs',
    'manage:prompts',
  ],
  [USER_ROLES.ADMIN]: [
    'manage:users',
    'manage:projects',
    'manage:queries',
    'manage:datasets',
    'manage:briefs',
    'manage:budgets',
    'manage:settings',
    'view:analytics',
  ],
} as const;

// Query Types and Limits
export const QUERY_TYPES = {
  KEYWORD_DISCOVERY: 'keyword_discovery',
  SERP_SNAPSHOT: 'serp_snapshot',
  COMPETITOR_OVERVIEW: 'competitor_overview',
  BACKLINK_CHECK: 'backlink_check',
  ONPAGE_CHECK: 'onpage_check',
} as const;

export const QUERY_LIMITS = {
  [QUERY_TYPES.KEYWORD_DISCOVERY]: {
    max_keywords: 1000,
    max_concurrent: 5,
  },
  [QUERY_TYPES.SERP_SNAPSHOT]: {
    max_keywords: 100,
    max_concurrent: 10,
  },
  [QUERY_TYPES.COMPETITOR_OVERVIEW]: {
    max_domains: 50,
    max_concurrent: 3,
  },
  [QUERY_TYPES.BACKLINK_CHECK]: {
    max_domains: 20,
    max_concurrent: 5,
  },
  [QUERY_TYPES.ONPAGE_CHECK]: {
    max_urls: 100,
    max_concurrent: 5,
  },
} as const;

// DataForSEO Configuration
export const DATAFORSEO_ENDPOINTS = {
  SERP_ORGANIC: '/v3/serp/google/organic/task_post',
  SERP_MAPS: '/v3/business_data/google/maps/task_post',
  KEYWORDS_VOLUME: '/v3/keywords_data/google_ads/search_volume/task_post',
  KEYWORDS_TRENDS: '/v3/keywords_data/google_trends/task_post',
  LABS_SUGGESTIONS: '/v3/dataforseo_labs/keyword_suggestions/task_post',
  LABS_COMPETITORS: '/v3/dataforseo_labs/serp_competitors/task_post',
  BACKLINKS_SUMMARY: '/v3/backlinks/summary/live',
  BACKLINKS_DOMAINS: '/v3/backlinks/referring_domains/live',
  ONPAGE_INSTANT: '/v3/on_page/instant_pages',
} as const;

export const DATAFORSEO_LOCATIONS = {
  'United States': 2840,
  'United Kingdom': 2826,
  'Canada': 2124,
  'Australia': 2036,
  'Germany': 2276,
  'France': 2250,
  'Spain': 2724,
  'Italy': 2380,
  'Netherlands': 2528,
  'Brazil': 2076,
} as const;

export const DATAFORSEO_LANGUAGES = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Dutch': 'nl',
} as const;

// Budget and Cost Configuration
export const BUDGET_LIMITS = {
  [USER_ROLES.MARKETER]: {
    monthly: 100, // USD
    per_query: 10, // USD
  },
  [USER_ROLES.ANALYST]: {
    monthly: 500, // USD
    per_query: 50, // USD
  },
  [USER_ROLES.ADMIN]: {
    monthly: 2000, // USD
    per_query: 200, // USD
  },
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SERP_RESULTS: 3600, // 1 hour
  KEYWORD_DATA: 86400, // 24 hours
  BACKLINK_DATA: 86400, // 24 hours
  USER_SESSION: 3600, // 1 hour
  API_RESPONSE: 300, // 5 minutes
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_REQUESTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  DATAFORSEO_REQUESTS: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // requests per minute
  },
  OPENAI_REQUESTS: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // requests per minute
  },
} as const;

// AI Prompt Templates
export const AI_PROMPTS = {
  KEYWORD_OPPORTUNITY: 'keyword-opportunities',
  SERP_INTENT_MAP: 'serp-intent-map',
  BRIEF_WRITER: 'brief-writer',
} as const;

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  GOOGLE_SHEETS: 'google_sheets',
  NOTION: 'notion',
  MARKDOWN: 'markdown',
} as const;