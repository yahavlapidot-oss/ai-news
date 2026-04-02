import axios from 'axios';
import { RawArticle } from '../types';

interface GuardianResult {
  id: string;
  webUrl: string;
  webTitle: string;
  fields?: { bodyText?: string; byline?: string };
  webPublicationDate: string;
}

interface GuardianResponse {
  response: { results: GuardianResult[] };
}

export async function fetchGuardian(
  sourceId: string,
  section: string,
  tag?: string,
  pageSize = 20
): Promise<RawArticle[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    console.warn('GUARDIAN_API_KEY not set, skipping Guardian fetch');
    return [];
  }

  const { data } = await axios.get<GuardianResponse>(
    'https://content.guardianapis.com/search',
    {
      params: {
        section,
        tag,
        'show-fields': 'bodyText,byline',
        'page-size': pageSize,
        'order-by': 'newest',
        'api-key': apiKey,
      },
      timeout: 10000,
    }
  );

  return data.response.results.map((r) => ({
    sourceId,
    url: r.webUrl,
    title: r.webTitle,
    rawContent: r.fields?.bodyText ?? '',
    author: r.fields?.byline ?? '',
    publishedAt: new Date(r.webPublicationDate),
  }));
}
