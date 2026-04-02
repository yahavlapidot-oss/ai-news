import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Article, CATEGORY_META } from '../../types/article';
import { Badge } from '../common/Badge';

interface HeadlineCardProps {
  article: Article;
  onPress: (article: Article) => void;
}

export function HeadlineCard({ article, onPress }: HeadlineCardProps) {
  const meta = CATEGORY_META[article.category];

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(article)}>
      <View style={styles.container}>
        {/* Dark gradient overlay background */}
        <View style={styles.background}>
          <View style={styles.overlay} />

          <View style={styles.content}>
            <View style={styles.topRow}>
              <Badge label={meta.label} color={meta.color} />
              {article.isBreakthrough && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>TOP PRIORITY</Text>
                </View>
              )}
            </View>

            <Text style={styles.title} numberOfLines={3}>
              {article.title}
            </Text>

            {article.summary ? (
              <Text style={styles.summary} numberOfLines={2}>
                {article.summary}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  background: {
    minHeight: 200,
    backgroundColor: '#1A1A2E',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,30,0.7)',
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priorityBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  summary: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
});
