import axios from 'axios';
import { RawArticle } from '../types';

interface PWCPaper {
  id: string;
  arxiv_id: string;
  url_abs: string;
  title: string;
  abstract: string;
  authors: string[];
  published: string;
  stars: number;
}

interface PWCResponse {
  results: PWCPaper[];
}

export async function fetchPapersWithCode(
  sourceId: string,
  maxResults = 30
): Promise<RawArticle[]> {
  const { data } = await axios.get<PWCResponse>(
    'https://paperswithcode.com/api/v1/papers/',
    {
      params: {
        ordering: '-published',
        items_per_page: maxResults,
      },
      timeout: 15000,
    }
  );

  return (data.results ?? []).map((paper) => ({
    sourceId,
    url: paper.url_abs ?? `https://paperswithcode.com/paper/${paper.id}`,
    title: paper.title,
    rawContent: paper.abstract ?? '',
    author: paper.authors?.join(', ') ?? '',
    publishedAt: paper.published ? new Date(paper.published) : undefined,
  })).filter((p) => p.url && p.title);
}
