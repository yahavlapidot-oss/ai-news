import axios from 'axios';
import { Article, Category } from '../types/article';
import { DailyBriefing } from '../types/briefing';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach userId to every request if available
let _userId: string | null = null;
export function setUserId(id: string) {
  _userId = id;
  api.defaults.headers.common['X-User-Id'] = id;
}

// ─── Briefing ────────────────────────────────────────────────────────────────

export async function fetchBriefing(date?: string): Promise<DailyBriefing> {
  const { data } = await api.get('/api/briefing', { params: date ? { date } : undefined });
  return data;
}

export async function fetchBriefingHistory(): Promise<Array<{ date: string; articleCount: number }>> {
  const { data } = await api.get('/api/briefing/history');
  return data;
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export interface FeedParams {
  categories?: Category[];
  minImportance?: number;
  limit?: number;
  offset?: number;
  since?: string;
}

export async function fetchFeed(params: FeedParams = {}): Promise<Article[]> {
  const { data } = await api.get('/api/feed', {
    params: {
      ...params,
      categories: params.categories?.join(','),
    },
  });
  return data;
}

export async function fetchArticle(id: string): Promise<Article> {
  const { data } = await api.get(`/api/feed/${id}`);
  return data;
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export async function fetchTopics(): Promise<
  Array<{ id: string; label: string; color: string; articleCount: number }>
> {
  const { data } = await api.get('/api/topics');
  return data;
}

export async function fetchTopicArticles(category: Category, limit = 20): Promise<Article[]> {
  const { data } = await api.get(`/api/topics/${category}`, { params: { limit } });
  return data;
}

export async function fetchTrendSignals(): Promise<
  Array<{ topic: string; articleCount: number; latestAt: string }>
> {
  const { data } = await api.get('/api/topics/trends/signals');
  return data;
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function createUser(): Promise<{ userId: string }> {
  const { data } = await api.post('/api/user');
  return data;
}

export interface UserPreferences {
  subscribedCategories: Category[];
  notificationEnabled: boolean;
  briefingTime: string;
  contentDepth: 'headlines' | 'summary' | 'full';
}

export async function fetchPreferences(userId: string): Promise<UserPreferences> {
  const { data } = await api.get(`/api/user/${userId}/preferences`);
  return data;
}

export async function updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
  await api.put(`/api/user/${userId}/preferences`, prefs);
}

export async function trackInteraction(
  userId: string,
  articleId: string,
  action: 'read' | 'save' | 'unsave'
): Promise<void> {
  await api.post(`/api/user/${userId}/interactions`, { articleId, action });
}

export async function fetchSavedArticles(userId: string): Promise<Article[]> {
  const { data } = await api.get(`/api/user/${userId}/saved`);
  return data;
}

export default api;
