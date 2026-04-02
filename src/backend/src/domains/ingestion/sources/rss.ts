import Parser from 'rss-parser';
import { RawArticle } from '../types';

const parser = new Parser({
  customFields: {
    item: ['author', 'dc:creator'],
  },
});

export async function fetchRSSFeed(
  sourceId: string,
  feedUrl: string,
  maxItems = 20
): Promise<RawArticle[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? []).slice(0, maxItems).map((item) => ({
    sourceId,
    url: item.link ?? item.guid ?? '',
    title: item.title ?? 'Untitled',
    rawContent: item.contentSnippet ?? item.content ?? item.summary ?? '',
    author: (item as Record<string, string>)['dc:creator'] ?? item.creator ?? '',
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
  }));
}
