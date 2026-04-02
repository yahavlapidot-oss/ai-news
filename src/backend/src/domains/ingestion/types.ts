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
  type: 'newsapi' | 'guardian' | 'rss' | 'arxiv' | 'hackernews'
      | 'reddit' | 'twitter' | 'youtube' | 'paperswithcode' | 'semanticscholar';
  enabled: boolean;
  pollIntervalMinutes: number;
  config: Record<string, unknown>;
}

export interface SocialSignal {
  platform: 'twitter' | 'reddit' | 'hackernews' | 'youtube';
  externalId: string;
  authorHandle: string;
  authorTier: 1 | 2 | 3;
  content: string;
  url?: string;
  likes: number;
  reposts: number;
  replies: number;
  engagementScore: number;
  postedAt: Date;
}

export interface IngestionResult {
  sourceId: string;
  fetched: number;
  stored: number;
  duplicates: number;
  errors: number;
}
