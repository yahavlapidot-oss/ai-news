import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = '#6366F1', textColor = '#fff', size = 'sm' }: BadgeProps) {
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.text, { color, fontSize: isSmall ? 10 : 12 }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
