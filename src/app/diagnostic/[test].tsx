import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DIAGNOSTIC, diagnosticPlan, MIX, pickBlock, routeMix, type DiagnosticBlock } from '@shared/adaptive/diagnostic';
import type { CompleteDiagnosticResponse } from '@shared/api';
import { isCorrect } from '@shared/grading';
import { allSkills, getSection, getTest } from '@shared/taxonomy';
import type { Question, TestId } from '@shared/types';

import { GameButton } from '@/components/game-button';
import { QuestionView } from '@/components/question-view';
import { Brand } from '@/constants/theme';
import { completeDiagnostic } from '@/data/api';
import { loadQuestions } from '@/data/questions';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

type Phase = 'loading' | 'intro' | 'question' | 'break' | 'saving' | 'done';
type Answer = { q: Question; response: number | string; timeMs: number };

const blockSize = (b: DiagnosticBlock) =>
  b.stage === 'routing' ? DIAGNOSTIC.routingItems : b.stage === 'routed' ? DIAGNOSTIC.routedItems : DIAGNOSTIC.linearItems;

export default function DiagnosticScreen() {
  const { test } = useLocalSearchParams<{ test: TestId }>();
  const theme = useTheme();
  const { progress } = useSession();
  const spec = getTest(test);

  const [phase, setPhase] = useState<Phase>('loading');
  const [pool, setPool] = useState<Question[]>([]);
  const [block, setBlock] = useState<{ info: DiagnosticBlock; items: Question[] } | null>(null);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<number | string | null>(null);
  const [result, setResult] = useState<CompleteDiagnosticResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plan = useRef<DiagnosticBlock[]>([]);
  const answers = useRef<Answer[]>([]);
  const shownAt = useRef(0);
  /** Render-side mirror of `plan` (refs cannot be read during render). */
  const [upcoming, setUpcoming] = useState<DiagnosticBlock[]>([]);

  useEffect(() => {
    loadQuestions(allSkills(test).map((k) => k.id)).then((qs) => {
      setPool(qs);
      plan.current = diagnosticPlan(test).filter((b) => qs.some((q) => q.sectionId === b.sectionId));
      setUpcoming([...plan.current]);
      setPhase('intro');
    });
  }, [test]);

  // Per-question timing starts when the question is on screen.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [block, index]);

  /** Starts the next non-empty block, or submits when the plan is used up. */
  const nextBlock = () => {
    while (plan.current.length) {
      const info = plan.current.shift()!;
      const section = getSection(info.sectionId);
      const sectionAnswers = answers.current.filter((a) => a.q.sectionId === info.sectionId);
      const mix =
        info.stage === 'routed'
          ? routeMix(sectionAnswers.map((a) => ({ skillId: a.q.skillId, difficulty: a.q.difficulty, correct: isCorrect(a.q, a.response) })))
          : MIX.routing;
      const used = new Set([...progress.recent, ...answers.current.map((a) => a.q.id)]);
      const items = pickBlock(pool, section, blockSize(info), mix, used);
      if (!items.length) continue;
      // SAT: the routed block follows its section's routing block.
      if (info.stage === 'routing') plan.current.unshift({ sectionId: info.sectionId, stage: 'routed' });
      setUpcoming([...plan.current]);
      setBlock({ info, items });
      setIndex(0);
      setResponse(null);
      setPhase('question');
      return;
    }
    void submit();
  };

  const submit = async () => {
    if (!answers.current.length) return router.back();
    setPhase('saving');
    setError(null);
    try {
      const res = await completeDiagnostic({
        test,
        answers: answers.current.map((a) => ({ questionId: a.q.id, response: a.response, timeMs: a.timeMs })),
      });
      setResult(res.data);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const next = () => {
    if (!block || response === null) return;
    answers.current.push({ q: block.items[index], response, timeMs: Date.now() - shownAt.current });
    setResponse(null);
    if (index + 1 < block.items.length) return setIndex(index + 1);
    if (upcoming.length) setPhase('break');
    else void submit();
  };

  const close = () => {
    if (!answers.current.length) return router.back();
    Alert.alert('Leave the diagnostic?', 'You can save what you have answered so far, or leave without saving.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Save and finish', onPress: () => void submit() },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (phase === 'loading') return <Centered><ActivityIndicator /></Centered>;

  if (phase === 'intro') {
    const sections = upcoming.map((b) => getSection(b.sectionId).name);
    const perSection = test === 'sat' ? DIAGNOSTIC.routingItems + DIAGNOSTIC.routedItems : DIAGNOSTIC.linearItems;
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <Text style={[styles.h1, { color: theme.text }]}>Find your starting point</Text>
        {sections.length ? (
          <>
            <Text style={[styles.p, { color: theme.textSecondary }]}>
              About {perSection} questions per section ({sections.join(', ')}). No feedback until the end, just like the real {spec.name}.
              {test === 'sat' ? ' After the first block of each section, the next one gets easier or harder based on how you did.' : ''}
            </Text>
            <Text style={[styles.p, { color: theme.textSecondary }]}>
              You can stop after any block. We use your answers to skip units you already know and to point you at what to work on first.
            </Text>
            <GameButton title="Start" onPress={nextBlock} style={{ alignSelf: 'stretch', marginTop: 24 }} />
          </>
        ) : (
          <Text style={[styles.p, { color: theme.textSecondary }]}>There are no {spec.name} questions to test with yet.</Text>
        )}
        <GameButton title="Not now" variant="locked" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      </SafeAreaView>
    );
  }

  if (phase === 'break' && block) {
    const nextName = getSection(upcoming[0].sectionId).name;
    const sameSection = upcoming[0].sectionId === block.info.sectionId;
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <Text style={[styles.h1, { color: theme.text }]}>Block done</Text>
        <Text style={[styles.p, { color: theme.textSecondary }]}>
          {sameSection ? `Next: a second ${nextName} block, matched to how you did.` : `Next: ${nextName}.`} More answers give a better placement.
        </Text>
        <GameButton title="Keep going" onPress={nextBlock} style={{ alignSelf: 'stretch', marginTop: 24 }} />
        <GameButton title="Enough for now" variant="locked" onPress={() => void submit()} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      </SafeAreaView>
    );
  }

  if (phase === 'saving') {
    return (
      <Centered>
        {error ? (
          <>
            <Text style={[styles.h2, { color: theme.text }]}>Couldn’t save your diagnostic.</Text>
            <Text style={{ color: theme.textSecondary, margin: 12, textAlign: 'center' }}>{error}</Text>
            <GameButton title="Retry" onPress={() => void submit()} style={{ alignSelf: 'stretch', margin: 24 }} />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </Centered>
    );
  }

  if (phase === 'done' && result) return <Results test={test} data={result} />;

  if (!block) return null;
  const q = block.items[index];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.top}>
        <Pressable onPress={close} hitSlop={12}>
          <SymbolView name="xmark" tintColor={theme.textSecondary} size={22} />
        </Pressable>
        <Text style={[styles.kicker, { color: theme.textSecondary, flex: 1 }]}>
          {getSection(block.info.sectionId).name.toUpperCase()} · {index + 1} / {block.items.length}
        </Text>
        {(q.sectionId === 'sat.math' || q.sectionId === 'act.math') && (
          <Pressable onPress={() => router.push('/calculator')} hitSlop={12} accessibilityLabel="Open calculator">
            <SymbolView name="function" tintColor={Brand.primary} size={22} />
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <QuestionView q={q} response={response} onResponse={setResponse} checked={null} reveal={false} />
      </ScrollView>
      <View style={styles.footer}>
        <GameButton title="Next" disabled={response === null} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

function Results({ test, data }: { test: TestId; data: CompleteDiagnosticResponse }) {
  const theme = useTheme();
  const spec = getTest(test);
  const domainName = new Map(spec.sections.flatMap((s) => s.domains.map((d) => [d.id, d.name] as const)));
  const { result, estimate } = data;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={[styles.page, { justifyContent: 'flex-start' }]}>
        <Text style={[styles.h1, { color: theme.text }]}>Your starting point</Text>
        <Text style={[styles.kicker, { color: theme.textSecondary, marginTop: 16 }]}>PROVISIONAL ESTIMATE</Text>
        <Text style={[styles.score, { color: Brand.gold }]}>
          {estimate.low}–{estimate.high}
        </Text>
        <Text style={[styles.p, { color: theme.textSecondary }]}>
          A rough range from a short diagnostic, not an official score. It firms up as you practice.
        </Text>

        {result.focus.length > 0 && (
          <>
            <Text style={[styles.h2, { color: theme.text }]}>Work on first</Text>
            {result.focus.map((id) => (
              <DomainRow key={id} name={domainName.get(id) ?? id} r={result.domains[id]} color={Brand.flame} />
            ))}
          </>
        )}
        {result.placedUnits.length > 0 && (
          <>
            <Text style={[styles.h2, { color: theme.text }]}>Already strong</Text>
            <Text style={[styles.p, { color: theme.textSecondary }]}>We opened these units for you. Their checkpoints are there if you want to prove it.</Text>
            {result.placedUnits.map((id) => (
              <DomainRow key={id} name={domainName.get(id) ?? id} r={result.domains[id]} color={Brand.correct} />
            ))}
          </>
        )}
        <Text style={[styles.p, { color: theme.textSecondary, marginTop: 16 }]}>Missed questions are waiting in Practice → Fix mistakes.</Text>
        <GameButton title="Start learning" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainRow({ name, r, color }: { name: string; r: { items: number; correct: number } | undefined; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: color }]}>
      <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{name}</Text>
      {r && <Text style={{ color, fontWeight: '800' }}>{r.correct}/{r.items}</Text>}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  kicker: { fontWeight: '800', letterSpacing: 0.5, fontSize: 13 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  footer: { padding: 16 },
  h1: { fontSize: 30, fontWeight: '800' },
  h2: { fontSize: 20, fontWeight: '800', marginTop: 24 },
  p: { fontSize: 16, lineHeight: 23, marginTop: 10 },
  score: { fontSize: 44, fontWeight: '800', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, padding: 14, marginTop: 10 },
});
