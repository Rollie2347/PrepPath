import { doc, setDoc } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActionSheetIOS, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildPath, currentNode, LEVELS_PER_NODE, type PathNode, type Unit } from '@shared/progression/path';
import type { ProgressDoc } from '@shared/user';

import { PathNode as PathNodeView, type NodeState } from '@/components/path-node';
import { StatBar } from '@/components/stat-bar';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { auth, db } from '@/lib/firebase';
import { useSession } from '@/state/session';

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
      out.set(node.id, nodeState(node, progress, current, pastCurrent));
      if (node.id === current) pastCurrent = true;
    }
    return out;
  }, [units, progress, current]);

  if (!profile) return null;

  const switchTest = () => {
    const other = profile.tests.find((t) => t !== test);
    if (!other || !auth.currentUser) return;
    setDoc(doc(db, 'users', auth.currentUser.uid), { activeTest: other }, { merge: true });
  };

  const offsets = new Map(units.flatMap((u) => u.nodes).map((n, i) => [n.id, WIND[i % WIND.length]]));
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <StatBar profile={profile} onSwitchTest={switchTest} />
      <ScrollView contentContainerStyle={styles.scroll}>
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
  bannerTitle: { color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 2 },
});
