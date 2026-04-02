import React, { useState } from 'react';
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
import { fetchTopics, fetchTopicArticles, fetchTrendSignals } from '../../services/api';
import { ArticleCard } from '../../components/briefing/ArticleCard';
import { Skeleton } from '../../components/common/Skeleton';
import { Category, CATEGORY_META } from '../../types/article';

export default function AnalyzeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trends = [] } = useQuery({
    queryKey: ['trends'],
    queryFn: fetchTrendSignals,
    staleTime: 2 * 60 * 1000,
  });

  const { data: categoryArticles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['topic-articles', selectedCategory],
    queryFn: () => fetchTopicArticles(selectedCategory!, 15),
    enabled: !!selectedCategory,
    staleTime: 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Analyze</Text>

        {/* Category Breakdown */}
        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        {topicsLoading ? (
          <Skeleton height={48} borderRadius={10} style={{ marginBottom: 8 }} />
        ) : (
          <View style={styles.categoryGrid}>
            {topics.map((topic) => {
              const isSelected = selectedCategory === topic.id;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.categoryTile,
                    { borderColor: topic.color + '44' },
                    isSelected && { backgroundColor: topic.color + '22', borderColor: topic.color },
                  ]}
                  onPress={() => setSelectedCategory(isSelected ? null : topic.id as Category)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryName, { color: topic.color }]}>{topic.label}</Text>
                  <Text style={styles.categoryCount}>{topic.articleCount}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Emerging Signals */}
        {trends.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EMERGING SIGNALS</Text>
            {trends.slice(0, 5).map((signal, i) => (
              <View key={i} style={styles.signalRow}>
                <View style={styles.signalDot} />
                <Text style={styles.signalTopic}>{signal.topic}</Text>
                <Text style={styles.signalCount}>{signal.articleCount} articles</Text>
              </View>
            ))}
          </>
        )}

        {/* Category Articles */}
        {selectedCategory && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              {CATEGORY_META[selectedCategory].label.toUpperCase()} ARTICLES
            </Text>
            {articlesLoading ? (
              <>
                <Skeleton height={80} borderRadius={10} style={{ marginBottom: 8 }} />
                <Skeleton height={80} borderRadius={10} />
              </>
            ) : (
              categoryArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={(a) => Linking.openURL(a.url)}
                  showScore
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    minWidth: '45%',
    flexGrow: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  signalTopic: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  signalCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
