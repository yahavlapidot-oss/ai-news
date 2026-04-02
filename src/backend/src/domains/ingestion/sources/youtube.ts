import axios from 'axios';
import { RawArticle } from '../types';
import accountsConfig from '../../../../../../config/tracked-accounts.json';

interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    channelId: string;
  };
}

interface YouTubeResponse {
  items: YouTubeItem[];
}

export async function fetchYouTubeChannels(sourceId: string): Promise<RawArticle[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set, skipping YouTube fetch');
    return [];
  }

  const channels = accountsConfig.youtube;
  const articles: RawArticle[] = [];

  for (const channel of channels) {
    try {
      const { data } = await axios.get<YouTubeResponse>(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            channelId: channel.channelId,
            part: 'snippet',
            order: 'date',
            maxResults: 5,
            type: 'video',
            key: apiKey,
          },
          timeout: 10000,
        }
      );

      for (const item of data.items ?? []) {
        articles.push({
          sourceId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          title: item.snippet.title,
          rawContent: item.snippet.description,
          author: item.snippet.channelTitle,
          publishedAt: new Date(item.snippet.publishedAt),
        });
      }
    } catch (err) {
      console.error(`YouTube fetch failed for channel ${channel.name}:`, (err as Error).message);
    }
  }

  return articles;
}
