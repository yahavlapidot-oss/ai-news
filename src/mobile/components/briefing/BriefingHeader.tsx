import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';

interface BriefingHeaderProps {
  date: string;
  readTimeMinutes: number;
  onDownload?: () => void;
}

export function BriefingHeader({ date, readTimeMinutes, onDownload }: BriefingHeaderProps) {
  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>AI INSIGHT HUB</Text>
      <Text style={styles.title}>The Briefing</Text>
      <View style={styles.metaRow}>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.dot}> · </Text>
        <Text style={styles.readTime}>{readTimeMinutes} min read</Text>
      </View>
      <TouchableOpacity style={styles.downloadBtn} onPress={onDownload} activeOpacity={0.8}>
        <Text style={styles.downloadText}>↓  Download Full Dataset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
  },
  dot: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  readTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  downloadBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  downloadText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
