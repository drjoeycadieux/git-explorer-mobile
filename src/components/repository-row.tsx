import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { GitHubRepository } from '@/lib/github';

const palette = {
  surface: '#141c19',
  border: '#293630',
  text: '#f1f4ed',
  muted: '#96a69c',
  accent: '#c7f36b',
  language: '#76d8c2',
};

function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: value >= 1000 ? 'compact' : 'standard' }).format(
    value,
  );
}

function formatUpdated(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RepositoryRow({ repository }: { repository: GitHubRepository }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${repository.full_name} on GitHub`}
      onPress={() => void Linking.openURL(repository.html_url)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.heading}>
        <View style={styles.titleGroup}>
          <View style={styles.repoMark}>
            <View style={styles.repoMarkDot} />
          </View>
          <View style={styles.titleColumn}>
            <View style={styles.nameLine}>
              <View style={styles.titleText}>
                <View style={styles.ownerLine}>
                  <Text style={styles.label}>{repository.full_name.split('/')[0]}</Text>
                  <Text style={styles.muted}>/</Text>
                </View>
                <Text numberOfLines={1} style={styles.title}>{repository.name}</Text>
              </View>
              <Text style={styles.muted}>{formatUpdated(repository.updated_at)}</Text>
            </View>
          </View>
        </View>
      </View>

      {repository.description ? (
        <Text numberOfLines={2} style={styles.description}>{repository.description}</Text>
      ) : null}

      <View style={styles.details}>
        {repository.language ? (
          <View style={styles.language}>
            <View style={styles.languageDot} />
            <Text style={styles.label}>{repository.language}</Text>
          </View>
        ) : null}
        <Text style={styles.muted}>{formatCount(repository.stargazers_count)} stars</Text>
        <Text style={styles.muted}>{formatCount(repository.forks_count)} forks</Text>
        <Text style={styles.openLabel}>Open on GitHub</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: palette.surface,
    gap: 12,
  },
  pressed: { opacity: 0.72 },
  heading: { flexDirection: 'row', alignItems: 'center' },
  titleGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  repoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#25352d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repoMarkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent },
  titleColumn: { flex: 1 },
  nameLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  titleText: { flexShrink: 1, flexDirection: 'row', alignItems: 'baseline' },
  ownerLine: { flexDirection: 'row', gap: 4 },
  label: { color: palette.text, fontSize: 12, fontWeight: '600' },
  muted: { color: palette.muted, fontSize: 11 },
  title: { color: palette.accent, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  description: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 13, flexWrap: 'wrap' },
  language: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.language },
  openLabel: { color: palette.accent, fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
});