import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchBriefingHistory, fetchSavedArticles } from '../../services/api';
import { ArticleCard } from '../../components/briefing/ArticleCard';
import { Skeleton } from '../../components/common/Skeleton';
import { useUserStore } from '../../store/userStore';
import { format } from 'date-fns';

export default function ReportsScreen() {
  const userId = useUserStore((s) => s.userId);

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['briefing-history'],
    queryFn: fetchBriefingHistory,
    staleTime: 10 * 60 * 1000,
  });

  const { data: savedArticles = [], isLoading: savedLoading } = useQuery({
    queryKey: ['saved-articles', userId],
    queryFn: () => fetchSavedArticles(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Reports</Text>

        {/* Briefing Archive */}
        <Text style={styles.sectionLabel}>DAILY BRIEFINGS</Text>
        {historyLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={52} borderRadius={10} style={{ marginBottom: 8 }} />
            ))}
          </>
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No briefings yet. Check back tomorrow.</Text>
        ) : (
          history.map((entry) => (
            <View key={entry.date} style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>
                  {format(new Date(entry.date), 'MMMM d, yyyy')}
                </Text>
                <Text style={styles.historyMeta}>{entry.articleCount} articles analyzed</Text>
              </View>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>VIEW</Text>
              </View>
            </View>
          ))
        )}

        {/* Saved Articles */}
        {userId && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SAVED ARTICLES</Text>
            {savedLoading ? (
              <Skeleton height={80} borderRadius={10} />
            ) : savedArticles.length === 0 ? (
              <Text style={styles.emptyText}>
                No saved articles yet. Tap the save button on any article.
              </Text>
            ) : (
              savedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={(a) => Linking.openURL(a.url)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  historyMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});
