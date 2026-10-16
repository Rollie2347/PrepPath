import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import type { OpenChestResponse } from '@shared/api';

import { GameButton } from '@/components/game-button';
import { Brand } from '@/constants/theme';
import { openChest } from '@/data/api';

export default function ChestScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const [reward, setReward] = useState<OpenChestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }));

  const open = async () => {
    shake.value = withSequence(withTiming(-12, { duration: 70 }), withTiming(12, { duration: 70 }), withTiming(0, { duration: 70 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      setReward((await openChest({ nodeId })).data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {reward ? (
          <Animated.View entering={ZoomIn} style={styles.center}>
            <SymbolView name="diamond.fill" tintColor={Brand.gem} size={64} />
            <Text style={styles.h1}>+{reward.gems} gems</Text>
            {reward.xpBoostMinutes > 0 && (
              <Text style={styles.sub}>2× XP for the next {reward.xpBoostMinutes} minutes!</Text>
            )}
            <GameButton title="Continue" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 20 }} />
          </Animated.View>
        ) : (
          <View style={styles.center}>
            <Pressable onPress={open}>
              <Animated.View style={shakeStyle}>
                <SymbolView name="shippingbox.fill" tintColor={Brand.gold} size={96} />
              </Animated.View>
            </Pressable>
            <Text style={styles.h1}>Tap to open</Text>
            {error && <Text style={[styles.sub, { color: Brand.wrong }]}>{error}</Text>}
            <Pressable onPress={() => router.back()}>
              <Text style={styles.sub}>Later</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28 },
  center: { alignItems: 'center', gap: 8 },
  h1: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 8 },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 4 },
});
