import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KeyTrend } from '../../types/briefing';
import { Card } from '../common/Card';

interface QuickSummaryProps {
  executiveSummary: string;
  keyTrends: KeyTrend[];
  dataSources?: string[];
  relatedBriefs?: string[];
}

export function QuickSummary({
  executiveSummary,
  keyTrends,
  dataSources = ['ARXIV.ORG', 'BLOOMBERG AI', 'IEEE EXPLORE', 'REUTERS TECH'],
  relatedBriefs = [],
}: QuickSummaryProps) {
  // Extract bullet takeaways from executive summary (first 3 sentences)
  const sentences = executiveSummary
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Summary</Text>

      <Card>
        <Text style={styles.label}>KEY TAKEAWAYS</Text>
        {sentences.map((sentence, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{sentence}</Text>
          </View>
        ))}

        {dataSources.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>DATA SOURCES</Text>
            <View style={styles.tagsRow}>
              {dataSources.map((src, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{src}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {relatedBriefs.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>RELATED BRIEFS</Text>
            {relatedBriefs.map((brief, i) => (
              <Text key={i} style={styles.relatedBrief}>{brief}</Text>
            ))}
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  relatedBrief: {
    fontSize: 13,
    color: '#6366F1',
    marginBottom: 6,
    textDecorationLine: 'underline',
  },
});
