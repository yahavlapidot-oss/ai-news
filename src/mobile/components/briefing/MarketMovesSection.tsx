import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';

interface MarketMove {
  name: string;
  change: number;
  changePercent: number;
}

interface MarketMovesSectionProps {
  moves: MarketMove[];
}

function MoveTile({ move }: { move: MarketMove }) {
  const positive = move.changePercent >= 0;
  const color = positive ? '#10B981' : '#EF4444';
  const sign = positive ? '+' : '';

  return (
    <View style={styles.tile}>
      <View style={[styles.dot, { backgroundColor: color + '33' }]}>
        <View style={[styles.dotInner, { backgroundColor: color }]} />
      </View>
      <Text style={styles.tileName}>{move.name}</Text>
      <Text style={[styles.tileChange, { color }]}>
        {sign}{move.changePercent.toFixed(1)}%
      </Text>
    </View>
  );
}

export function MarketMovesSection({ moves }: MarketMovesSectionProps) {
  if (!moves || moves.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MARKET MOVES</Text>
      <Card style={styles.card}>
        {moves.map((move, idx) => (
          <MoveTile key={idx} move={move} />
        ))}
        <Text style={styles.disclaimer}>
          Market data refreshed 3 minutes ago. Indices represent sector-weighted aggregates of leading AI-focused enterprises.
        </Text>
      </Card>
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
  card: {
    gap: 0,
    padding: 0,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tileChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 10,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 14,
  },
});
