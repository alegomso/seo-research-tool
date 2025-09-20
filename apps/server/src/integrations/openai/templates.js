"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateEngine = exports.PROMPT_TEMPLATES = void 0;
exports.PROMPT_TEMPLATES = [
    {
        id: 'keyword_opportunity_analysis',
        name: 'Keyword Opportunity Analysis',
        description: 'Identifies high-potential keyword opportunities based on search volume, competition, and trends',
        category: 'keyword',
        prompt: `Analyze the following keyword data and identify the best opportunities:

Keywords Data: {{keywordData}}
Current Rankings: {{currentRankings}}
Competitor Keywords: {{competitorKeywords}}

Context:
- Industry: {{industry}}
- Target Audience: {{targetAudience}}
- Business Goals: {{businessGoals}}

Please provide:
1. Top 10 quick win opportunities (high volume, low competition, achievable rankings)
2. Long-tail keyword strategies
3. Seasonal opportunities
4. Content gaps to fill
5. Keyword clustering recommendations

Focus on actionable insights that can drive traffic and conversions within 3-6 months.`,
        variables: ['keywordData', 'currentRankings', 'competitorKeywords', 'industry', 'targetAudience', 'businessGoals'],
        outputFormat: 'json'
    },
    {
        id: 'competitor_gap_analysis',
        name: 'Competitor Gap Analysis',
        description: 'Identifies content and keyword gaps compared to top competitors',
        category: 'competitor',
        prompt: `Perform a comprehensive competitor gap analysis:

Your Data: {{yourData}}
Competitor Data: {{competitorData}}
Market Context: {{marketContext}}

Analyze:
1. Keywords competitors rank for that you don't
2. Content topics they dominate
3. SERP features they capture
4. Backlink opportunities they have
5. Technical advantages they possess

Provide specific recommendations for:
- Content topics to create
- Keywords to target
- SERP features to optimize for
- Link building opportunities
- Technical improvements needed

Prioritize recommendations by potential impact and implementation effort.`,
        variables: ['yourData', 'competitorData', 'marketContext'],
        outputFormat: 'json'
    },
    {
        id: 'content_strategy_plan',
        name: 'Content Strategy Plan',
        description: 'Creates a comprehensive content strategy based on keyword research and user intent',
        category: 'content',
        prompt: `Create a detailed content strategy plan:

Keyword Research: {{keywordResearch}}
SERP Analysis: {{serpAnalysis}}
User Intent Data: {{userIntentData}}
Current Content Audit: {{contentAudit}}

Business Context:
- Industry: {{industry}}
- Target Personas: {{targetPersonas}}
- Content Resources: {{contentResources}}
- Timeline: {{timeline}}

Develop:
1. Content pillar topics and supporting clusters
2. Content calendar with publishing schedule
3. Content formats for each stage of the funnel
4. Optimization strategies for existing content
5. Distribution and promotion plan

Include specific keyword targets, expected traffic impact, and resource requirements.`,
        variables: ['keywordResearch', 'serpAnalysis', 'userIntentData', 'contentAudit', 'industry', 'targetPersonas', 'contentResources', 'timeline'],
        outputFormat: 'json'
    },
    {
        id: 'serp_feature_optimization',
        name: 'SERP Feature Optimization',
        description: 'Analyzes SERP features and provides optimization strategies',
        category: 'technical',
        prompt: `Analyze SERP features and optimization opportunities:

SERP Data: {{serpData}}
Current Page Performance: {{pagePerformance}}
Featured Snippet Opportunities: {{snippetOpportunities}}

Target Keywords: {{targetKeywords}}

For each SERP feature present, analyze:
1. Featured Snippets - content structure needed
2. People Also Ask - related questions to answer
3. Local Pack - local SEO opportunities
4. Image Pack - image optimization strategies
5. Video Results - video content opportunities
6. Knowledge Panel - structured data needs

Provide specific implementation steps:
- HTML structure recommendations
- Content formatting guidelines
- Schema markup requirements
- Technical optimizations needed

Prioritize by likelihood of success and traffic impact.`,
        variables: ['serpData', 'pagePerformance', 'snippetOpportunities', 'targetKeywords'],
        outputFormat: 'json'
    },
    {
        id: 'technical_seo_audit',
        name: 'Technical SEO Audit',
        description: 'Comprehensive technical SEO analysis and recommendations',
        category: 'technical',
        prompt: `Perform a technical SEO audit and provide recommendations:

Site Performance Data: {{performanceData}}
Crawl Data: {{crawlData}}
Core Web Vitals: {{coreWebVitals}}
Mobile Usability: {{mobileUsability}}
Indexing Status: {{indexingStatus}}

Analyze and prioritize issues in:
1. Site Speed and Core Web Vitals
2. Mobile-friendliness and responsive design
3. Crawlability and indexing
4. URL structure and redirects
5. Internal linking architecture
6. Structured data implementation
7. XML sitemaps and robots.txt
8. Security and HTTPS implementation

For each issue, provide:
- Impact assessment (Critical, High, Medium, Low)
- Implementation difficulty
- Expected improvement timeline
- Specific action steps
- Tools/resources needed

Focus on issues that will have the biggest impact on search performance.`,
        variables: ['performanceData', 'crawlData', 'coreWebVitals', 'mobileUsability', 'indexingStatus'],
        outputFormat: 'json'
    },
    {
        id: 'seasonal_trend_analysis',
        name: 'Seasonal Trend Analysis',
        description: 'Identifies seasonal patterns and timing opportunities',
        category: 'strategy',
        prompt: `Analyze seasonal trends and create a timing strategy:

Trend Data: {{trendData}}
Historical Performance: {{historicalData}}
Industry Patterns: {{industryPatterns}}

Business Info:
- Industry: {{industry}}
- Product/Service Seasonality: {{seasonality}}
- Marketing Calendar: {{marketingCalendar}}

Identify:
1. Seasonal keyword opportunities
2. Content planning timeline
3. Peak traffic periods
4. Off-season optimization strategies
5. Holiday and event opportunities

Create a 12-month calendar with:
- Key dates for content creation
- Keyword focus periods
- Campaign timing recommendations
- Preparation milestones
- Resource allocation suggestions

Include specific months, traffic projections, and competitive timing analysis.`,
        variables: ['trendData', 'historicalData', 'industryPatterns', 'industry', 'seasonality', 'marketingCalendar'],
        outputFormat: 'json'
    },
    {
        id: 'local_seo_strategy',
        name: 'Local SEO Strategy',
        description: 'Comprehensive local SEO analysis and recommendations',
        category: 'strategy',
        prompt: `Develop a local SEO strategy:

Local Search Data: {{localSearchData}}
Google My Business Performance: {{gmbData}}
Local Competitor Analysis: {{localCompetitors}}
Citation Data: {{citationData}}

Business Details:
- Business Type: {{businessType}}
- Service Area: {{serviceArea}}
- Locations: {{locations}}
- Target Local Keywords: {{localKeywords}}

Analyze and recommend:
1. Local keyword optimization opportunities
2. Google My Business optimization
3. Local content strategies
4. Citation building priorities
5. Review management approach
6. Local link building tactics
7. Location page optimization

Include:
- Specific local keywords to target
- GMB optimization checklist
- Citation audit and cleanup plan
- Local content calendar
- Review generation strategy
- NAP consistency audit results

Prioritize by impact on local search visibility and lead generation.`,
        variables: ['localSearchData', 'gmbData', 'localCompetitors', 'citationData', 'businessType', 'serviceArea', 'locations', 'localKeywords'],
        outputFormat: 'json'
    },
    {
        id: 'conversion_optimization_audit',
        name: 'Conversion Optimization Audit',
        description: 'Analyzes organic traffic conversion potential and provides optimization recommendations',
        category: 'strategy',
        prompt: `Analyze conversion optimization opportunities for organic traffic:

Traffic Data: {{trafficData}}
Conversion Data: {{conversionData}}
User Behavior Data: {{behaviorData}}
Landing Page Performance: {{landingPageData}}

Business Context:
- Conversion Goals: {{conversionGoals}}
- Target Audience: {{targetAudience}}
- Value Proposition: {{valueProposition}}

Analyze:
1. High-traffic, low-conversion pages
2. User intent vs. page content alignment
3. Conversion funnel gaps
4. Technical barriers to conversion
5. Content optimization opportunities

Provide recommendations for:
- Landing page optimization
- Content alignment with search intent
- Call-to-action improvements
- User experience enhancements
- A/B testing opportunities

Include expected conversion lift and implementation priorities.`,
        variables: ['trafficData', 'conversionData', 'behaviorData', 'landingPageData', 'conversionGoals', 'targetAudience', 'valueProposition'],
        outputFormat: 'json'
    }
];
class PromptTemplateEngine {
    static getTemplate(id) {
        return exports.PROMPT_TEMPLATES.find(template => template.id === id);
    }
    static getTemplatesByCategory(category) {
        return exports.PROMPT_TEMPLATES.filter(template => template.category === category);
    }
    static renderPrompt(templateId, variables) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with id "${templateId}" not found`);
        }
        let renderedPrompt = template.prompt;
        // Replace variables in the format {{variableName}}
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            renderedPrompt = renderedPrompt.replace(new RegExp(placeholder, 'g'), replacement);
        }
        // Check for any unreplaced variables
        const unreplacedMatches = renderedPrompt.match(/\{\{[^}]+\}\}/g);
        if (unreplacedMatches) {
            console.warn(`Unreplaced variables found: ${unreplacedMatches.join(', ')}`);
        }
        return renderedPrompt;
    }
    static validateTemplateVariables(templateId, providedVariables) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with id "${templateId}" not found`);
        }
        const providedKeys = Object.keys(providedVariables);
        const requiredKeys = template.variables;
        const missingVariables = requiredKeys.filter(key => !providedKeys.includes(key));
        const extraVariables = providedKeys.filter(key => !requiredKeys.includes(key));
        return {
            isValid: missingVariables.length === 0,
            missingVariables,
            extraVariables,
        };
    }
    static listTemplates() {
        return exports.PROMPT_TEMPLATES.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
        }));
    }
    // Helper method to create custom prompts
    static createCustomPrompt(baseTemplate, data, context) {
        let prompt = baseTemplate;
        // Add data
        prompt += `\n\nData to analyze:\n${JSON.stringify(data, null, 2)}\n`;
        // Add context if provided
        if (context) {
            prompt += '\nContext:\n';
            if (context.industry)
                prompt += `- Industry: ${context.industry}\n`;
            if (context.audience)
                prompt += `- Target Audience: ${context.audience}\n`;
            if (context.goals)
                prompt += `- Business Goals: ${context.goals.join(', ')}\n`;
            if (context.tone)
                prompt += `- Preferred Tone: ${context.tone}\n`;
        }
        return prompt;
    }
}
exports.PromptTemplateEngine = PromptTemplateEngine;
