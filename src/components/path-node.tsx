import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { SFSymbol } from 'sf-symbols-typescript';

import { LEVELS_PER_NODE, type NodeKind } from '@shared/progression/path';

import { Brand } from '@/constants/theme';

export type NodeState = 'locked' | 'current' | 'started' | 'complete' | 'legendary';

const SIZE = 72;
const DEPTH = 7;

const ICONS: Record<NodeKind, SFSymbol> = {
  skill: 'star.fill',
  review: 'arrow.triangle.2.circlepath',
  chest: 'shippingbox.fill',
  checkpoint: 'flag.checkered',
};

function colorsFor(state: NodeState, kind: NodeKind): [string, string] {
  if (state === 'locked') return [Brand.locked, Brand.lockedShade];
  if (state === 'legendary') return ['#7C3AED', '#5B21B6'];
  if (state === 'complete' || kind === 'chest') return [Brand.gold, Brand.goldShade];
  return [Brand.correct, Brand.correctShade];
}

export function PathNode({
  kind,
  state,
  level,
  offsetX,
  onPress,
}: {
  kind: NodeKind;
  state: NodeState;
  level: number;
  offsetX: number;
  onPress: () => void;
}) {
  const [face, shade] = colorsFor(state, kind);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (state !== 'current') return;
    bounce.value = withRepeat(
      withSequence(withTiming(-6, { duration: 500 }), withTiming(0, { duration: 500 })),
      -1,
    );
  }, [state, bounce]);
  const bubble = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <View style={[styles.wrap, { transform: [{ translateX: offsetX }] }]}>
      {state === 'current' && (
        <Animated.View style={[styles.bubble, bubble]}>
          <Text style={styles.bubbleText}>START</Text>
        </Animated.View>
      )}
      {kind === 'skill' && state !== 'locked' && <LevelRing level={level} />}
      <Pressable
        onPress={onPress}
        disabled={state === 'locked'}
        style={({ pressed }) => [styles.ledge, { backgroundColor: shade }, pressed && { paddingBottom: 2, marginTop: DEPTH - 2 }]}>
        <View style={[styles.face, { backgroundColor: face }]}>
          <SymbolView name={state === 'complete' && kind === 'skill' ? 'crown.fill' : ICONS[kind]} tintColor="#fff" size={30} />
        </View>
      </Pressable>
    </View>
  );
}

/** Segmented arc showing levels cleared, Duolingo-style. */
function LevelRing({ level }: { level: number }) {
  return (
    <View style={styles.ring} pointerEvents="none">
      {Array.from({ length: LEVELS_PER_NODE }, (_, i) => (
        <View key={i} style={[styles.pip, { backgroundColor: i < level ? Brand.gold : '#E5E7EB' }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 10 },
  ledge: { width: SIZE, height: SIZE + DEPTH, borderRadius: SIZE / 2, paddingBottom: DEPTH },
  face: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
  },
  bubbleText: { color: Brand.correct, fontWeight: 800, letterSpacing: 0.6 },
  ring: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  pip: { width: 12, height: 5, borderRadius: 3 },
});
