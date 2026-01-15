export interface AiResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

export interface ConciergeResponse extends AiResponse {
  suggestions?: string[];
  actionItems?: Array<{
    type: string;
    label: string;
    data?: Record<string, any>;
  }>;
}

export interface TranslationResponse extends AiResponse {
  original: string;
  translated: string;
  style: string;
  confidence: number;
}

export interface CoachingAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  engagementLevel: 'high' | 'medium' | 'low';
  topics: string[];
  redFlags?: string[];
  strengths: string[];
  areasForImprovement: string[];
}

export interface CoachingSuggestion {
  type: 'conversation' | 'date' | 'topic' | 'behavior';
  suggestion: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface IcebreakerSuggestion {
  text: string;
  category: 'question' | 'compliment' | 'shared_interest' | 'humor' | 'deep';
  basedOn?: string;
}

export interface ProfileOptimization {
  overall: {
    score: number;
    summary: string;
  };
  sections: Array<{
    name: string;
    currentScore: number;
    potentialScore: number;
    suggestions: string[];
  }>;
  quickWins: string[];
}

export interface DateIdea {
  title: string;
  description: string;
  category: string;
  estimatedCost: string;
  duration: string;
  location?: string;
  whyItWorks: string;
}

export interface ConversationSummary {
  summary: string;
  keyTopics: string[];
  importantDates?: string[];
  sharedInterests: string[];
  nextSteps?: string[];
}

export interface AiInteractionLog {
  id: string;
  userId: string;
  type: string;
  inputContext: Record<string, any>;
  output: Record<string, any>;
  tokensUsed?: number;
  latencyMs?: number;
  createdAt: Date;
}
