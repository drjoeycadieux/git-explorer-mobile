import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RepositoryRow } from '@/components/repository-row';
import { BottomTabInset } from '@/constants/theme';
import { searchRepositories, type GitHubRepository } from '@/lib/github';

const colors = {
  background: '#0d1310',
  surface: '#141c19',
  border: '#293630',
  text: '#f1f4ed',
  muted: '#96a69c',
  accent: '#c7f36b',
  warm: '#f0a876',
};

const popularQuery = 'stars:>1000';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState(popularQuery);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    searchRepositories(popularQuery)
      .then((items) => {
        if (active) setRepositories(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to reach GitHub.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function runSearch(value: string) {
    const cleanQuery = value.trim() || popularQuery;
    setQuery(value.trim() ? value : '');
    setActiveQuery(cleanQuery);
    setLoading(true);
    setError('');
    try {
      setRepositories(await searchRepositories(cleanQuery));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reach GitHub. Try again.');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topline}>
          <Text style={styles.brand}>GITHUB / DISCOVER</Text>
          <Text style={styles.live}>LIVE SEARCH</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>THE OPEN WEB, IN MOTION</Text>
          <Text style={styles.headline}>Find your next{ '\n' }favorite project.</Text>
          <Text style={styles.intro}>Search public repositories across GitHub. Query syntax works too.</Text>
        </View>

        <View style={styles.searchBlock}>
          <Text style={styles.fieldLabel}>REPOSITORY SEARCH</Text>
          <View style={styles.searchRow}>
            <TextInput
              accessibilityLabel="Search GitHub repositories"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              onSubmitEditing={() => void runSearch(query)}
              placeholder="Search by name, topic, or language"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void runSearch(query)}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              <Text style={styles.searchButtonText}>{loading ? 'Searching' : 'Search'}</Text>
            </Pressable>
          </View>
          <View style={styles.quickQueries}>
            <Text style={styles.quickLabel}>QUICK SEARCH</Text>
            {[
              { label: 'TypeScript', query: 'language:TypeScript' },
              { label: 'Rust', query: 'language:Rust' },
              { label: 'Mobile', query: 'topic:react-native' },
            ].map((item) => (
              <Pressable key={item.label} onPress={() => void runSearch(item.query)}>
                <Text style={styles.quickQuery}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.resultsHeading}>
          <View>
            <Text style={styles.sectionKicker}>{activeQuery === popularQuery ? 'POPULAR REPOSITORIES' : 'SEARCH RESULTS'}</Text>
            <Text style={styles.resultsTitle}>
              {activeQuery === popularQuery ? 'Popular right now' : activeQuery}
            </Text>
          </View>
          <Text style={styles.resultCount}>{repositories.length} results</Text>
        </View>

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.statusText}>Asking GitHub...</Text>
          </View>
        ) : error ? (
          <View accessibilityRole="alert" style={styles.statusBox}>
            <Text style={styles.errorTitle}>Search unavailable</Text>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : repositories.length ? (
          <View style={styles.repositoryList}>
            {repositories.map((repository) => (
              <RepositoryRow key={repository.id} repository={repository} />
            ))}
          </View>
        ) : (
          <View style={styles.statusBox}>
            <Text style={styles.errorTitle}>No repositories found</Text>
            <Text style={styles.statusText}>Try a broader search or another language.</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>RESULTS SORTED BY STARS</Text>
          <Text style={styles.footerAccent}>GITHUB REST API</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: BottomTabInset + 36 },
  topline: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  live: { color: colors.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hero: { paddingTop: 35, paddingBottom: 24 },
  eyebrow: { color: colors.warm, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 13 },
  headline: { color: colors.text, fontSize: 37, lineHeight: 41, fontWeight: '700' },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 340 },
  searchBlock: { padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  searchRow: { flexDirection: 'row', height: 46, marginTop: 8, gap: 7 },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 11, color: colors.text, fontSize: 12, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 6 },
  searchButton: { minWidth: 76, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: colors.accent, borderRadius: 6 },
  searchButtonText: { color: colors.background, fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  quickQueries: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13, paddingTop: 13 },
  quickLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  quickQuery: { color: colors.accent, fontSize: 10 },
  resultsHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 30, marginBottom: 14 },
  sectionKicker: { color: colors.warm, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  resultsTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 5 },
  resultCount: { color: colors.muted, fontSize: 10, paddingBottom: 2 },
  repositoryList: { gap: 9 },
  statusBox: { minHeight: 115, padding: 18, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start', justifyContent: 'center', gap: 9 },
  statusText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  errorTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 24, paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  footerText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  footerAccent: { color: colors.accent, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
});
