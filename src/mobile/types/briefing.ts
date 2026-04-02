import { Article } from './article';

export interface KeyTrend {
  title: string;
  description: string;
}

export interface MarketMove {
  name: string;
  ticker?: string;
  change: number;
  changePercent: number;
}

export interface DailyBriefing {
  id: string;
  date: string;
  readTimeMinutes: number;
  executiveSummary: string;
  keyTrends: KeyTrend[];
  articleCount: number;
  headlines: Article[];
  builtAt: string;
}
