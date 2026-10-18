import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CompleteLessonRequest, CompleteLessonResponse } from '@shared/api';
import { isCorrect } from '@shared/grading';
import { buildPath, findNode, legendarySeconds } from '@shared/progression/path';
import { strategyCard, type StrategyCard } from '@shared/progression/strategy';
import { dayKey } from '@shared/progression/streak';
import type { Question, TestId } from '@shared/types';

import { GameButton } from '@/components/game-button';
import { MathText } from '@/components/math-text';
import { QuestionView } from '@/components/question-view';
import { Brand } from '@/constants/theme';
import { completeLesson, setBookmark } from '@/data/api';
import { buildLesson } from '@/data/lesson';
import { useTheme } from '@/hooks/use-theme';
import { newLine, setCalc } from '@/state/calculator';
import { useSession } from '@/state/session';

type Kind = CompleteLessonRequest['kind'];
/** Sections where the real test offers a graphing calculator (SAT: every Math item; ACT: online Math). */
const CALCULATOR_SECTIONS = new Set(['sat.math', 'act.math']);
const CHECKPOINT_MAX_MISSES = 3;

export default function LessonScreen() {
  const { nodeId, test, kind } = useLocalSearchParams<{ nodeId: string; test: TestId; kind: Kind }>();
  const theme = useTheme();
  const { progress } = useSession();

  const [queue, setQueue] = useState<Question[] | null>(null);
  const [total, setTotal] = useState(0);
  const [response, setResponse] = useState<number | string | null>(null);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<CompleteLessonResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const answers = useRef<CompleteLessonRequest['answers']>([]);
  const shownAt = useRef(Date.now());
  const misses = useRef(0);
  const card = kind === 'lesson' ? strategyCard(nodeId) : null;
  const [showCard, setShowCard] = useState(!!card);

  // Build the lesson once.
  useEffect(() => {
    buildLesson(test, nodeId, kind, progress).then((picked) => {
      setQueue(picked);
      setTotal(picked.length);
      if (kind === 'legendary') {
        const found = findNode(buildPath(test), nodeId);
        if (found) setSecondsLeft(legendarySeconds(found.node, picked.length));
      }
      shownAt.current = Date.now();
    });
    // Progress snapshot at lesson start is intentional; don't rebuild mid-lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, test, kind]);

  // Legendary countdown; running out fails the round.
  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) return void finish(false);
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, result]);

  async function finish(passed: boolean) {
    setSecondsLeft(null);
    setSubmitError(null);
    try {
      const res = await completeLesson({
        test,
        nodeId,
        kind,
        answers: answers.current,
        localDay: dayKey(new Date()),
      });
      setResult({ ...res.data, passed: res.data.passed && passed });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  }

  if (queue === null) return <Centered><ActivityIndicator /></Centered>;
  if (total === 0) {
    return (
      <Centered>
        <Text style={[styles.h2, { color: theme.text }]}>No approved questions for this skill yet.</Text>
        <GameButton title="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch', margin: 24 }} />
      </Centered>
    );
  }
  if (card && showCard) return <TrickCard card={card} onStart={() => setShowCard(false)} />;
  if (result) return <Summary result={result} kind={kind} />;
  if (queue.length === 0) {
    return (
      <Centered>
        {submitError ? (
          <>
            <Text style={[styles.h2, { color: theme.text }]}>Couldn’t save your lesson.</Text>
            <Text style={{ color: theme.textSecondary, margin: 12 }}>{submitError}</Text>
            <GameButton title="Retry" onPress={() => finish(true)} style={{ alignSelf: 'stretch', margin: 24 }} />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </Centered>
    );
  }

  const q = queue[0];
  const done = total - queue.length;
  const bookmarked = progress.bookmarks.includes(q.id);

  const check = () => {
    if (response === null) return;
    const ok = isCorrect(q, response);
    answers.current.push({ questionId: q.id, response, timeMs: Date.now() - shownAt.current });
    setChecked(ok);
    setRun((r) => (ok ? r + 1 : 0));
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    if (!ok) misses.current++;
  };

  const next = () => {
    const [, ...rest] = queue;
    let nextQueue = rest;
    let failed = false;
    if (checked === false) {
      if (kind === 'legendary') failed = true;
      else if (kind === 'checkpoint') failed = misses.current > CHECKPOINT_MAX_MISSES;
      // Lessons and practice re-ask misses at the end until they're answered right.
      else nextQueue = [...rest, q];
    }
    setResponse(null);
    setChecked(null);
    shownAt.current = Date.now();
    if (failed) {
      setQueue([]);
      finish(false);
      return;
    }
    setQueue(nextQueue);
    if (nextQueue.length === 0) finish(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <SymbolView name="xmark" tintColor={theme.textSecondary} size={22} />
        </Pressable>
        <ProgressBar value={done / total} />
        {CALCULATOR_SECTIONS.has(q.sectionId) && (
          <Pressable onPress={() => router.push('/calculator')} hitSlop={12} accessibilityLabel="Open calculator">
            <SymbolView name="function" tintColor={Brand.primary} size={22} />
          </Pressable>
        )}
        {secondsLeft !== null ? (
          <Text style={[styles.timer, { color: secondsLeft < 30 ? Brand.wrong : theme.text }]}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </Text>
        ) : (
          <Pressable onPress={() => setBookmark(q.id, !bookmarked)} hitSlop={12}>
            <SymbolView name={bookmarked ? 'bookmark.fill' : 'bookmark'} tintColor={Brand.primary} size={22} />
          </Pressable>
        )}
      </View>

      {run >= 3 && checked !== false && (
        <Animated.Text entering={FadeInDown} style={styles.combo}>
          {run} IN A ROW!
        </Animated.Text>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        <QuestionView q={q} response={response} onResponse={setResponse} checked={checked} />
      </ScrollView>

      {checked === null ? (
        <View style={styles.footer}>
          <GameButton title="Check" disabled={response === null} onPress={check} />
        </View>
      ) : (
        <Feedback correct={checked} question={q} onContinue={next} />
      )}
    </SafeAreaView>
  );
}

/** Strategy-unit intro: the trick, when to use it, and a preloaded calculator example. */
function TrickCard({ card, onStart }: { card: StrategyCard; onStart: () => void }) {
  const theme = useTheme();
  const tryIt = () => {
    setCalc((st) => ({ ...st, lines: card.example.map((t) => newLine(t)) }));
    router.push('/calculator');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <SymbolView name="xmark" tintColor={theme.textSecondary} size={22} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: 24 }]}>
        <Text style={[styles.kicker, { color: Brand.primary }]}>CALCULATOR TRICK</Text>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 16, lineHeight: 22 }}>{card.when}</Text>
        {card.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={[styles.stepNum, { color: Brand.primary }]}>{i + 1}</Text>
            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 22, flex: 1 }}>{step}</Text>
          </View>
        ))}
        <View style={[styles.watch, { borderColor: Brand.flame }]}>
          <Text style={{ color: Brand.flame, fontWeight: '800', marginBottom: 4 }}>Watch out</Text>
          <Text style={{ color: theme.text, fontSize: 15, lineHeight: 21 }}>{card.watchOut}</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, { gap: 10 }]}>
        <GameButton title="Try it in the calculator" variant="locked" onPress={tryIt} />
        <GameButton title="Start practice" onPress={onStart} />
      </View>
    </SafeAreaView>
  );
}

function ProgressBar({ value }: { value: number }) {
  const theme = useTheme();
  const fill = useAnimatedStyle(() => ({ width: withTiming(`${Math.max(4, value * 100)}%`) }));
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

function Feedback({ correct, question, onContinue }: { correct: boolean; question: Question; onContinue: () => void }) {
  const color = correct ? Brand.correct : Brand.wrong;
  return (
    <Animated.View entering={FadeInDown.duration(180)} style={[styles.feedback, { backgroundColor: correct ? '#DCFCE7' : '#FEE2E2' }]}>
      <View style={styles.feedbackHead}>
        <SymbolView name={correct ? 'checkmark.circle.fill' : 'xmark.circle.fill'} tintColor={color} size={28} />
        <Text style={[styles.feedbackTitle, { color }]}>{correct ? 'Nice!' : 'Not quite'}</Text>
      </View>
      <ScrollView style={{ maxHeight: 200 }}>
        <MathText style={{ fontSize: 15, color: '#1F2937' }}>{question.explanation}</MathText>
      </ScrollView>
      <GameButton title="Continue" variant={correct ? 'correct' : 'wrong'} onPress={onContinue} style={{ marginTop: 12 }} />
    </Animated.View>
  );
}

function Summary({ result, kind }: { result: CompleteLessonResponse; kind: Kind }) {
  const theme = useTheme();
  const accuracy = result.graded.length ? Math.round((100 * result.graded.filter((g) => g.correct).length) / result.graded.length) : 0;
  const title =
    kind === 'legendary' ? (result.passed ? 'Legendary!' : 'So close') : kind === 'checkpoint' ? (result.passed ? 'Unit skipped!' : 'Not yet') : 'Lesson complete!';
  return (
    <SafeAreaView style={[styles.summary, { backgroundColor: theme.background }]}>
      <Text style={[styles.h1, { color: Brand.gold }]}>{title}</Text>
      <View style={styles.tiles}>
        <Tile label="TOTAL XP" value={`${result.xp.total}`} color={Brand.gold} />
        <Tile label="ACCURACY" value={`${accuracy}%`} color={Brand.correct} />
        {result.gemsEarned > 0 && <Tile label="GEMS" value={`${result.gemsEarned}`} color={Brand.gem} />}
      </View>
      {result.streak.extended && (
        <Text style={[styles.h2, { color: Brand.flame }]}>
          🔥 {result.streak.count} day streak{result.streak.milestone ? ' — milestone!' : ''}
        </Text>
      )}
      {result.questsCompleted.map((q) => (
        <Text key={q} style={{ color: theme.text, marginTop: 6 }}>✓ Quest complete: {q}</Text>
      ))}
      <GameButton title="Continue" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 32 }} />
    </SafeAreaView>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { borderColor: color }]}>
      <Text style={[styles.tileLabel, { backgroundColor: color }]}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>{children}</View>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  track: { flex: 1, height: 16, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Brand.correct, borderRadius: 8 },
  timer: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  combo: { textAlign: 'center', color: Brand.flame, fontWeight: '800', letterSpacing: 1 },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  footer: { padding: 16 },
  kicker: { fontWeight: '800', letterSpacing: 0.5, fontSize: 13 },
  cardTitle: { fontSize: 28, fontWeight: '800' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { fontSize: 18, fontWeight: '800', width: 18 },
  watch: { borderWidth: 2, borderRadius: 14, padding: 14, marginTop: 6 },
  feedback: { padding: 16, paddingBottom: 28, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  feedbackTitle: { fontSize: 22, fontWeight: '800' },
  summary: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  h1: { fontSize: 34, fontWeight: '800' },
  h2: { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 24 },
  tile: { borderWidth: 2, borderRadius: 14, overflow: 'hidden', minWidth: 96, alignItems: 'center' },
  tileLabel: { color: '#fff', fontWeight: '800', fontSize: 12, alignSelf: 'stretch', textAlign: 'center', paddingVertical: 4 },
  tileValue: { fontSize: 22, fontWeight: '800', paddingVertical: 10 },
});
