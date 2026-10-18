import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * SafeAreaView for screens presented as iOS modals (lesson, diagnostic). The native SafeAreaView
 * reports zero insets inside a full-screen modal, so content slides under the status bar and
 * Dynamic Island. This pads by the larger of the provider's insets and the insets measured at
 * launch, which stay valid because the app is portrait-only. Style padding is added on top,
 * as SafeAreaView does.
 */
export function ModalSafeArea({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const live = useSafeAreaInsets();
  const launch = initialWindowMetrics?.insets;
  const top = Math.max(live.top, launch?.top ?? 0);
  const bottom = Math.max(live.bottom, launch?.bottom ?? 0);
  const s = StyleSheet.flatten(style) ?? {};
  const base = (side: DimensionValue | undefined) => (typeof side === 'number' ? side : 0);
  return (
    <View
      style={[
        s,
        {
          paddingTop: base(s.paddingTop ?? s.paddingVertical ?? s.padding) + top,
          paddingBottom: base(s.paddingBottom ?? s.paddingVertical ?? s.padding) + bottom,
        },
      ]}>
      {children}
    </View>
  );
}
