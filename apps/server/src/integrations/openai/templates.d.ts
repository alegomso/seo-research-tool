export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    category: 'keyword' | 'competitor' | 'content' | 'technical' | 'strategy';
    prompt: string;
    variables: string[];
    outputFormat: 'json' | 'text' | 'markdown';
}
export declare const PROMPT_TEMPLATES: PromptTemplate[];
export declare class PromptTemplateEngine {
    static getTemplate(id: string): PromptTemplate | undefined;
    static getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[];
    static renderPrompt(templateId: string, variables: {
        [key: string]: any;
    }): string;
    static validateTemplateVariables(templateId: string, providedVariables: {
        [key: string]: any;
    }): {
        isValid: boolean;
        missingVariables: string[];
        extraVariables: string[];
    };
    static listTemplates(): Array<{
        id: string;
        name: string;
        description: string;
        category: string;
    }>;
    static createCustomPrompt(baseTemplate: string, data: any, context?: {
        industry?: string;
        audience?: string;
        goals?: string[];
        tone?: 'professional' | 'casual' | 'technical';
    }): string;
}
//# sourceMappingURL=templates.d.ts.map