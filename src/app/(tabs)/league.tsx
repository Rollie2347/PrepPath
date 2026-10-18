import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMOTE, PROMOTE, TIERS } from '@shared/progression/league';

import { Brand } from '@/constants/theme';
import { blockUser, reportUser } from '@/data/api';
import { useTheme } from '@/hooks/use-theme';
import { db } from '@/lib/firebase';
import { useSession } from '@/state/session';

interface CohortDoc {
  tier: number;
  weekId: string;
  endsAt: number;
  members: Record<string, { name: string; avatar: string; weeklyXp: number; lastXpAt: number }>;
}

export default function LeagueScreen() {
  const theme = useTheme();
  const { user, profile } = useSession();
  const [snap, setSnap] = useState<{ id: string; data: CohortDoc; daysLeft: number } | null>(null);
  const cohortId = profile?.game.leagueCohort;

  useEffect(() => {
    if (!cohortId) return;
    return onSnapshot(doc(db, 'leagues', cohortId), (s) => {
      const data = s.data() as CohortDoc | undefined;
      setSnap(data ? { id: cohortId, data, daysLeft: Math.max(0, Math.ceil((data.endsAt - Date.now()) / 86_400_000)) } : null);
    });
  }, [cohortId]);

  if (!profile) return null;
  // Ignore a stale snapshot from last week's cohort while the new one loads.
  const cohort = snap && snap.id === cohortId ? snap.data : null;
  const tier = TIERS[profile.game.leagueTier];

  if (!cohort) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.h1, { color: theme.text }]}>{tier} League</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
          Finish a lesson to join this week’s league.
        </Text>
      </SafeAreaView>
    );
  }

  const blocked = new Set(profile.blocked ?? []);
  const ranked = Object.entries(cohort.members)
    .filter(([uid]) => !blocked.has(uid))
    .map(([uid, m]) => ({ uid, ...m }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp || a.lastXpAt - b.lastXpAt);
  const daysLeft = snap?.daysLeft ?? 0;
  const canPromote = cohort.tier < TIERS.length - 1;
  const canDemote = cohort.tier > 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.head}>
        <Text style={[styles.h1, { color: theme.text }]}>{TIERS[cohort.tier]} League</Text>
        <Text style={{ color: theme.textSecondary }}>
          Top {PROMOTE} advance · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
        </Text>
      </View>
      <FlatList
        data={ranked}
        keyExtractor={(m) => m.uid}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const zone = canPromote && index < PROMOTE ? 'up' : canDemote && index >= ranked.length - DEMOTE ? 'down' : null;
          return (
            <View>
              {canPromote && index === PROMOTE && <Divider label="PROMOTION ZONE ↑" color={Brand.correct} />}
              {canDemote && index === ranked.length - DEMOTE && <Divider label="DEMOTION ZONE ↓" color={Brand.wrong} />}
              <Pressable
                disabled={item.uid === user?.uid}
                onPress={() => memberActions(item.uid, item.name, snap!.id)}
                accessibilityHint="Report or block this player"
                style={[styles.row, item.uid === user?.uid && { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.rank, { color: zone === 'up' ? Brand.correct : zone === 'down' ? Brand.wrong : theme.textSecondary }]}>
                  {index + 1}
                </Text>
                <Text style={styles.avatar}>{item.avatar}</Text>
                <Text style={{ color: theme.text, flex: 1, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{item.weeklyXp} XP</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

/** Report (also hides) or just block another league member. App Store 1.2. */
function memberActions(uid: string, name: string, cohortId: string) {
  const fail = (e: unknown) => Alert.alert('Something went wrong', e instanceof Error ? e.message : String(e));
  ActionSheetIOS.showActionSheetWithOptions(
    { title: name, options: ['Report name', 'Block', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 2 },
    (i) => {
      if (i === 0)
        reportUser({ uid, cohortId })
          .then(() => Alert.alert('Thanks for reporting', "We'll review this name. You won't see this player anymore."))
          .catch(fail);
      if (i === 1) blockUser(uid).catch(fail);
    },
  );
}

function Divider({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.divider, { color }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  head: { padding: 16, alignItems: 'center' },
  h1: { fontSize: 26, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rank: { width: 28, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  avatar: { fontSize: 26 },
  divider: { textAlign: 'center', fontWeight: '800', fontSize: 12, letterSpacing: 1, paddingVertical: 6 },
});
