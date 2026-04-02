import axios from 'axios';
import { RawArticle } from '../types';
import accountsConfig from '../../../../../../config/tracked-accounts.json';

interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: { like_count: number; retweet_count: number; reply_count: number };
  entities?: { urls?: Array<{ expanded_url: string; title?: string }> };
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TwitterResponse {
  data: Tweet[];
  includes?: { users: TwitterUser[] };
}

export async function fetchTrackedTwitterAccounts(sourceId: string): Promise<RawArticle[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn('TWITTER_BEARER_TOKEN not set, skipping Twitter fetch');
    return [];
  }

  const accounts = accountsConfig.twitter;
  const handles = accounts.map((a) => a.handle).join(',');

  // Build query: tweets from tracked accounts mentioning AI topics
  const query = `(from:${handles}) (AI OR LLM OR "machine learning" OR "neural network" OR "deep learning" OR "foundation model") -is:retweet lang:en`;

  const { data } = await axios.get<TwitterResponse>(
    'https://api.twitter.com/2/tweets/search/recent',
    {
      params: {
        query,
        max_results: 50,
        'tweet.fields': 'created_at,public_metrics,entities,author_id',
        'user.fields': 'username,name',
        expansions: 'author_id',
      },
      headers: { Authorization: `Bearer ${bearerToken}` },
      timeout: 10000,
    }
  );

  if (!data.data) return [];

  const userMap = new Map(
    (data.includes?.users ?? []).map((u) => [u.id, u])
  );

  return data.data.map((tweet) => {
    const user = userMap.get(tweet.author_id);
    const linkedUrl = tweet.entities?.urls?.[0]?.expanded_url;
    const metrics = tweet.public_metrics;
    const engagementScore =
      metrics.like_count * 1 + metrics.retweet_count * 3 + metrics.reply_count * 2;

    return {
      sourceId,
      url: linkedUrl ?? `https://twitter.com/i/web/status/${tweet.id}`,
      title: tweet.text.slice(0, 200),
      rawContent: tweet.text,
      author: user?.username ?? 'unknown',
      publishedAt: new Date(tweet.created_at),
      // Store engagement metadata as JSON in rawContent suffix
    };
  }).filter((t) => t.url);
}
