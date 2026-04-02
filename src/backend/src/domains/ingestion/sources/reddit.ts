import axios from 'axios';
import { RawArticle } from '../types';

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    author: string;
    score: number;
    created_utc: number;
    is_self: boolean;
    permalink: string;
  };
}

interface RedditListing {
  data: { children: RedditPost[] };
}

let redditToken: { value: string; expiresAt: number } | null = null;

async function getRedditToken(): Promise<string> {
  if (redditToken && Date.now() < redditToken.expiresAt) {
    return redditToken.value;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET required');
  }

  const { data } = await axios.post(
    'https://www.reddit.com/api/v1/access_token',
    'grant_type=client_credentials',
    {
      auth: { username: clientId, password: clientSecret },
      headers: { 'User-Agent': 'AIInsightHub/1.0' },
    }
  );

  redditToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return redditToken.value;
}

export async function fetchReddit(
  sourceId: string,
  subreddit: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  minScore = 50,
  limit = 25
): Promise<RawArticle[]> {
  let token: string;
  try {
    token = await getRedditToken();
  } catch {
    // Fall back to public JSON API (no auth, rate-limited)
    return fetchRedditPublic(sourceId, subreddit, sort, minScore, limit);
  }

  const { data } = await axios.get<RedditListing>(
    `https://oauth.reddit.com/r/${subreddit}/${sort}`,
    {
      params: { limit: Math.min(limit * 2, 50) },
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'AIInsightHub/1.0',
      },
      timeout: 10000,
    }
  );

  return data.data.children
    .map((p) => p.data)
    .filter((p) => p.score >= minScore)
    .slice(0, limit)
    .map((p) => ({
      sourceId,
      url: p.is_self
        ? `https://www.reddit.com${p.permalink}`
        : p.url,
      title: p.title,
      rawContent: p.selftext ?? '',
      author: p.author,
      publishedAt: new Date(p.created_utc * 1000),
    }));
}

async function fetchRedditPublic(
  sourceId: string,
  subreddit: string,
  sort: string,
  minScore: number,
  limit: number
): Promise<RawArticle[]> {
  const { data } = await axios.get<RedditListing>(
    `https://www.reddit.com/r/${subreddit}/${sort}.json`,
    {
      params: { limit: Math.min(limit * 2, 50) },
      headers: { 'User-Agent': 'AIInsightHub/1.0' },
      timeout: 10000,
    }
  );

  return data.data.children
    .map((p) => p.data)
    .filter((p) => p.score >= minScore)
    .slice(0, limit)
    .map((p) => ({
      sourceId,
      url: p.is_self ? `https://www.reddit.com${p.permalink}` : p.url,
      title: p.title,
      rawContent: p.selftext ?? '',
      author: p.author,
      publishedAt: new Date(p.created_utc * 1000),
    }));
}
