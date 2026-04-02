import axios from 'axios';
import { RawArticle } from '../types';

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: { name: string[] }[];
  published: string[];
}

interface ArxivFeed {
  feed: { entry?: ArxivEntry[] };
}

export async function fetchArxiv(
  sourceId: string,
  categories: string[],
  maxResults = 50
): Promise<RawArticle[]> {
  const searchQuery = categories.map((c) => `cat:${c}`).join(' OR ');

  const { data } = await axios.get<string>(
    'https://export.arxiv.org/api/query',
    {
      params: {
        search_query: searchQuery,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
        max_results: maxResults,
      },
      timeout: 15000,
      headers: { Accept: 'application/atom+xml' },
    }
  );

  // Parse minimal XML — extract entries between <entry> tags
  const entries = [...data.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  return entries.map((match) => {
    const block = match[1];
    const extractTag = (tag: string) =>
      block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? '';

    const url = extractTag('id');
    const title = extractTag('title').replace(/\s+/g, ' ');
    const summary = extractTag('summary').replace(/\s+/g, ' ');
    const published = extractTag('published');
    const author = extractTag('name');

    return {
      sourceId,
      url,
      title,
      rawContent: summary,
      author,
      publishedAt: published ? new Date(published) : undefined,
    };
  }).filter((a) => a.url);
}
