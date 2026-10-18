import { doc, setDoc } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActionSheetIOS, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildPath, currentNode, isUnlocked, LEVELS_PER_NODE, type PathNode, type Unit } from '@shared/progression/path';
import { getTest } from '@shared/taxonomy';
import type { TestId } from '@shared/types';
import type { ProgressDoc } from '@shared/user';

import { PathNode as PathNodeView, type NodeState } from '@/components/path-node';
import { StatBar } from '@/components/stat-bar';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { auth, db } from '@/lib/firebase';
import { useSession } from '@/state/session';

/** Brand-new users see the diagnostic once per app launch until they take it or start lessons. */
let autoOpenedDiagnostic = false;

/** Horizontal offsets that make the path wind left and right. */
const WIND = [0, 44, 70, 44, 0, -44, -70, -44];

export default function LearnScreen() {
  const theme = useTheme();
  const { profile, progress } = useSession();
  const test = profile?.activeTest ?? 'sat';
  const units = useMemo(() => buildPath(test), [test]);
  const current = currentNode(units, progress.nodes);
  const states = useMemo(() => {
    const out = new Map<string, NodeState>();
    let pastCurrent = false;
    for (const node of units.flatMap((u) => u.nodes)) {
      // Strategy nodes have their own unlock rule and never block the main path.
      if (node.optional) {
        out.set(node.id, isUnlocked(units, progress.nodes, node.id) ? nodeState(node, progress, null, false) : 'locked');
        continue;
      }
      out.set(node.id, nodeState(node, progress, current, pastCurrent));
      if (node.id === current) pastCurrent = true;
    }
    return out;
  }, [units, progress, current]);

  const needsDiagnostic = !!profile && !progress.diagnostic?.[test];
  const fresh = Object.keys(progress.mastery).length === 0;
  useEffect(() => {
    if (!needsDiagnostic || !fresh || autoOpenedDiagnostic) return;
    autoOpenedDiagnostic = true;
    router.push({ pathname: '/diagnostic/[test]', params: { test } });
  }, [needsDiagnostic, fresh, test]);

  if (!profile) return null;

  /** Switch to the other test, adding it first if onboarding only picked one. */
  const switchTest = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const other: TestId = test === 'sat' ? 'act' : 'sat';
    const added = profile.tests.includes(other);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: added ? undefined : `Add ${getTest(other).name}? Your ${getTest(test).name} progress stays saved.`,
        options: [added ? `Switch to ${getTest(other).name}` : `Add ${getTest(other).name}`, 'Cancel'],
        cancelButtonIndex: 1,
      },
      (i) => {
        if (i !== 0) return;
        setDoc(doc(db, 'users', uid), { activeTest: other, ...(added ? {} : { tests: [...profile.tests, other] }) }, { merge: true }).catch((e) =>
          Alert.alert("Couldn't switch", e instanceof Error ? e.message : String(e)),
        );
      },
    );
  };

  const offsets = new Map(units.flatMap((u) => u.nodes).map((n, i) => [n.id, WIND[i % WIND.length]]));
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <StatBar profile={profile} onSwitchTest={switchTest} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {needsDiagnostic && (
          <Pressable onPress={() => router.push({ pathname: '/diagnostic/[test]', params: { test } })} style={[styles.diag, { borderColor: Brand.primary }]}>
            <Text style={[styles.diagTitle, { color: Brand.primary }]}>Find your starting point</Text>
            <Text style={{ color: theme.textSecondary, marginTop: 2 }}>A short diagnostic skips what you know and shows what to work on.</Text>
          </Pressable>
        )}
        {units.map((unit, u) => (
          <View key={unit.id}>
            <UnitBanner unit={unit} index={u} color={test === 'sat' ? Brand.sat : Brand.act} />
            {unit.nodes.map((node) => {
              const state = states.get(node.id) ?? 'locked';
              return (
                <PathNodeView
                  key={node.id}
                  kind={node.kind}
                  state={state}
                  level={progress.nodes[node.id]?.level ?? 0}
                  offsetX={offsets.get(node.id) ?? 0}
                  onPress={() => openNode(node, state, test, unit)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Path order decides locking: everything after the current node is locked. */
function nodeState(node: PathNode, progress: ProgressDoc, current: string | null, pastCurrent: boolean): NodeState {
  const p = progress.nodes[node.id];
  if (node.id === current) return 'current';
  if (pastCurrent) return 'locked';
  if (p?.legendary) return 'legendary';
  if ((p?.level ?? 0) >= LEVELS_PER_NODE || (node.kind !== 'skill' && (p?.level ?? 0) >= 1)) return 'complete';
  return 'started';
}

function openNode(node: PathNode, state: NodeState, test: string, unit: Unit) {
  if (state === 'locked') return;
  if (node.kind === 'chest') {
    if (state !== 'complete') router.push({ pathname: '/chest/[nodeId]', params: { nodeId: node.id } });
    return;
  }
  const go = (kind: 'lesson' | 'legendary' | 'checkpoint') =>
    router.push({ pathname: '/lesson/[nodeId]', params: { nodeId: node.id, test, kind, unit: unit.id } });

  if (node.kind === 'checkpoint') return go('checkpoint');
  if (state === 'complete' && node.kind === 'skill') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: node.title, options: ['Practice again', 'Legendary challenge', 'Cancel'], cancelButtonIndex: 2 },
      (i) => (i === 0 ? go('lesson') : i === 1 ? go('legendary') : undefined),
    );
    return;
  }
  go('lesson');
}

function UnitBanner({ unit, index, color }: { unit: Unit; index: number; color: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.bannerKicker}>
        UNIT {index + 1} · {unit.sectionName.toUpperCase()}
      </Text>
      <Text style={styles.bannerTitle}>{unit.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  banner: { borderRadius: 16, padding: 16, marginTop: 20, marginBottom: 8 },
  bannerKicker: { color: '#ffffffcc', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 },
  diag: { borderWidth: 2, borderBottomWidth: 4, borderRadius: 16, padding: 16, marginTop: 16 },
  diagTitle: { fontWeight: 800, fontSize: 18 },
  bannerTitle: { color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 2 },
});
