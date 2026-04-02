import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Article, CATEGORY_META } from '../../types/article';
import { Badge } from '../common/Badge';

interface NewResearchSectionProps {
  articles: Article[];
  onViewAll: () => void;
  onPress: (article: Article) => void;
}

export function NewResearchSection({ articles, onViewAll, onPress }: NewResearchSectionProps) {
  const research = articles.filter((a) => a.category === 'research').slice(0, 3);
  if (research.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>NEW RESEARCH</Text>

      {research.map((article) => {
        const meta = CATEGORY_META[article.category];
        return (
          <TouchableOpacity
            key={article.id}
            style={styles.row}
            activeOpacity={0.8}
            onPress={() => onPress(article)}
          >
            <View style={[styles.iconBox, { backgroundColor: meta.color + '22' }]}>
              <Text style={[styles.iconEmoji]}>🔬</Text>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
              {article.summary ? (
                <Text style={styles.summary} numberOfLines={1}>{article.summary}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.viewAll} onPress={onViewAll}>
        <Text style={styles.viewAllText}>+ View All {research.length} Papers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 19,
    marginBottom: 3,
  },
  summary: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
});
