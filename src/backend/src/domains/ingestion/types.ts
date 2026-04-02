export interface RawArticle {
  sourceId: string;
  url: string;
  title: string;
  rawContent?: string;
  author?: string;
  publishedAt?: Date;
}

export interface Source {
  id: string;
  name: string;
  type: 'newsapi' | 'guardian' | 'rss' | 'arxiv' | 'hackernews';
  enabled: boolean;
  pollIntervalMinutes: number;
  config: Record<string, unknown>;
}

export interface IngestionResult {
  sourceId: string;
  fetched: number;
  stored: number;
  duplicates: number;
  errors: number;
}
