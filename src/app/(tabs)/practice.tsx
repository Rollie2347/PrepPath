import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

import { START_RATING } from '@shared/adaptive/elo';
import { getTest } from '@shared/taxonomy';

import { Brand } from '@/constants/theme';
import { PRACTICE } from '@/data/lesson';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

export default function PracticeScreen() {
  const theme = useTheme();
  const { profile, progress } = useSession();
  if (!profile) return null;
  const test = profile.activeTest;
  const start = (nodeId: string) => router.push({ pathname: '/lesson/[nodeId]', params: { nodeId, test, kind: 'practice' } });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.h1, { color: theme.text }]}>Practice hub</Text>
        <Card icon="arrow.uturn.backward.circle.fill" color={Brand.wrong} title="Fix mistakes" sub={`${progress.mistakes.length} to review`} disabled={!progress.mistakes.length} onPress={() => start(PRACTICE.mistakes)} />
        <Card icon="bookmark.fill" color={Brand.primary} title="Bookmarks" sub={`${progress.bookmarks.length} saved`} disabled={!progress.bookmarks.length} onPress={() => start(PRACTICE.bookmarks)} />
        <Card icon="target" color={Brand.flame} title="Weakest skills" sub="Drill your 3 lowest-rated skills" onPress={() => start(PRACTICE.weakest)} />
        <Card icon="flame.fill" color="#7C3AED" title="Hardest questions" sub="Top-difficulty only" onPress={() => start(PRACTICE.hardest)} />
        <Card icon="function" color={Brand.correct} title="Graphing calculator" sub="Graph, find intersections and zeros, use sliders" onPress={() => router.push('/calculator')} />

        {getTest(test).sections.map((section) => (
          <View key={section.id}>
            <Text style={[styles.h2, { color: theme.text }]}>{section.name}</Text>
            {section.domains.flatMap((d) =>
              d.skills.map((k) => {
                const m = progress.mastery[k.id];
                return (
                  <Pressable key={k.id} onPress={() => start(PRACTICE.skill(k.id))} style={[styles.skill, { borderColor: theme.backgroundSelected }]}>
                    <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{k.name}</Text>
                    <MasteryBar rating={m?.rating ?? START_RATING} />
                  </Pressable>
                );
              }),
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** 700 → empty, 1300 → full, matching the difficulty-1..5 rating span. */
function MasteryBar({ rating }: { rating: number }) {
  const pct = Math.min(1, Math.max(0, (rating - 700) / 600));
  return (
    <View style={styles.mTrack}>
      <View style={[styles.mFill, { width: `${pct * 100}%`, backgroundColor: pct > 0.66 ? Brand.gold : Brand.correct }]} />
    </View>
  );
}

function Card(props: { icon: SFSymbol; color: string; title: string; sub: string; disabled?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable disabled={props.disabled} onPress={props.onPress} style={[styles.card, { borderColor: theme.backgroundSelected, opacity: props.disabled ? 0.5 : 1 }]}>
      <SymbolView name={props.icon} tintColor={props.color} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>{props.title}</Text>
        <Text style={{ color: theme.textSecondary }}>{props.sub}</Text>
      </View>
      <SymbolView name="chevron.right" tintColor={theme.textSecondary} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 120 },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderBottomWidth: 4, borderRadius: 16, padding: 16 },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 12 },
  mTrack: { width: 70, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  mFill: { height: '100%', borderRadius: 4 },
});
