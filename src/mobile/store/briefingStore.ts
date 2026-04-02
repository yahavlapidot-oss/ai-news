import { create } from 'zustand';
import { DailyBriefing } from '../types/briefing';
import { fetchBriefing, fetchBriefingHistory } from '../services/api';

interface BriefingState {
  briefing: DailyBriefing | null;
  history: Array<{ date: string; articleCount: number }>;
  loading: boolean;
  error: string | null;
  loadBriefing: (date?: string) => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useBriefingStore = create<BriefingState>((set) => ({
  briefing: null,
  history: [],
  loading: false,
  error: null,

  loadBriefing: async (date) => {
    set({ loading: true, error: null });
    try {
      const briefing = await fetchBriefing(date);
      set({ briefing, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  loadHistory: async () => {
    try {
      const history = await fetchBriefingHistory();
      set({ history });
    } catch {
      // Non-critical
    }
  },
}));
