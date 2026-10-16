import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

const DEPTH = 4;

type Variant = 'primary' | 'correct' | 'wrong' | 'gold' | 'locked';

const COLORS: Record<Variant, [string, string]> = {
  primary: [Brand.primary, Brand.primaryShade],
  correct: [Brand.correct, Brand.correctShade],
  wrong: [Brand.wrong, Brand.wrongShade],
  gold: [Brand.gold, Brand.goldShade],
  locked: [Brand.locked, Brand.lockedShade],
};

/** Chunky "3D" button: a shade ledge underneath that the face presses down into. */
export function GameButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const pressed = useSharedValue(0);
  const [face, shade] = COLORS[disabled ? 'locked' : variant];
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * DEPTH }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => (pressed.value = withTiming(1, { duration: 60 }))}
      onPressOut={() => (pressed.value = withTiming(0, { duration: 90 }))}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.ledge, { backgroundColor: shade }, style]}>
      <Animated.View style={[styles.face, { backgroundColor: face }, faceStyle]}>
        <Text style={styles.label}>{title.toUpperCase()}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: { borderRadius: 16, paddingBottom: DEPTH },
  face: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  label: { color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: 0.8 },
});
