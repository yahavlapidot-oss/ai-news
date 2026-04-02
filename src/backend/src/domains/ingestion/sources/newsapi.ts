import axios from 'axios';
import { RawArticle } from '../types';

interface NewsAPIArticle {
  url: string;
  title: string;
  content: string;
  description: string;
  author: string;
  publishedAt: string;
  source: { name: string };
}

interface NewsAPIResponse {
  status: string;
  articles: NewsAPIArticle[];
}

export async function fetchNewsAPI(
  sourceId: string,
  query: string,
  language = 'en',
  sortBy = 'publishedAt',
  pageSize = 30
): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('NEWS_API_KEY not set, skipping NewsAPI fetch');
    return [];
  }

  const { data } = await axios.get<NewsAPIResponse>(
    'https://newsapi.org/v2/everything',
    {
      params: { q: query, language, sortBy, pageSize, apiKey },
      timeout: 10000,
    }
  );

  if (data.status !== 'ok') return [];

  return data.articles.map((a) => ({
    sourceId,
    url: a.url,
    title: a.title,
    rawContent: a.content ?? a.description ?? '',
    author: a.author ?? '',
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
  }));
}
