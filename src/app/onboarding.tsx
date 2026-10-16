import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTest } from '@shared/taxonomy';
import type { TestId } from '@shared/types';
import { AVATARS, DAILY_GOALS } from '@shared/user';

import { GameButton } from '@/components/game-button';
import { Brand } from '@/constants/theme';
import { initUser } from '@/data/api';
import { useTheme } from '@/hooks/use-theme';

type Goal = { testDate: string; current: string; target: string };

export default function Onboarding() {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [tests, setTests] = useState<TestId[]>([]);
  const [goals, setGoals] = useState<Record<TestId, Goal>>({
    sat: { testDate: '', current: '', target: '' },
    act: { testDate: '', current: '', target: '' },
  });
  const [dailyXpGoal, setDailyXpGoal] = useState(50);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);

  const toggle = (t: TestId) => setTests((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const goalsValid = tests.every((t) => {
    const { min, max } = getTest(t).scale;
    const target = Number(goals[t].target);
    const current = goals[t].current ? Number(goals[t].current) : null;
    const dateOk = !goals[t].testDate || /^\d{4}-\d{2}-\d{2}$/.test(goals[t].testDate);
    return target >= min && target <= max && (current === null || (current >= min && current <= max)) && dateOk;
  });

  const finish = async () => {
    setSaving(true);
    try {
      await initUser({
        displayName: name.trim(),
        avatar,
        tests,
        activeTest: tests[0],
        goals: Object.fromEntries(
          tests.map((t) => [
            t,
            {
              testDate: goals[t].testDate || null,
              current: goals[t].current ? Number(goals[t].current) : null,
              target: Number(goals[t].target),
            },
          ]),
        ),
        dailyXpGoal,
        timezoneOffsetMin: -new Date().getTimezoneOffset(),
        placedUnits: { sat: [], act: [] },
      });
      // The session's user-doc listener flips `onboarded` and the router guard moves on.
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const steps = [
    {
      title: 'Which test are you taking?',
      valid: tests.length > 0,
      body: (['sat', 'act'] as TestId[]).map((t) => (
        <Option key={t} selected={tests.includes(t)} onPress={() => toggle(t)} title={getTest(t).name} color={t === 'sat' ? Brand.sat : Brand.act} />
      )),
    },
    {
      title: 'Set your goal',
      valid: goalsValid,
      body: tests.map((t) => {
        const { min, max } = getTest(t).scale;
        const set = (k: keyof Goal) => (v: string) => setGoals((g) => ({ ...g, [t]: { ...g[t], [k]: v } }));
        return (
          <View key={t} style={{ gap: 8 }}>
            <Text style={[styles.label, { color: theme.text }]}>{getTest(t).name}</Text>
            <Field value={goals[t].target} onChange={set('target')} placeholder={`Target score (${min}–${max})`} numeric />
            <Field value={goals[t].current} onChange={set('current')} placeholder="Current / practice score (optional)" numeric />
            <Field value={goals[t].testDate} onChange={set('testDate')} placeholder="Test date YYYY-MM-DD (optional)" />
          </View>
        );
      }),
    },
    {
      title: 'Pick a daily goal',
      valid: true,
      body: DAILY_GOALS.map((g) => (
        <Option key={g.xp} selected={dailyXpGoal === g.xp} onPress={() => setDailyXpGoal(g.xp)} title={`${g.label} · ${g.xp} XP / day`} color={Brand.flame} />
      )),
    },
    {
      title: 'Make your profile',
      valid: name.trim().length >= 2 && name.trim().length <= 20,
      body: (
        <View style={{ gap: 12 }}>
          <Field value={name} onChange={setName} placeholder="Display name (shown in leagues)" />
          <View style={styles.avatars}>
            {AVATARS.map((a) => (
              <Pressable key={a} onPress={() => setAvatar(a)} style={[styles.avatar, { borderColor: a === avatar ? Brand.primary : theme.backgroundSelected }]}>
                <Text style={{ fontSize: 34 }}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ),
    },
  ];
  const s = steps[step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[styles.h1, { color: theme.text }]}>{s.title}</Text>
        {s.body}
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 && <GameButton title="Back" variant="locked" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
        <GameButton
          title={step === steps.length - 1 ? (saving ? 'Saving…' : "Let's go") : 'Continue'}
          disabled={!s.valid || saving}
          onPress={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}
          style={{ flex: 2 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Option({ selected, onPress, title, color }: { selected: boolean; onPress: () => void; title: string; color: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.option, { borderColor: selected ? color : theme.backgroundSelected, backgroundColor: selected ? `${color}18` : 'transparent' }]}>
      <Text style={{ color: selected ? color : theme.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

function Field({ value, onChange, placeholder, numeric }: { value: string; onChange: (v: string) => void; placeholder: string; numeric?: boolean }) {
  const theme = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      keyboardType={numeric ? 'number-pad' : 'default'}
      style={[styles.field, { color: theme.text, borderColor: theme.backgroundSelected }]}
    />
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14 },
  h1: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  label: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  option: { borderWidth: 2, borderBottomWidth: 4, borderRadius: 16, padding: 18 },
  field: { borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 16 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatar: { borderWidth: 2, borderRadius: 14, padding: 8 },
  footer: { flexDirection: 'row', gap: 12, padding: 16 },
});
