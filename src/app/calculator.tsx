import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalcGraph, CURVE_COLORS } from '@/components/calc-graph';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { evaluateLines, fmt } from '@/lib/calc/model';
import { HOME_VIEW, newLine, setCalc, useCalc } from '@/state/calculator';

/** Keys that are slow to type on the iOS keyboard. */
const KEYS = ['x', 'y', '^', '(', ')', '√', 'π', 'sin(', 'cos(', 'tan(', '='];

export default function CalculatorScreen() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const { lines, degrees, view } = useCalc();
  const [focused, setFocused] = useState<number | null>(lines[0]?.id ?? null);
  const selection = useRef<Record<number, { start: number; end: number }>>({});
  const body = useRef<View>(null);
  const list = useRef<ScrollView>(null);
  const added = useRef(false);
  const keyboardOverlap = useKeyboardOverlap(body);

  const results = useMemo(() => evaluateLines(lines.map((l) => l.text), degrees), [lines, degrees]);
  const selectedIndex = lines.findIndex((l) => l.id === focused);

  const update = (id: number, text: string) => setCalc((s) => ({ ...s, lines: s.lines.map((l) => (l.id === id ? { ...l, text } : l)) }));
  const insert = (key: string) => {
    const line = lines.find((l) => l.id === focused);
    if (!line) return;
    const sel = selection.current[line.id] ?? { start: line.text.length, end: line.text.length };
    const text = line.text.slice(0, sel.start) + key + line.text.slice(sel.end);
    selection.current[line.id] = { start: sel.start + key.length, end: sel.start + key.length };
    update(line.id, text);
  };
  const addLine = () => {
    const l = newLine();
    added.current = true;
    setCalc((s) => ({ ...s, lines: [...s.lines, l] }));
    setFocused(l.id);
  };
  const remove = (id: number) =>
    setCalc((s) => ({ ...s, lines: s.lines.length > 1 ? s.lines.filter((l) => l.id !== id) : [newLine()] }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <SymbolView name="xmark" tintColor={theme.textSecondary} size={20} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Graphing calculator</Text>
          <Pressable onPress={() => setCalc((s) => ({ ...s, degrees: !s.degrees }))} style={[styles.pill, { borderColor: theme.backgroundSelected }]}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>{degrees ? 'DEG' : 'RAD'}</Text>
          </Pressable>
          <Pressable onPress={() => setCalc((s) => ({ ...s, view: HOME_VIEW }))} hitSlop={12}>
            <SymbolView name="house" tintColor={theme.textSecondary} size={20} />
          </Pressable>
        </View>

        {/* Padding (not a frame change) so re-measuring on the next keyboard event stays stable. */}
        <View ref={body} style={{ flex: 1, paddingBottom: keyboardOverlap }}>
          <View style={styles.graph}>
            <CalcGraph
              results={results}
              hidden={lines.map((l) => l.hidden)}
              selected={selectedIndex >= 0 ? selectedIndex : null}
              view={view}
              onView={(f) => setCalc((s) => ({ ...s, view: f(s.view) }))}
              dark={dark}
            />
          </View>

          <View style={styles.panel}>
            <ScrollView
              ref={list}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
              onContentSizeChange={() => {
                if (added.current) list.current?.scrollToEnd();
                added.current = false;
              }}>
              {lines.map((l, i) => {
                const r = results[i];
                const color = CURVE_COLORS[i % CURVE_COLORS.length];
                return (
                  <View key={l.id} style={[styles.row, { borderColor: theme.backgroundSelected }]}>
                    <Pressable
                      onPress={() => setCalc((s) => ({ ...s, lines: s.lines.map((x) => (x.id === l.id ? { ...x, hidden: !x.hidden } : x)) }))}
                      style={[styles.dot, { borderColor: color, backgroundColor: l.hidden ? 'transparent' : color }]}
                      accessibilityLabel={l.hidden ? 'Show graph' : 'Hide graph'}
                    />
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={l.text}
                        onChangeText={(t) => update(l.id, t)}
                        onFocus={() => setFocused(l.id)}
                        onSelectionChange={(e) => (selection.current[l.id] = e.nativeEvent.selection)}
                        onSubmitEditing={addLine}
                        placeholder={i === 0 ? 'Type an expression, e.g. y = 2x + 1' : ''}
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        keyboardType="numbers-and-punctuation"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        style={[styles.input, { color: theme.text }]}
                      />
                      {r.kind === 'value' && <Text style={[styles.result, { color: theme.textSecondary }]}>= {fmt(r.value)}</Text>}
                      {r.kind === 'error' && <Text style={[styles.result, { color: Brand.wrong }]}>{r.message}</Text>}
                      {r.kind === 'param' && <ParamSlider name={r.name} value={r.value} onChange={(t) => update(l.id, t)} color={color} />}
                    </View>
                    <Pressable onPress={() => remove(l.id)} hitSlop={10}>
                      <SymbolView name="xmark.circle" tintColor={theme.textSecondary} size={18} />
                    </Pressable>
                  </View>
                );
              })}
              <Pressable onPress={addLine} style={styles.add}>
                <SymbolView name="plus" tintColor={Brand.primary} size={16} />
                <Text style={{ color: Brand.primary, fontWeight: '700' }}>Add expression</Text>
              </Pressable>
            </ScrollView>
            <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} style={[styles.keys, { borderColor: theme.backgroundSelected }]}>
              {KEYS.map((k) => (
                <Pressable key={k} onPress={() => insert(k)} style={[styles.key, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{k.replace('(', '')}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/**
 * How far the keyboard overlaps `ref`, measured in window coordinates. KeyboardAvoidingView
 * compares its parent-relative layout with the keyboard's screen position, so inside this page
 * sheet (which starts below the top of the screen) it under-pads and the keyboard covers the keys.
 */
function useKeyboardOverlap(ref: React.RefObject<View | null>) {
  const [overlap, setOverlap] = useState(0);
  useEffect(() => {
    const onShow = (e: { endCoordinates: { screenY: number } }) =>
      ref.current?.measureInWindow((_x, y, _w, h) => setOverlap(Math.max(0, y + h - e.endCoordinates.screenY)));
    const hide = () => setOverlap(0);
    const subs = [
      Keyboard.addListener('keyboardWillChangeFrame', onShow),
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardWillHide', hide),
      Keyboard.addListener('keyboardDidHide', hide),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [ref]);
  return overlap;
}

/** Slider for `a = 3`-style constants. The range grows to keep the value inside it. */
function ParamSlider({ name, value, onChange, color }: { name: string; value: number; onChange: (text: string) => void; color: string }) {
  const theme = useTheme();
  const bound = Math.max(10, Math.ceil(Math.abs(value) / 10) * 10);
  return (
    <View style={styles.slider}>
      <Text style={{ color: theme.textSecondary, width: 34 }}>{-bound}</Text>
      <Slider
        style={{ flex: 1 }}
        minimumValue={-bound}
        maximumValue={bound}
        step={bound / 100}
        value={value}
        minimumTrackTintColor={color}
        onValueChange={(v) => onChange(`${name} = ${fmt(v)}`)}
      />
      <Text style={{ color: theme.textSecondary, width: 34, textAlign: 'right' }}>{bound}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  pill: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  graph: { flex: 1.15 },
  panel: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  input: { fontSize: 18, paddingVertical: 4 },
  result: { fontSize: 14, marginTop: 2 },
  slider: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14 },
  keys: { flexGrow: 0, borderTopWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  key: { minWidth: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6, paddingHorizontal: 8 },
});
