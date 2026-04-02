import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useUserStore } from '../../store/userStore';
import { Category, CATEGORY_META } from '../../types/article';

const ALL_CATEGORIES: Category[] = ['llms', 'robotics', 'startups', 'research', 'tools', 'regulation'];
const DEPTH_OPTIONS: Array<{ value: 'headlines' | 'summary' | 'full'; label: string; desc: string }> = [
  { value: 'headlines', label: 'Headlines Only', desc: 'Just titles and scores' },
  { value: 'summary', label: 'Summaries', desc: 'Title + 2-3 sentence summary' },
  { value: 'full', label: 'Full Analysis', desc: 'Complete AI analysis with takeaways' },
];

export default function SettingsScreen() {
  const { preferences, updatePrefs } = useUserStore();

  function toggleCategory(cat: Category) {
    const current = preferences.subscribedCategories;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    updatePrefs({ subscribedCategories: next });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Topic Subscriptions */}
        <Text style={styles.sectionLabel}>TOPICS</Text>
        <View style={styles.card}>
          {ALL_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const subscribed = preferences.subscribedCategories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={styles.row}
                onPress={() => toggleCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                <Text style={styles.rowLabel}>{meta.label}</Text>
                <View style={[styles.toggleDot, subscribed && styles.toggleDotActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily Briefing Alert</Text>
            <Switch
              value={preferences.notificationEnabled}
              onValueChange={(v) => updatePrefs({ notificationEnabled: v })}
              trackColor={{ true: '#6366F1', false: '#E5E7EB' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Briefing Time</Text>
            <Text style={styles.rowValue}>{preferences.briefingTime}</Text>
          </View>
        </View>

        {/* Content Depth */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CONTENT DEPTH</Text>
        <View style={styles.card}>
          {DEPTH_OPTIONS.map((opt, idx) => {
            const active = preferences.contentDepth === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.row, idx === DEPTH_OPTIONS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => updatePrefs({ contentDepth: opt.value })}
                activeOpacity={0.7}
              >
                <View style={styles.depthText}>
                  <Text style={[styles.rowLabel, active && { color: '#6366F1' }]}>{opt.label}</Text>
                  <Text style={styles.depthDesc}>{opt.desc}</Text>
                </View>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footer}>AI Insight Hub v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
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
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  rowValue: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  toggleDotActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  depthText: {
    flex: 1,
  },
  depthDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 32,
  },
});
