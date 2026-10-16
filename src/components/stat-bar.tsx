import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserDoc } from '@shared/user';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Top bar on the Learn tab: active test switcher, streak, gems, XP. */
export function StatBar({ profile, onSwitchTest }: { profile: UserDoc; onSwitchTest: () => void }) {
  const theme = useTheme();
  const { streak, gems, xp } = profile.game;
  const testColor = profile.activeTest === 'sat' ? Brand.sat : Brand.act;

  return (
    <View style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
      <Pressable onPress={onSwitchTest} style={[styles.test, { borderColor: testColor }]}>
        <Text style={[styles.testText, { color: testColor }]}>{profile.activeTest.toUpperCase()}</Text>
      </Pressable>
      <Stat icon="flame.fill" color={streak.count > 0 ? Brand.flame : Brand.locked} value={streak.count} />
      <Stat icon="diamond.fill" color={Brand.gem} value={gems} />
      <Stat icon="bolt.fill" color={Brand.gold} value={xp} />
    </View>
  );
}

function Stat({ icon, color, value }: { icon: 'flame.fill' | 'diamond.fill' | 'bolt.fill'; color: string; value: number }) {
  return (
    <View style={styles.stat}>
      <SymbolView name={icon} tintColor={color} size={22} />
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  test: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  testText: { fontWeight: 800 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontWeight: 800, fontSize: 16 },
});
