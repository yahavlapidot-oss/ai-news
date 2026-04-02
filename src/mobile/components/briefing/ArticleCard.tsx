import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Article, CATEGORY_META } from '../../types/article';
import { Badge } from '../common/Badge';

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  showScore?: boolean;
}

export function ArticleCard({ article, onPress, showScore = false }: ArticleCardProps) {
  const meta = CATEGORY_META[article.category];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(article)}>
      <View style={styles.container}>
        <View style={[styles.categoryBar, { backgroundColor: meta.color }]} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Badge label={meta.label} color={meta.color} />
            {showScore && (
              <Text style={styles.score}>{article.importanceScore}/10</Text>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
          {article.summary ? (
            <Text style={styles.summary} numberOfLines={2}>
              {article.summary}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 21,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
