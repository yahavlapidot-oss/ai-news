export type Category =
  | 'llms'
  | 'robotics'
  | 'startups'
  | 'research'
  | 'tools'
  | 'regulation'
  | 'other';

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: Category;
  importanceScore: number;
  isBreakthrough: boolean;
  sourceId: string;
  url: string;
  author?: string;
  publishedAt?: string;
  keyTakeaways: string[];
  relatedTopics: string[];
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  llms:       { label: 'LLMs',         color: '#6366F1' },
  robotics:   { label: 'Robotics',     color: '#10B981' },
  startups:   { label: 'Startups',     color: '#F59E0B' },
  research:   { label: 'Research',     color: '#8B5CF6' },
  tools:      { label: 'Tools',        color: '#3B82F6' },
  regulation: { label: 'Regulation',   color: '#EF4444' },
  other:      { label: 'Other',        color: '#6B7280' },
};
