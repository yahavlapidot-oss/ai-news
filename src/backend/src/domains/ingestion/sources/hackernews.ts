import axios from 'axios';
import { RawArticle } from '../types';

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  time: number;
  by: string;
  text?: string;
}

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

export async function fetchHackerNews(
  sourceId: string,
  minScore = 50,
  aiKeywords: string[] = [],
  limit = 30
): Promise<RawArticle[]> {
  const { data: topIds } = await axios.get<number[]>(
    `${HN_BASE}/topstories.json`,
    { timeout: 10000 }
  );

  const storyIds = topIds.slice(0, 100);
  const stories = await Promise.allSettled(
    storyIds.map((id) =>
      axios.get<HNStory>(`${HN_BASE}/item/${id}.json`, { timeout: 5000 })
        .then((r) => r.data)
    )
  );

  const lowerKeywords = aiKeywords.map((k) => k.toLowerCase());

  return stories
    .filter((r): r is PromiseFulfilledResult<HNStory> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((story) => {
      if (story.score < minScore) return false;
      if (!story.url && !story.text) return false;
      const titleLower = story.title.toLowerCase();
      return lowerKeywords.length === 0 || lowerKeywords.some((kw) => titleLower.includes(kw));
    })
    .slice(0, limit)
    .map((story) => ({
      sourceId,
      url: story.url ?? `https://news.ycombinator.com/item?id=${story.id}`,
      title: story.title,
      rawContent: story.text ?? '',
      author: story.by,
      publishedAt: new Date(story.time * 1000),
    }));
}
