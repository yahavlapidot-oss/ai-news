import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../types/article';
import { createUser, fetchPreferences, updatePreferences, UserPreferences } from '../services/api';

interface UserState {
  userId: string | null;
  preferences: UserPreferences;
  initialized: boolean;
  initUser: () => Promise<void>;
  updatePrefs: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const DEFAULT_PREFS: UserPreferences = {
  subscribedCategories: ['llms', 'research', 'tools', 'startups', 'robotics', 'regulation'] as Category[],
  notificationEnabled: true,
  briefingTime: '07:00',
  contentDepth: 'summary',
};

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  preferences: DEFAULT_PREFS,
  initialized: false,

  initUser: async () => {
    try {
      let userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        const result = await createUser();
        userId = result.userId;
        await AsyncStorage.setItem('userId', userId);
      }

      const prefs = await fetchPreferences(userId).catch(() => DEFAULT_PREFS);
      set({ userId, preferences: prefs, initialized: true });
    } catch {
      set({ initialized: true });
    }
  },

  updatePrefs: async (prefs) => {
    const { userId, preferences } = get();
    const merged = { ...preferences, ...prefs };
    set({ preferences: merged });
    if (userId) {
      await updatePreferences(userId, merged).catch(console.error);
    }
  },
}));
