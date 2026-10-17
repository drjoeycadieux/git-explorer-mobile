import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Pressable,
  RefreshControl,
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
import {
  fetchProfile,
  fetchUserRepositories,
  type GitHubProfile,
  type GitHubRepository,
} from '@/lib/github';

const colors = {
  background: '#0d1310',
  surface: '#141c19',
  surfaceRaised: '#1b2822',
  border: '#293630',
  text: '#f1f4ed',
  muted: '#96a69c',
  accent: '#c7f36b',
  warm: '#f0a876',
};

type SortMode = 'updated' | 'stars';

function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: value >= 1000 ? 'compact' : 'standard' }).format(
    value,
  );
}

export default function HomeScreen() {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [repositoryQuery, setRepositoryQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadProfile(value: string, isRefresh = false) {
    const cleanUsername = value.trim().replace(/^@/, '');
    if (!cleanUsername) {
      setError('Enter a GitHub username to get started.');
      return;
    }

    Keyboard.dismiss();
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [nextProfile, nextRepositories] = await Promise.all([
        fetchProfile(cleanUsername),
        fetchUserRepositories(cleanUsername),
      ]);
      setProfile(nextProfile);
      setRepositories(nextRepositories);
      setUsername(nextProfile.login);
      setRepositoryQuery('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reach GitHub. Try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const visibleRepositories = repositories
    .filter((repository) => {
      const query = repositoryQuery.trim().toLowerCase();
      if (!query) return true;
      return [repository.name, repository.description, repository.language, ...(repository.topics ?? [])]
        .some((part) => part?.toLowerCase().includes(query));
    })
    .sort((left, right) =>
      sortMode === 'stars'
        ? right.stargazers_count - left.stargazers_count
        : Date.parse(right.updated_at) - Date.parse(left.updated_at),
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (profile) void loadProfile(profile.login, true);
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        <View style={styles.topline}>
          <View style={styles.brandMark}><View style={styles.brandMarkCore} /></View>
          <Text style={styles.brand}>GITHUB / FIELD NOTES</Text>
          <Text style={styles.issueNumber}>01</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>THE PEOPLE BEHIND THE CODE</Text>
          <Text style={styles.headline}>Find a profile.{ '\n' }Follow the work.</Text>
          <Text style={styles.intro}>A closer look at the public repositories shaping the open web.</Text>
        </View>

        <View style={styles.searchBlock}>
          <Text style={styles.fieldLabel}>GITHUB USERNAME</Text>
          <View style={styles.searchBar}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              accessibilityLabel="GitHub username"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onChangeText={setUsername}
              onSubmitEditing={() => void loadProfile(username)}
              placeholder="e.g. torvalds"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={styles.searchInput}
              value={username}
            />
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void loadProfile(username)}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Find profile</Text>
              )}
            </Pressable>
          </View>
          {!profile ? (
            <View style={styles.examples}>
              <Text style={styles.exampleLabel}>TRY</Text>
              {['torvalds', 'sindresorhus', 'yyx990803'].map((example) => (
                <Pressable
                  accessibilityRole="button"
                  key={example}
                  onPress={() => {
                    setUsername(example);
                    void loadProfile(example);
                  }}>
                  <Text style={styles.exampleName}>@{example}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load that profile</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {profile ? (
          <View style={styles.results}>
            <View style={styles.profileCard}>
              <View style={styles.profileTopline}>
                <Text style={styles.sectionKicker}>PROFILE / 001</Text>
                <Pressable onPress={() => void Linking.openURL(profile.html_url)}>
                  <Text style={styles.profileLink}>View on GitHub</Text>
                </Pressable>
              </View>
              <View style={styles.identity}>
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                <View style={styles.identityCopy}>
                  <Text numberOfLines={1} style={styles.displayName}>{profile.name || profile.login}</Text>
                  <Text style={styles.login}>@{profile.login}</Text>
                </View>
              </View>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
              {(profile.company || profile.location) ? (
                <View style={styles.metaLine}>
                  {profile.company ? <Text style={styles.metaText}>{profile.company}</Text> : null}
                  {profile.company && profile.location ? <Text style={styles.metaDivider}>/</Text> : null}
                  {profile.location ? <Text style={styles.metaText}>{profile.location}</Text> : null}
                </View>
              ) : null}
              <View style={styles.stats}>
                <ProfileStat label="REPOSITORIES" value={formatCount(profile.public_repos)} />
                <ProfileStat label="FOLLOWERS" value={formatCount(profile.followers)} />
                <ProfileStat label="FOLLOWING" value={formatCount(profile.following)} />
              </View>
            </View>

            <View style={styles.repoSection}>
              <View style={styles.repoHeading}>
                <View>
                  <Text style={styles.sectionKicker}>THE WORK</Text>
                  <Text style={styles.repoTitle}>Public repositories</Text>
                </View>
                <Text style={styles.repoTotal}>{repositories.length} loaded</Text>
              </View>
              <TextInput
                accessibilityLabel="Filter repositories"
                autoCapitalize="none"
                onChangeText={setRepositoryQuery}
                placeholder="Filter by name, language, topic..."
                placeholderTextColor={colors.muted}
                style={styles.filterInput}
                value={repositoryQuery}
              />
              <View style={styles.sortRow}>
                <Text style={styles.fieldLabel}>SORT BY</Text>
                <View style={styles.sortControl}>
                  <SortButton active={sortMode === 'updated'} label="Recently updated" onPress={() => setSortMode('updated')} />
                  <SortButton active={sortMode === 'stars'} label="Most stars" onPress={() => setSortMode('stars')} />
                </View>
              </View>
              {visibleRepositories.length ? (
                <View style={styles.repositoryList}>
                  {visibleRepositories.map((repository) => (
                    <RepositoryRow key={repository.id} repository={repository} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No matches in this profile</Text>
                  <Text style={styles.emptyText}>Try another repository name, language, or topic.</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyRule} />
            <Text style={styles.emptyStateTitle}>One name, a thousand rabbit holes.</Text>
            <Text style={styles.emptyStateCopy}>Search a developer to browse their public work, languages, and most-loved projects.</Text>
            <View style={styles.emptyStamp}><Text style={styles.emptyStampText}>PUBLIC DATA - NO SIGN-IN</Text></View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>BUILT ON THE GITHUB REST API</Text>
          <Text style={styles.footerAccent}>OPEN SOURCE, OPEN BOOK.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SortButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.sortButton, active && styles.sortButtonActive]}>
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: BottomTabInset + 36 },
  topline: { height: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  brandMark: { width: 19, height: 19, borderRadius: 10, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brandMarkCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  brand: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  issueNumber: { marginLeft: 'auto', color: colors.muted, fontSize: 11 },
  hero: { paddingTop: 35, paddingBottom: 24 },
  eyebrow: { color: colors.warm, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 13 },
  headline: { color: colors.text, fontSize: 37, lineHeight: 41, fontWeight: '700' },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 340 },
  searchBlock: { padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  searchBar: { flexDirection: 'row', height: 48, alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 6, marginTop: 8, paddingLeft: 12 },
  atSign: { color: colors.accent, fontSize: 17, fontWeight: '700' },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 9, color: colors.text, fontSize: 14, height: '100%' },
  searchButton: { alignSelf: 'stretch', minWidth: 102, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: colors.accent, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  searchButtonText: { color: colors.background, fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 12 },
  exampleLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  exampleName: { color: colors.accent, fontSize: 11 },
  errorBox: { marginTop: 16, padding: 14, borderWidth: 1, borderColor: '#754939', borderRadius: 8, backgroundColor: '#281b16', gap: 5 },
  errorTitle: { color: colors.warm, fontSize: 12, fontWeight: '700' },
  errorText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  results: { marginTop: 24, gap: 28 },
  profileCard: { padding: 17, borderRadius: 8, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  profileTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionKicker: { color: colors.warm, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  profileLink: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 18 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.border },
  identityCopy: { flex: 1 },
  displayName: { color: colors.text, fontSize: 21, fontWeight: '700' },
  login: { color: colors.muted, fontSize: 13, marginTop: 3 },
  bio: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 16 },
  metaLine: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  metaText: { color: colors.muted, fontSize: 11 },
  metaDivider: { color: colors.warm, fontSize: 11 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 18, paddingTop: 14, gap: 20 },
  stat: { gap: 4 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  repoSection: { gap: 13 },
  repoHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  repoTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 5 },
  repoTotal: { color: colors.muted, fontSize: 10, paddingBottom: 2 },
  filterInput: { height: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontSize: 12 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  sortControl: { flexDirection: 'row', backgroundColor: colors.surface, padding: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  sortButton: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 4 },
  sortButtonActive: { backgroundColor: colors.surfaceRaised },
  sortButtonText: { color: colors.muted, fontSize: 10 },
  sortButtonTextActive: { color: colors.accent, fontWeight: '700' },
  repositoryList: { gap: 9 },
  emptyBox: { padding: 16, backgroundColor: colors.surface, borderRadius: 8, gap: 5 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  emptyState: { paddingTop: 34, paddingBottom: 28, alignItems: 'flex-start' },
  emptyRule: { width: 40, height: 2, backgroundColor: colors.warm, marginBottom: 16 },
  emptyStateTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyStateCopy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 360 },
  emptyStamp: { marginTop: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8 },
  emptyStampText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 },
  footerText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  footerAccent: { color: colors.accent, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
});
