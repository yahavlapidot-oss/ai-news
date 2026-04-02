import React, { useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchBriefing, fetchFeed } from '../../services/api';
import { BriefingHeader } from '../../components/briefing/BriefingHeader';
import { HeadlineCard } from '../../components/briefing/HeadlineCard';
import { ArticleCard } from '../../components/briefing/ArticleCard';
import { MarketMovesSection } from '../../components/briefing/MarketMovesSection';
import { NewResearchSection } from '../../components/briefing/NewResearchSection';
import { QuickSummary } from '../../components/briefing/QuickSummary';
import { BriefingSkeleton } from '../../components/common/Skeleton';
import { Article } from '../../types/article';

// Placeholder market data (replace with Polygon.io integration)
const MOCK_MARKET_MOVES = [
  { name: 'Synthetics', change: 4.2, changePercent: 4.2 },
  { name: 'Quantum', change: -1.8, changePercent: -1.8 },
  { name: 'Hardware', change: 0.6, changePercent: 0.6 },
];

export default function HubScreen() {
  const today = new Date().toISOString().slice(0, 10);

  const {
    data: briefing,
    isLoading: briefingLoading,
    refetch: refetchBriefing,
    isRefetching,
  } = useQuery({
    queryKey: ['briefing', today],
    queryFn: () => fetchBriefing(today),
    staleTime: 5 * 60 * 1000,
  });

  const { data: feed = [] } = useQuery({
    queryKey: ['feed', 'hub'],
    queryFn: () => fetchFeed({ limit: 10, minImportance: 5 }),
    staleTime: 60 * 1000,
  });

  const handleArticlePress = useCallback((article: Article) => {
    Linking.openURL(article.url).catch(console.error);
  }, []);

  const handleViewAllResearch = useCallback(() => {
    // Navigate to analyze tab filtered on research
  }, []);

  if (briefingLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BriefingSkeleton />
      </SafeAreaView>
    );
  }

  const headlines = briefing?.headlines ?? feed.slice(0, 5);
  const featuredArticle = headlines[0];
  const secondaryArticles = headlines.slice(1, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchBriefing}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header */}
        <BriefingHeader
          date={briefing?.date ?? today}
          readTimeMinutes={briefing?.readTimeMinutes ?? 4}
          onDownload={() => {}}
        />

        {/* Major Headlines label */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>MAJOR HEADLINES</Text>
          <View style={styles.priorityChip}>
            <Text style={styles.priorityChipText}>TOP PRIORITY</Text>
          </View>
        </View>

        {/* Featured headline card */}
        {featuredArticle && (
          <HeadlineCard article={featuredArticle} onPress={handleArticlePress} />
        )}

        {/* Secondary articles */}
        {secondaryArticles.map((article) => (
          <ArticleCard key={article.id} article={article} onPress={handleArticlePress} />
        ))}

        {/* Market Moves */}
        <MarketMovesSection moves={MOCK_MARKET_MOVES} />

        {/* New Research */}
        <NewResearchSection
          articles={feed}
          onViewAll={handleViewAllResearch}
          onPress={handleArticlePress}
        />

        {/* Quick Summary */}
        {briefing?.executiveSummary && (
          <QuickSummary
            executiveSummary={briefing.executiveSummary}
            keyTrends={briefing.keyTrends}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  priorityChip: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
