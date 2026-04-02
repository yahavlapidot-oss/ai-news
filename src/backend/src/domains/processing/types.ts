export type Category =
  | 'llms'
  | 'robotics'
  | 'startups'
  | 'research'
  | 'tools'
  | 'regulation'
  | 'other';

export interface AIAnalysis {
  summary: string;
  keyTakeaways: string[];
  category: Category;
  importanceScore: number;
  importanceReason: string;
  isBreakthrough: boolean;
  relatedTopics: string[];
}

export interface ProcessedArticle {
  rawArticleId: string;
  sourceId: string;
  url: string;
  title: string;
  cleanContent: string;
  summary: string;
  keyTakeaways: string[];
  category: Category;
  importanceScore: number;
  importanceReason: string;
  isBreakthrough: boolean;
  relatedTopics: string[];
  author?: string;
  publishedAt?: Date;
}
