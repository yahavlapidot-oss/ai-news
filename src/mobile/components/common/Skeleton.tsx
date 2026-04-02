import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function BriefingSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={28} width="60%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="40%" style={{ marginBottom: 24 }} />
      <Skeleton height={200} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton height={80} borderRadius={12} style={{ marginBottom: 12 }} />
      <Skeleton height={80} borderRadius={12} style={{ marginBottom: 12 }} />
      <Skeleton height={80} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  container: {
    padding: 16,
  },
});
