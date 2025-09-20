import OpenAI from 'openai';
import getEnvConfig from '../../config/env.js';

const env = getEnvConfig();

export interface AIInsightRequest {
  type: 'keyword_analysis' | 'competitor_analysis' | 'content_strategy' | 'serp_analysis' | 'trend_analysis';
  data: any;
  context?: {
    industry?: string;
    targetAudience?: string;
    businessGoals?: string[];
    competitorDomains?: string[];
  };
  options?: {
    tone?: 'professional' | 'casual' | 'technical';
    length?: 'brief' | 'detailed' | 'comprehensive';
    focus?: string[];
  };
}

export interface AIInsightResponse {
  summary: string;
  insights: string[];
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'quick' | 'moderate' | 'significant';
    impact: 'high' | 'medium' | 'low';
  }>;
  keyMetrics?: Array<{
    metric: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    context: string;
  }>;
  nextSteps?: string[];
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || env.OPENAI_API_KEY,
    });
  }

  async generateInsights(request: AIInsightRequest): Promise<AIInsightResponse> {
    try {
      const prompt = this.buildPrompt(request);

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.type),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response) as AIInsightResponse;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to generate AI insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSystemPrompt(type: AIInsightRequest['type']): string {
    const basePrompt = `You are an expert SEO analyst and digital marketing strategist. Your role is to analyze data and provide actionable insights in a clear, professional manner.

Always respond with valid JSON in this exact format:
{
  "summary": "Brief overview of the analysis",
  "insights": ["Key insight 1", "Key insight 2", ...],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "priority": "high|medium|low",
      "effort": "quick|moderate|significant",
      "impact": "high|medium|low"
    }
  ],
  "keyMetrics": [
    {
      "metric": "Metric name",
      "value": "Value with units",
      "trend": "up|down|stable",
      "context": "What this metric means"
    }
  ],
  "nextSteps": ["Action item 1", "Action item 2", ...]
}`;

    const specificPrompts = {
      keyword_analysis: `${basePrompt}

Focus on keyword opportunities, search volume trends, competition analysis, and content gap identification. Consider search intent, seasonality, and keyword difficulty.`,

      competitor_analysis: `${basePrompt}

Analyze competitor strategies, market positioning, content gaps, and opportunities to outrank competitors. Focus on actionable competitive intelligence.`,

      content_strategy: `${basePrompt}

Provide content recommendations based on keyword data, user intent, and competitive landscape. Focus on content types, topics, and optimization strategies.`,

      serp_analysis: `${basePrompt}

Analyze SERP features, ranking factors, and opportunities to improve visibility. Focus on featured snippets, local results, and SERP feature optimization.`,

      trend_analysis: `${basePrompt}

Identify patterns, seasonal trends, and emerging opportunities. Focus on timing, market changes, and predictive insights for strategic planning.`,
    };

    return specificPrompts[type] || basePrompt;
  }

  private buildPrompt(request: AIInsightRequest): string {
    const { type, data, context, options } = request;

    let prompt = `Please analyze the following ${type.replace('_', ' ')} data:\n\n`;
    prompt += `Data: ${JSON.stringify(data, null, 2)}\n\n`;

    if (context) {
      prompt += `Context:\n`;
      if (context.industry) prompt += `- Industry: ${context.industry}\n`;
      if (context.targetAudience) prompt += `- Target Audience: ${context.targetAudience}\n`;
      if (context.businessGoals) prompt += `- Business Goals: ${context.businessGoals.join(', ')}\n`;
      if (context.competitorDomains) prompt += `- Key Competitors: ${context.competitorDomains.join(', ')}\n`;
      prompt += '\n';
    }

    if (options) {
      prompt += `Analysis preferences:\n`;
      if (options.tone) prompt += `- Tone: ${options.tone}\n`;
      if (options.length) prompt += `- Detail level: ${options.length}\n`;
      if (options.focus) prompt += `- Focus areas: ${options.focus.join(', ')}\n`;
      prompt += '\n';
    }

    // Add specific instructions based on analysis type
    switch (type) {
      case 'keyword_analysis':
        prompt += `Please focus on:
- Keyword difficulty and competition levels
- Search volume trends and seasonality
- User intent analysis
- Content gap opportunities
- Quick win opportunities (low competition, decent volume)
- Long-tail keyword potential`;
        break;

      case 'competitor_analysis':
        prompt += `Please focus on:
- Competitor strengths and weaknesses
- Market share analysis
- Content strategy gaps
- Keyword opportunities they're missing
- Backlink and authority analysis
- Positioning opportunities`;
        break;

      case 'content_strategy':
        prompt += `Please focus on:
- Content format recommendations
- Topic clusters and pillar pages
- User intent matching
- Content calendar suggestions
- Optimization opportunities
- Distribution strategies`;
        break;

      case 'serp_analysis':
        prompt += `Please focus on:
- SERP feature opportunities
- Ranking factor analysis
- Local SEO opportunities
- Featured snippet potential
- Technical SEO issues
- Mobile vs desktop differences`;
        break;

      case 'trend_analysis':
        prompt += `Please focus on:
- Seasonal patterns and timing
- Emerging keywords and topics
- Market shifts and opportunities
- Competitive landscape changes
- Predictive insights
- Strategic timing recommendations`;
        break;
    }

    return prompt;
  }

  // Generate content briefs based on keyword and SERP data
  async generateContentBrief(
    keyword: string,
    serpData: any,
    keywordData: any,
    options: {
      wordCount?: number;
      contentType?: 'blog' | 'landing' | 'product' | 'guide';
      targetAudience?: string;
    } = {}
  ): Promise<{
    title: string;
    outline: Array<{ heading: string; subpoints: string[] }>;
    wordCount: number;
    primaryKeywords: string[];
    semanticKeywords: string[];
    contentAngle: string;
    userIntent: string;
    competitiveAdvantage: string;
  }> {
    const prompt = `Create a comprehensive content brief for the keyword "${keyword}" based on the following data:

SERP Analysis: ${JSON.stringify(serpData, null, 2)}
Keyword Data: ${JSON.stringify(keywordData, null, 2)}

Target word count: ${options.wordCount || 1500}
Content type: ${options.contentType || 'blog'}
Target audience: ${options.targetAudience || 'general'}

Please provide a detailed content brief with:
1. Compelling title
2. Detailed outline with headings and subpoints
3. Primary and semantic keywords to target
4. Content angle and unique value proposition
5. User intent analysis
6. How to outrank current competitors

Respond in JSON format with the structure I specified.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist and SEO specialist. Create comprehensive, actionable content briefs that help content creators produce high-ranking, valuable content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Content brief generation error:', error);
      throw error;
    }
  }

  // Generate technical SEO recommendations
  async generateTechnicalRecommendations(
    siteData: any,
    performanceData: any
  ): Promise<{
    criticalIssues: Array<{ issue: string; impact: string; solution: string }>;
    optimizations: Array<{ area: string; recommendation: string; impact: 'high' | 'medium' | 'low' }>;
    technicalScore: number;
    priorityActions: string[];
  }> {
    const prompt = `Analyze the following technical SEO data and provide recommendations:

Site Data: ${JSON.stringify(siteData, null, 2)}
Performance Data: ${JSON.stringify(performanceData, null, 2)}

Please identify critical issues, optimization opportunities, and provide a technical SEO score (0-100) with priority actions.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a technical SEO expert. Analyze website data and provide actionable technical SEO recommendations with clear priorities and impact assessments.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Technical recommendations error:', error);
      throw error;
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test. Please respond with "Connection successful".',
          },
        ],
        max_tokens: 10,
      });

      return response.choices[0]?.message?.content?.includes('successful') || false;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}